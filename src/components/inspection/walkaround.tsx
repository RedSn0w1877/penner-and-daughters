// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The walk-around strip (spec §11.3): the top-view line-art car, "Where Cass found things", and
 * one numbered dot per finding in its rating color (1 front-left hub amber, 2 front-left tire red,
 * 3 engine bay amber, 4 battery green). Dots are links to their items, so they work without JS;
 * the pinned stage turns a click into a scroll to that item's moment in the pin.
 *
 * Pure: positions come from zones-v1.json "findings" when a client parent passes them, else the
 * defaults in data/inspection. Dots that would overlap at this size are nudged apart.
 */
import type { MouseEvent } from "react";
import { LineCar } from "@/components/ui/line-car";
import { INSPECTION_COPY, ITEMS, RATING_TONE, WALK_DEFAULTS, walkLabel, type InspectionItem } from "@/data/inspection";
import { CAR_ART } from "@/data/media";
import { cx } from "@/lib/cx";
import { CalloutNumber } from "./item-static";

type Point = { x: number; y: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Push dots apart until they're at least `min` px from each other. The drawing's bounds apply
 * inside every pass (not after), so a dot squeezed against an edge pushes its neighbour away
 * instead of landing back on top of it.
 */
function spread(points: Point[], width: number, height: number, min: number): Point[] {
  const p = points.map((pt) => ({ x: pt.x * width, y: pt.y * height }));
  const pad = Math.max(0, min / 2 - 4);
  const bound = (pt: Point) => {
    pt.x = clamp(pt.x, pad, width - pad);
    pt.y = clamp(pt.y, pad, height - pad);
  };
  p.forEach(bound);
  for (let pass = 0; pass < 64; pass++) {
    let moved = false;
    for (let i = 0; i < p.length; i++) {
      for (let j = i + 1; j < p.length; j++) {
        let dx = p[j].x - p[i].x;
        let dy = p[j].y - p[i].y;
        let d = Math.hypot(dx, dy);
        if (d >= min - 0.5) continue;
        if (d < 0.01) {
          dx = 0.3;
          dy = 1;
          d = Math.hypot(dx, dy);
        }
        const push = (min - d) / 2 + 0.25;
        p[i].x -= (dx / d) * push;
        p[i].y -= (dy / d) * push;
        p[j].x += (dx / d) * push;
        p[j].y += (dy / d) * push;
        bound(p[i]);
        bound(p[j]);
        moved = true;
      }
    }
    if (!moved) break;
  }
  return p.map((pt) => ({ x: pt.x / width, y: pt.y / height }));
}

export function Walkaround({
  active = null,
  positions,
  width = 240,
  dot = 26,
  onSelect,
  caption = true,
  className,
}: {
  /** Item number (1–4) on the stage: its dot gets an ink ring. */
  active?: number | null;
  /** zones-v1.json "findings", keyed "1"–"4" (normalized). */
  positions?: Record<string, Point>;
  /** Drawing width in px (dots keep their size, so spacing depends on it). */
  width?: number;
  /** Dot diameter in px. */
  dot?: number;
  /** Client only: handle the jump yourself (e.g. scroll inside the pin). */
  onSelect?: (item: InspectionItem, event: MouseEvent<HTMLAnchorElement>) => void;
  caption?: boolean;
  className?: string;
}) {
  const [vw, vh] = CAR_ART.viewBox.top;
  const height = (width * vh) / vw;
  const points = spread(
    ITEMS.map((item) => positions?.[String(item.n)] ?? WALK_DEFAULTS[item.n]),
    width,
    height,
    dot + 4,
  );

  return (
    <figure className={cx("m-0", className)}>
      <div className="relative" style={{ width }}>
        <LineCar view="top" />
        {ITEMS.map((item, i) => {
          const on = active === item.n;
          return (
            <a
              key={item.id}
              href={`#${item.domId}`}
              aria-label={walkLabel(item)}
              aria-current={on ? "step" : undefined}
              onClick={onSelect ? (e) => onSelect(item, e) : undefined}
              className={cx(
                "absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full transition-[box-shadow,transform] duration-200",
                // A 44px hit area around the 26px dot (the dot itself stays small on the drawing).
                "before:absolute before:-inset-[9px] before:content-['']",
                on ? "scale-110 shadow-[0_0_0_2px_var(--paper),0_0_0_4px_var(--ink)]" : "shadow-[0_0_0_2px_var(--paper)]",
              )}
              style={{ left: `${points[i].x * 100}%`, top: `${points[i].y * 100}%` }}
            >
              <CalloutNumber n={item.n} tone={RATING_TONE[item.rating]} size={dot} />
            </a>
          );
        })}
      </div>
      {caption && <figcaption className="type-label mt-2">{INSPECTION_COPY.walkCaption}</figcaption>}
    </figure>
  );
}
