"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Numbered callouts over the diagram (spec §11.3/§14): HTML dots on every Anchor_n and ink
 * leader lines to labels in the side gutters, drawn in one after another (INK) across 55–85% of
 * the item's scroll.
 *
 * Positions come from the renderer each frame through the DiagramDrive (WebGL projection, or
 * anchors.json for the frame player) and are written straight to the DOM: scrolling never
 * re-renders React. Labels are laid out once per part and size from the fully exploded, square-on
 * pose: each goes to the gutter on its anchor's side (balanced), sorted by height so leaders never
 * cross, then nudged apart. Narrow stages (and touch) show the numbered dots only; the parts list
 * carries the words.
 */
import { useEffect, useRef } from "react";
import type { AnchorPoint, DiagramDrive, DiagramFrame } from "@/components/three/lazy-diagram";
import { inkAt, type Callout, type InspectionItem } from "@/data/inspection";
import { cx } from "@/lib/cx";
import { CalloutNumber, calloutTone } from "./item-static";

const DOT = 24;
const LEADERS_MIN_WIDTH = 720;
const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x);
const easeOut = (x: number) => 1 - (1 - x) * (1 - x);

interface LabelBox {
  side: "left" | "right";
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Place labels in the gutters: same side as their anchor (balanced), in anchor order, no overlaps. */
function layoutLabels(
  callouts: readonly Callout[],
  layout: readonly AnchorPoint[],
  width: number,
  height: number,
  gutter: number,
  heights: readonly number[],
): LabelBox[] {
  const items = callouts.map((c, i) => {
    const a = layout.find((p) => p.n === c.n);
    return { i, x: a?.x ?? width / 2, y: a?.y ?? height / 2, h: heights[i] || 46 };
  });
  const mid = width / 2;
  const left = items.filter((it) => it.x < mid);
  const right = items.filter((it) => it.x >= mid);
  // Each label stays on its anchor's side (short leaders, none across the part) unless that
  // gutter can't hold them all; then the anchor nearest the middle crosses over.
  const fits = (list: typeof items) => list.reduce((sum, it) => sum + it.h + 12, -12) <= height - 12;
  while (!fits(left) && left.length > 1 && fits([...right, left[0]])) {
    left.sort((a, b) => a.x - b.x);
    right.push(left.pop()!);
  }
  while (!fits(right) && right.length > 1 && fits([...left, right[0]])) {
    right.sort((a, b) => a.x - b.x);
    left.push(right.shift()!);
  }

  const boxes: LabelBox[] = new Array(items.length);
  const place = (list: typeof items, side: "left" | "right") => {
    list.sort((a, b) => a.y - b.y);
    const gap = 12;
    const top = 6;
    const bottom = height - 6;
    const ys: number[] = [];
    let next = top;
    for (const it of list) {
      const y = Math.max(it.y - it.h / 2, next);
      ys.push(y);
      next = y + it.h + gap;
    }
    // Overflowing the bottom: stack back up from the bottom edge.
    let limit = bottom;
    for (let k = list.length - 1; k >= 0; k--) {
      ys[k] = Math.max(top, Math.min(ys[k], limit - list[k].h));
      limit = ys[k] - gap;
    }
    list.forEach((it, k) => {
      boxes[it.i] = { side, x: side === "left" ? 4 : width - gutter + 12, y: ys[k], w: gutter - 16, h: it.h };
    });
  };
  place(left, "left");
  place(right, "right");
  return boxes;
}

export function Callouts({
  item,
  drive,
  mode,
  className,
}: {
  item: InspectionItem;
  drive: DiagramDrive;
  /** "leaders": dots, leader lines and labels (wide desktop stage). "dots": numbered dots only. */
  mode: "leaders" | "dots";
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const dots = Array.from(root.querySelectorAll<HTMLElement>("[data-dot]"));
    const paths = Array.from(root.querySelectorAll<SVGPathElement>("[data-leader]"));
    const labels = Array.from(root.querySelectorAll<HTMLElement>("[data-label]"));
    const n = item.callouts.length;

    let leaders = false;
    let gutter = 0;
    let boxes: LabelBox[] | null = null;
    let boxKey = "";
    let last: DiagramFrame | null = null;

    const measure = () => {
      const width = root.clientWidth;
      leaders = mode === "leaders" && width >= LEADERS_MIN_WIDTH;
      gutter = leaders ? Math.round(Math.min(220, Math.max(160, width * 0.21))) : 0;
      labels.forEach((l) => {
        l.style.display = leaders ? "block" : "none";
        l.style.width = `${gutter - 16}px`;
      });
      boxKey = "";
      drive.setInsets(leaders ? { left: gutter, right: gutter, top: 10, bottom: 10 } : { left: 0, right: 0, top: 6, bottom: 6 });
    };

    const hide = (i: number) => {
      dots[i].style.opacity = "0";
      if (paths[i]) {
        paths[i].style.strokeDashoffset = "1";
        paths[i].setAttribute("d", "M0 0");
      }
      if (labels[i]) labels[i].style.opacity = "0";
    };

    const update = (frame: DiagramFrame) => {
      last = frame;
      const mine = frame.item === item.n - 1;
      const ink = mine ? inkAt(frame.p) : 0;
      if (leaders && mine) {
        const key = `${frame.width}x${frame.height}:${gutter}:${frame.layout.map((a) => `${Math.round(a.x)},${Math.round(a.y)}`).join(";")}`;
        if (key !== boxKey || !boxes) {
          boxKey = key;
          boxes = layoutLabels(item.callouts, frame.layout, frame.width, frame.height, gutter, labels.map((l) => l.offsetHeight));
        }
      }
      // Where each dot goes: on its anchor, nudged apart when two anchors nearly coincide.
      const spots = item.callouts.map((c) => {
        const a = frame.anchors.find((p) => p.n === c.n);
        return a && a.visible ? { x: a.x, y: a.y } : null;
      });
      for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            const a = spots[i];
            const b = spots[j];
            if (!a || !b) continue;
            let dx = b.x - a.x;
            let dy = b.y - a.y;
            let d = Math.hypot(dx, dy);
            if (d >= DOT + 4) continue;
            if (d < 0.5) {
              dx = 1;
              dy = -1;
              d = Math.SQRT2;
            }
            const push = (DOT + 4 - d) / 2;
            a.x -= (dx / d) * push;
            a.y -= (dy / d) * push;
            b.x += (dx / d) * push;
            b.y += (dy / d) * push;
          }
        }
      }
      for (let i = 0; i < n; i++) {
        const a = spots[i];
        const k = clamp01((ink - i / n) * n);
        if (!mine || !a || k <= 0) {
          hide(i);
          continue;
        }
        const pop = easeOut(clamp01(k / 0.25));
        dots[i].style.opacity = "1";
        dots[i].style.transform = `translate(${a.x - DOT / 2}px, ${a.y - DOT / 2}px) scale(${0.35 + 0.65 * pop})`;
        if (leaders && boxes && paths[i] && labels[i]) {
          const b = boxes[i];
          const y = b.y + 11;
          const end = b.side === "left" ? b.x + b.w + 6 : b.x - 6;
          const elbow = b.side === "left" ? end + 18 : end - 18;
          paths[i].setAttribute("d", `M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${elbow.toFixed(1)} ${y.toFixed(1)}L${end.toFixed(1)} ${y.toFixed(1)}`);
          paths[i].style.strokeDashoffset = String(1 - clamp01((k - 0.15) / 0.6));
          labels[i].style.opacity = String(clamp01((k - 0.55) / 0.4));
          labels[i].style.textAlign = b.side === "left" ? "right" : "left";
          labels[i].style.transform = `translate(${b.x}px, ${b.y}px)`;
        }
      }
    };

    const ro = new ResizeObserver(() => {
      measure();
      if (last) update(last);
    });
    measure();
    ro.observe(root);
    const off = drive.onFrame(update);
    return () => {
      off();
      ro.disconnect();
    };
  }, [drive, item, mode]);

  return (
    <div ref={rootRef} aria-hidden="true" className={cx("pointer-events-none absolute inset-0", className)}>
      <svg className="absolute inset-0 size-full overflow-visible">
        {item.callouts.map((c) => (
          <path key={c.n} data-leader="" pathLength={1} className="pd-leader" d="M0 0" style={{ strokeDashoffset: 1 }} />
        ))}
      </svg>
      {item.callouts.map((c) => (
        <span key={c.n} data-dot="" className="absolute left-0 top-0 origin-center opacity-0 [will-change:transform]">
          <CalloutNumber n={c.n} tone={calloutTone(item, c)} size={DOT} className="shadow-[0_0_0_2px_var(--paper)]" />
        </span>
      ))}
      {item.callouts.map((c) => (
        <div key={c.n} data-label="" className="absolute left-0 top-0 hidden opacity-0">
          <p className="text-[15px] font-bold leading-tight text-ink [--wdth:86]">
            <span className="font-mono">{c.n}</span> {c.label}
          </p>
          <p className="mt-0.5 font-mono text-[13.5px] leading-snug text-graphite">{c.text}</p>
        </div>
      ))}
    </div>
  );
}
