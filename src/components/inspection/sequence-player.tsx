"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The pre-rendered diagram (touch tier, and the desktop stage when WebGL can't run): 24 AVIF
 * frames per part (960 × 600, the same camera and explode curve as the WebGL view), drawn on a 2D
 * canvas by scroll progress. Frames are fetched once a part is within a viewport; decoded bitmaps
 * live in a small LRU (8 per part) so memory stays flat. Callout anchors come from anchors.json and
 * are published through the DiagramDrive exactly like the WebGL projection. On the brake, a moved
 * wear ruler swaps in the matching wear still (10/7/5/3/1/0 mm).
 *
 * No three.js in here: this runs on phones.
 */
import { useEffect, useRef } from "react";
import type { AnchorPoint, DiagramDrive } from "@/components/three/lazy-diagram";
import { ITEMS, TIMING, WEAR, explodeAt, nearestWearStill } from "@/data/inspection";
import { FRAMES, FRAME_COUNT, WEAR_STILLS, type PartId } from "@/data/media";
import { cx } from "@/lib/cx";

const LRU_SIZE = 8;
const ASPECT = 1.6;

type JsonAnchor = { id: number; x: number; y: number; occluded?: boolean };

/** anchors.json as the assets stream writes it (top-left origin, normalized; brake adds wear). */
interface AnchorsJson {
  frames?: Array<{ i: number; anchors: JsonAnchor[] }>;
  wear?: { anchors?: Record<string, JsonAnchor[]> };
}

/** `hidden`: the anchor is behind another part in this frame (no dot is drawn there). */
type Norm = Array<{ n: number; x: number; y: number; hidden?: boolean }>;
/** Per frame: each anchor's normalized position on the 960 × 600 frame. */
export type NormAnchors = Norm[];

interface ParsedAnchors {
  frames: Norm[];
  /** Brake only: anchors on each wear still, keyed by millimetres ("10" … "0"). */
  wear: Record<string, Norm>;
}

interface PartCache {
  /** One fetch per frame, so the frame on screen draws as soon as its own file lands. */
  blobs: Promise<Blob | null>[] | null;
  parsed: Promise<ParsedAnchors> | null;
  anchors: Promise<Norm[]> | null;
  bitmaps: Map<string, ImageBitmap>;
  decoding: Map<string, Promise<ImageBitmap | null>>;
}

const caches = new Map<PartId, PartCache>();

function cacheFor(part: PartId): PartCache {
  let c = caches.get(part);
  if (!c) {
    c = { blobs: null, parsed: null, anchors: null, bitmaps: new Map(), decoding: new Map() };
    caches.set(part, c);
  }
  return c;
}

const toNorm = (list: readonly JsonAnchor[] | undefined): Norm =>
  (list ?? []).map((a) => ({ n: a.id, x: a.x, y: a.y, hidden: a.occluded === true }));

function loadParsed(part: PartId): Promise<ParsedAnchors> {
  const c = cacheFor(part);
  c.parsed ??= fetch(FRAMES[part].anchors)
    .then((r) => (r.ok ? (r.json() as Promise<AnchorsJson>) : ({} as AnchorsJson)))
    .then((json) => ({
      frames: Array.from({ length: FRAME_COUNT }, (_, i) => toNorm((json.frames?.find((fr) => fr.i === i) ?? json.frames?.[i])?.anchors)),
      wear: Object.fromEntries(Object.entries(json.wear?.anchors ?? {}).map(([k, v]) => [k, toNorm(v)])),
    }))
    .catch(() => ({ frames: Array.from({ length: FRAME_COUNT }, () => []), wear: {} }));
  return c.parsed;
}

const fetchBlob = (url: string) =>
  fetch(url)
    .then((r) => (r.ok ? r.blob() : null))
    .catch(() => null);

/**
 * Phones (one player per part, touch tier) use 16 of the 24 frames, evenly spread: the scrub
 * still reads as continuous at phone size and the four parts cost about a third less to download.
 */
const SPARSE_FRAMES: ReadonlySet<number> = new Set(Array.from({ length: 16 }, (_, k) => Math.round((k * (FRAME_COUNT - 1)) / 15)));

/** The nearest frame in the sparse set. */
function sparseIndex(index: number): number {
  let best = 0;
  for (const i of SPARSE_FRAMES) if (Math.abs(i - index) < Math.abs(best - index)) best = i;
  return best;
}

/** Start fetching a part's frames (all 24, or the sparse 16) and anchors (idempotent). */
export function prefetchFrames(part: PartId, sparse = false) {
  const c = cacheFor(part);
  c.blobs ??= [];
  const blobs = c.blobs;
  FRAMES[part].frames.forEach((url, i) => {
    if (!sparse || SPARSE_FRAMES.has(i)) blobs[i] ??= fetchBlob(url);
  });
  c.anchors ??= loadAnchors(part);
}

/** Normalized anchors per frame (0–1 on the 960 × 600 frame), from anchors.json. */
export function loadAnchors(part: PartId): Promise<Norm[]> {
  const c = cacheFor(part);
  c.anchors ??= loadParsed(part).then((p) => p.frames);
  return c.anchors;
}

async function bitmapFor(part: PartId, key: string, blob: () => Promise<Blob | null>): Promise<ImageBitmap | null> {
  const c = cacheFor(part);
  const hit = c.bitmaps.get(key);
  if (hit) {
    c.bitmaps.delete(key);
    c.bitmaps.set(key, hit);
    return hit;
  }
  const pending = c.decoding.get(key);
  if (pending) return pending;
  const job = blob()
    .then((b) => (b ? createImageBitmap(b) : null))
    .catch(() => null)
    .then((bmp) => {
      c.decoding.delete(key);
      if (!bmp) return null;
      c.bitmaps.set(key, bmp);
      while (c.bitmaps.size > LRU_SIZE) {
        const oldest = c.bitmaps.keys().next().value as string;
        c.bitmaps.get(oldest)?.close();
        c.bitmaps.delete(oldest);
      }
      return bmp;
    });
  c.decoding.set(key, job);
  return job;
}

/** Which frame (or wear still) to show for an item's local progress, and how opaque. */
function pick(p: number, item: number) {
  if (p < TIMING.assembleEnd) {
    // Frames can't show 1.6×; the part fades in on frame 0 while it would be assembling.
    return { index: 0, alpha: 1 - explodeAt(p, item) / TIMING.assembleFrom };
  }
  const u = (p - TIMING.assembleEnd) / (TIMING.explodeEnd - TIMING.assembleEnd);
  return { index: Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(u * (FRAME_COUNT - 1)))), alpha: 1 };
}

export function SequencePlayer({
  part: fixedPart,
  drive,
  className,
}: {
  /** Touch: one player per part. Omit to follow the drive's active item (desktop fallback). */
  part?: PartId;
  drive: DiagramDrive;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let raf = 0;
    let disposed = false;
    let drawn = "";
    let cssW = 0;
    let cssH = 0;
    let near = false;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = r.width;
      cssH = r.height;
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawn = "";
      schedule();
    };

    const box = () => {
      const ins = drive.insets;
      const innerW = Math.max(1, cssW - ins.left - ins.right);
      const innerH = Math.max(1, cssH - ins.top - ins.bottom);
      const w = Math.min(innerW, innerH * ASPECT);
      const h = w / ASPECT;
      return { left: ins.left + (innerW - w) / 2, top: ins.top + (innerH - h) / 2, width: w, height: h };
    };

    const draw = async () => {
      raf = 0;
      if (disposed || !cssW) return;
      const { item, p } = drive.state;
      const part = fixedPart ?? ITEMS[item]?.part ?? "brake";
      if (fixedPart && ITEMS[item]?.part !== fixedPart) return;
      const sparse = Boolean(fixedPart);
      prefetchFrames(part, sparse);
      const c = cacheFor(part);
      const picked = pick(p, item);
      const index = sparse ? sparseIndex(picked.index) : picked.index;
      const alpha = picked.alpha;
      const wear = drive.wear;
      const useWear = part === "brake" && p >= TIMING.explodeEnd && wear !== WEAR.asFound;
      const still = nearestWearStill(wear);
      const key = useWear ? `wear-${still}` : `f${index}`;
      const stamp = `${part}:${key}:${alpha.toFixed(3)}:${cssW}x${cssH}:${drive.insets.left}`;

      const blobs = c.blobs!;
      const parsed = await loadParsed(part);
      const anchors = parsed.frames;
      if (disposed) return;
      const bmp = await bitmapFor(part, key, () =>
        useWear ? fetchBlob(WEAR_STILLS[still]) : (blobs[index] ?? Promise.resolve(null)),
      );
      if (disposed || !bmp) return;
      // A newer frame may have been asked for while this one decoded: skip this one, unless the
      // canvas has nothing of this part on it yet (an older frame beats an empty box).
      const now = drive.state;
      if (now.item !== item || now.p !== p) {
        schedule();
        if (drawn.startsWith(`${part}:`)) return;
      }
      const b = box();
      if (stamp !== drawn) {
        drawn = stamp;
        ctx.clearRect(0, 0, cssW, cssH);
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.drawImage(bmp, b.left, b.top, b.width, b.height);
        ctx.globalAlpha = 1;
      }
      // A wear still has its own anchors (the wear tab moves as the pad thins).
      const norm = (useWear ? parsed.wear[String(still)] : undefined) ?? anchors[useWear ? FRAME_COUNT - 1 : index] ?? [];
      const layoutNorm = anchors[FRAME_COUNT - 1] ?? [];
      const toPx = (a: Norm[number]): AnchorPoint => ({
        n: a.n,
        x: b.left + a.x * b.width,
        y: b.top + a.y * b.height,
        // Never put a dot on a part that's hidden behind another one in this frame.
        visible: alpha > 0.5 && !a.hidden,
      });
      drive.publish({ item, p, anchors: norm.map(toPx), layout: layoutNorm.map(toPx), width: cssW, height: cssH, source: "frames" });
    };

    const schedule = () => {
      if (!raf && near) raf = requestAnimationFrame(() => void draw());
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        near = entry.isIntersecting;
        if (near) {
          prefetchFrames(fixedPart ?? ITEMS[drive.state.item]?.part ?? "brake", Boolean(fixedPart));
          schedule();
        }
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(canvas);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const off = drive.onTick(schedule);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      off();
    };
  }, [drive, fixedPart]);

  return <canvas ref={canvasRef} aria-hidden="true" className={cx("absolute inset-0 size-full", className)} />;
}
