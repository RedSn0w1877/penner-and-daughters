"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from "react";
import { cx } from "@/lib/cx";

export const MIN_MPH = 20;
export const MAX_MPH = 70;

/* The dial: a 210° speedometer arc, 20 mph at lower left round to 70 mph at lower right. */
const CX = 110;
const CY = 100;
const R = 86;
const START = 195;
const SWEEP = 210;

const angleOf = (mph: number) => START - ((mph - MIN_MPH) / (MAX_MPH - MIN_MPH)) * SWEEP;
const polar = (deg: number, r: number) => {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY - r * Math.sin(rad) };
};
const clampMph = (mph: number) => Math.max(MIN_MPH, Math.min(MAX_MPH, Math.round(mph)));

const ARC = (() => {
  const a = polar(START, R);
  const b = polar(START - SWEEP, R);
  return `M${a.x.toFixed(1)} ${a.y.toFixed(1)} A${R} ${R} 0 1 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
})();

const TICKS = Array.from({ length: (MAX_MPH - MIN_MPH) / 5 + 1 }, (_, i) => {
  const mph = MIN_MPH + i * 5;
  const major = mph % 10 === 0;
  const p1 = polar(angleOf(mph), R);
  const p2 = polar(angleOf(mph), major ? R - 11 : R - 6);
  const label = polar(angleOf(mph), R - 25);
  return { mph, major, p1, p2, label };
});

/**
 * The wheel-bearing helper: "Speed: 45 mph" on an ink speedometer arc. Drag the needle (or use
 * the arrow keys) between 20 and 70 mph; the hum's pitch follows (40 + 2.2 × mph Hz). The needle
 * is blue: it's the customer's input. Moving it counts as a tap, so it may start the hum.
 */
export function SpeedDial({
  mph,
  onChange,
  className,
}: {
  mph: number;
  /** `start` is true at the beginning of a drag or key press (a user gesture). */
  onChange: (mph: number, start: boolean) => void;
  className?: string;
}) {
  const dragging = useRef(false);
  // The latest speed, so key repeats that land before the next render still add up (45 → 46 → 47).
  const latest = useRef(mph);
  useEffect(() => {
    latest.current = mph;
  }, [mph]);
  const change = (next: number, start: boolean) => {
    latest.current = next;
    onChange(next, start);
  };

  const mphAt = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 220;
    const y = ((e.clientY - r.top) / r.height) * 132;
    let deg = (Math.atan2(CY - y, x - CX) * 180) / Math.PI;
    if (deg < -90) deg += 360;
    return clampMph(MIN_MPH + ((START - deg) / SWEEP) * (MAX_MPH - MIN_MPH));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    change(mphAt(e), true);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) change(mphAt(e), false);
  };
  const end = () => {
    dragging.current = false;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 };
    let next: number | null = null;
    if (e.key in steps) next = latest.current + steps[e.key];
    else if (e.key === "Home") next = MIN_MPH;
    else if (e.key === "End") next = MAX_MPH;
    if (next === null) return;
    e.preventDefault();
    change(clampMph(next), true);
  };

  return (
    <div className={cx("flex flex-wrap items-center gap-x-6 gap-y-2", className)}>
      <div
        role="slider"
        tabIndex={0}
        // The name stays "Speed"; the value is read from aria-valuetext ("45 mph"), not repeated in the name.
        aria-label="Speed"
        aria-valuemin={MIN_MPH}
        aria-valuemax={MAX_MPH}
        aria-valuenow={mph}
        aria-valuetext={`${mph} mph`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerCancel={end}
        onKeyDown={onKeyDown}
        className="w-[200px] shrink-0 cursor-pointer touch-none rounded-[6px] select-none sm:w-[220px]"
      >
        <svg viewBox="0 0 220 132" className="block w-full overflow-visible" aria-hidden="true">
          <path d={ARC} fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
          {TICKS.map((t) => (
            <g key={t.mph}>
              <line x1={t.p1.x} y1={t.p1.y} x2={t.p2.x} y2={t.p2.y} stroke="var(--ink)" strokeWidth={t.major ? 2 : 1.2} />
              {t.major && (
                <text
                  x={t.label.x}
                  y={t.label.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="var(--graphite)"
                  style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}
                >
                  {t.mph}
                </text>
              )}
            </g>
          ))}
          <text x={CX} y={CY + 22} textAnchor="middle" fill="var(--graphite)" style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>
            mph
          </text>
          {/* Drawn pointing right, then turned to the speed (so it can glide between values). */}
          <line
            x1={CX}
            y1={CY}
            x2={CX + R - 16}
            y2={CY}
            stroke="var(--blue)"
            strokeWidth="3.4"
            strokeLinecap="round"
            style={{ transform: `rotate(${-angleOf(mph)}deg)`, transformOrigin: `${CX}px ${CY}px` }}
            className="transition-transform duration-150 ease-out"
          />
          <circle cx={CX} cy={CY} r="7" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2.4" />
        </svg>
      </div>
      <p aria-hidden="true" className="text-[16px] font-semibold text-ink">
        Speed: <span className="font-mono tabular-nums">{mph} mph</span>
      </p>
    </div>
  );
}
