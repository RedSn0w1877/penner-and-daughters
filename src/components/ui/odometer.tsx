"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { cx } from "@/lib/cx";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * ROLL: every digit is a drum that turns to its new value (420 ms, a slight mechanical
 * overshoot, 40 ms stagger right to left). Other characters ("$", ",", ":", letters) sit still.
 * Change `value` and the drums turn; the server HTML already shows the value (no-JS safe).
 * Screen readers get the plain value; reduced motion jumps straight to it.
 *
 *   <Odometer value={money(total)} />      <Odometer value="7:12 PM" rollIn />
 */
export function Odometer({
  value,
  label,
  rollIn = false,
  className,
}: {
  value: string | number;
  /** Accessible text, if it should differ from the value. */
  label?: string;
  /** Turn up from zeros when the odometer first mounts. */
  rollIn?: boolean;
  className?: string;
}) {
  const text = String(value);
  const chars = Array.from(text);
  const last = chars.length - 1;
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!rollIn || !root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const strips = Array.from(root.querySelectorAll<HTMLElement>(".odo-strip"));
    const targets = strips.map((s) => s.style.transform);
    strips.forEach((s) => {
      s.style.transition = "none";
      s.style.transform = "translateY(0%)";
    });
    void root.offsetWidth;
    const frame = requestAnimationFrame(() =>
      strips.forEach((s, i) => {
        s.style.transition = "";
        s.style.transform = targets[i];
      }),
    );
    return () => cancelAnimationFrame(frame);
    // Mount only: later changes roll through the normal transition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span className={cx("odo", className)}>
      <span className="sr-only">{label ?? text}</span>
      <span ref={ref} aria-hidden="true" className="inline-flex items-baseline">
        {chars.map((ch, i) => {
          const fromRight = last - i;
          if (!/\d/.test(ch)) {
            return (
              <span key={`s${fromRight}`} className="odo-static">
                {ch === " " ? " " : ch}
              </span>
            );
          }
          const style = { transform: `translateY(-${Number(ch) * 10}%)`, "--odo-delay": `${fromRight * 40}ms` } as CSSProperties;
          return (
            <span key={`d${fromRight}`} className="odo-drum">
              <span className="odo-strip" style={style}>
                {DIGITS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
