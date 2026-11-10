"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { clickOnce } from "@/lib/audio";
import { cx } from "@/lib/cx";

export const WHEEL_COPY = { instruction: "Drag the wheel to turn" } as const;

/** Lock to lock: a turn and a half each way. */
const LIMIT = 540;
const LEFT_LOCK = -540;
/** A worn outer CV joint clicks about three times per turn of the wheel. */
const CLICK_EVERY = 120;
const KEY_STEP = 30;

const clamp = (deg: number) => Math.max(LEFT_LOCK, Math.min(LIMIT, deg));
const describe = (deg: number) => (Math.abs(deg) < 1 ? "Straight ahead" : `${Math.round(Math.abs(deg))}° ${deg < 0 ? "left" : "right"}`);

/**
 * The CV-joint helper: an ink steering wheel. Drag it round (or use the arrow keys, 30° a press)
 * and every 120° of turn plays one click, so a full turn sounds like a worn joint in a tight
 * turn. It's a slider (role="slider") from 540° left to 540° right.
 */
export function SteeringWheel({ onTurn, className }: { onTurn: () => void; className?: string }) {
  const [angle, setAngle] = useState(0);
  const angleRef = useRef(0);
  const drag = useRef<{ cx: number; cy: number; last: number } | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const labelId = useId();

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  /** Move to `next`, clicking once for every 120° boundary crossed (spaced so fast spins stay audible). */
  const turnTo = (next: number) => {
    const prev = angleRef.current;
    const target = clamp(next);
    const crossings = Math.abs(Math.floor(target / CLICK_EVERY) - Math.floor(prev / CLICK_EVERY));
    for (let i = 0; i < Math.min(crossings, 6); i++) {
      if (i === 0) clickOnce();
      else timers.current.push(setTimeout(clickOnce, i * 45));
    }
    if (crossings > 0) onTurn();
    angleRef.current = target;
    setAngle(target);
  };

  const pointerAngle = (e: PointerEvent, cx: number, cy: number) => (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const r = e.currentTarget.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { cx, cy, last: pointerAngle(e, cx, cy) };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const a = pointerAngle(e, d.cx, d.cy);
    let delta = a - d.last;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    d.last = a;
    turnTo(angleRef.current + delta);
  };

  const endDrag = () => {
    drag.current = null;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = { ArrowLeft: -KEY_STEP, ArrowDown: -KEY_STEP, ArrowRight: KEY_STEP, ArrowUp: KEY_STEP, PageDown: -90, PageUp: 90 };
    let next: number | null = null;
    if (e.key in steps) next = angleRef.current + steps[e.key];
    else if (e.key === "Home") next = LEFT_LOCK;
    else if (e.key === "End") next = LIMIT;
    if (next === null) return;
    e.preventDefault();
    turnTo(next);
  };

  return (
    <div className={cx("flex items-center gap-5", className)}>
      <div
        role="slider"
        tabIndex={0}
        aria-labelledby={labelId}
        aria-valuemin={LEFT_LOCK}
        aria-valuemax={LIMIT}
        aria-valuenow={Math.round(angle)}
        aria-valuetext={describe(angle)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        className="relative size-[132px] shrink-0 cursor-grab touch-none rounded-full select-none active:cursor-grabbing sm:size-[148px]"
      >
        <svg viewBox="0 0 160 160" className="size-full overflow-visible" aria-hidden="true">
          <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: "80px 80px" }} className="transition-transform duration-100 ease-out">
            <circle cx="80" cy="80" r="68" fill="none" stroke="var(--ink)" strokeWidth="10" />
            <circle cx="80" cy="80" r="59" fill="none" stroke="var(--ink)" strokeWidth="1.4" opacity="0.55" />
            {/* Three spokes and the hub, like the wheel in a service manual. */}
            <path d="M24 86 Q52 92 64 88 M136 86 Q108 92 96 88 M80 98 L80 140" fill="none" stroke="var(--ink)" strokeWidth="7" strokeLinecap="round" />
            <circle cx="80" cy="82" r="19" fill="var(--paper)" stroke="var(--ink)" strokeWidth="3" />
            <circle cx="80" cy="82" r="6" fill="none" stroke="var(--ink)" strokeWidth="1.6" />
            {/* The top-center stripe, so the turn reads at a glance. */}
            <path d="M80 7 L80 19" stroke="var(--blue)" strokeWidth="5" strokeLinecap="round" />
          </g>
        </svg>
      </div>
      <div className="min-w-0">
        <p id={labelId} className="text-[16px] leading-[1.35] font-semibold text-ink">
          {WHEEL_COPY.instruction}
        </p>
        <p className="mt-1 font-mono text-[15px] text-graphite tabular-nums" aria-hidden="true">
          {describe(angle)}
        </p>
      </div>
    </div>
  );
}
