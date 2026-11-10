"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { useSyncExternalStore } from "react";
import { CAR_ART } from "@/data/media";
import { ZONES, type Ellipse, type ZoneId } from "@/data/symptom-basics";
import { cx } from "@/lib/cx";

type View = "side" | "top";

export interface CarZones {
  viewBox: Record<View, readonly [number, number]>;
  zones: Record<ZoneId, Record<View, Ellipse>>;
  /** Walk-around finding positions on the top view (normalized), when the assets ship them. */
  findings: Record<string, { x: number; y: number }>;
}

const DEFAULTS: CarZones = {
  viewBox: { side: CAR_ART.viewBox.side, top: CAR_ART.viewBox.top },
  zones: Object.fromEntries(Object.entries(ZONES).map(([id, z]) => [id, { side: z.side, top: z.top }])) as CarZones["zones"],
  findings: {},
};

/* zones-v1.json refines the code defaults once, the first time any LineCar mounts. */
let zonesState: CarZones = DEFAULTS;
let zonesRequested = false;
const zoneListeners = new Set<() => void>();

type ZonesJson = {
  viewBox?: Partial<Record<View, [number, number]>>;
  side?: Partial<Record<ZoneId, Ellipse>>;
  top?: Partial<Record<ZoneId, Ellipse>>;
  findings?: Record<string, { x: number; y: number }>;
};

function requestZones() {
  if (zonesRequested || typeof window === "undefined") return;
  zonesRequested = true;
  fetch(CAR_ART.zones)
    .then((r) => (r.ok ? (r.json() as Promise<ZonesJson>) : null))
    .then((json) => {
      if (!json) return;
      const zones = { ...DEFAULTS.zones };
      for (const id of Object.keys(zones) as ZoneId[]) {
        zones[id] = { side: json.side?.[id] ?? zones[id].side, top: json.top?.[id] ?? zones[id].top };
      }
      zonesState = {
        viewBox: { side: json.viewBox?.side ?? DEFAULTS.viewBox.side, top: json.viewBox?.top ?? DEFAULTS.viewBox.top },
        zones,
        findings: json.findings ?? {},
      };
      zoneListeners.forEach((l) => l());
    })
    .catch(() => {});
}

function subscribeZones(listener: () => void) {
  requestZones();
  zoneListeners.add(listener);
  return () => zoneListeners.delete(listener);
}

/** Zone ellipses, drawing viewBoxes and finding positions (code defaults, then the JSON). */
export function useCarZones(): CarZones {
  return useSyncExternalStore(subscribeZones, () => zonesState, () => DEFAULTS);
}

/** A pencil loop: one-and-a-bit turns around the ellipse with a slight wobble, like a hand-drawn circle. */
function loopPath(cx: number, cy: number, rx: number, ry: number): string {
  const steps = 48;
  const start = -1.9;
  const sweep = Math.PI * 2 + 0.45;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = start + (sweep * i) / steps;
    const wobble = 1 + 0.035 * Math.sin(t * 3 + 0.7) + (i / steps) * 0.05;
    const x = cx + Math.cos(t) * rx * wobble;
    const y = cy + Math.sin(t) * ry * wobble;
    d += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

export interface CarMarker {
  id: string;
  /** Normalized position on the drawing (0–1). */
  x: number;
  y: number;
  /** Finding color (always pair it with a number or word). */
  tone?: "stop" | "soon" | "ok" | "ink";
  /** Short visible text, e.g. "1". */
  text: string;
  /** Accessible name, e.g. "1: Front brakes, soon". */
  label: string;
  href?: string;
  onSelect?: () => void;
}

const TONE_STYLE: Record<NonNullable<CarMarker["tone"]>, string> = {
  stop: "bg-stop text-white",
  soon: "bg-soon-fill text-ink",
  ok: "bg-ok text-white",
  ink: "bg-ink text-paper",
};

/**
 * The plain sedan in ink line art, side or top view. `zone` draws a graphite pencil loop around
 * "where we'd look first" (INK, 420 ms); `markers` place numbered dots (the walk-around).
 */
export function LineCar({
  view,
  zone,
  markers,
  draw = true,
  alt = "",
  className,
}: {
  view: View;
  zone?: ZoneId | null;
  markers?: readonly CarMarker[];
  /** Animate the loop as it appears (it's simply drawn without JS or with reduced motion). */
  draw?: boolean;
  alt?: string;
  className?: string;
}) {
  const data = useCarZones();
  const [w, h] = data.viewBox[view];
  const e = zone ? data.zones[zone]?.[view] : null;

  return (
    <div className={cx("line-car", className)} style={{ aspectRatio: `${w} / ${h}` }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static export: plain <img> through withBase() */}
      <img src={CAR_ART[view]} alt={alt} width={w} height={h} decoding="async" loading="lazy" />
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
        {e && (
          <path
            key={`${zone}-${view}`}
            className="pencil-loop"
            data-draw={draw ? "true" : undefined}
            pathLength={1}
            strokeWidth={w / 260}
            d={loopPath(e.cx * w, e.cy * h, e.rx * w * 1.12, e.ry * h * 1.16)}
          />
        )}
      </svg>
      {markers?.map((m) => {
        const cls = cx(
          "absolute grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full font-mono text-[13px] font-bold shadow-[0_0_0_2px_var(--paper)]",
          "before:absolute before:-inset-2 before:content-['']",
          TONE_STYLE[m.tone ?? "ink"],
        );
        const style = { left: `${m.x * 100}%`, top: `${m.y * 100}%` };
        return m.href ? (
          <a key={m.id} href={m.href} aria-label={m.label} className={cls} style={style} onClick={m.onSelect}>
            {m.text}
          </a>
        ) : (
          <button key={m.id} type="button" aria-label={m.label} className={cls} style={style} onClick={m.onSelect}>
            {m.text}
          </button>
        );
      })}
    </div>
  );
}
