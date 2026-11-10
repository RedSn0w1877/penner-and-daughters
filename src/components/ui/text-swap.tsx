"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { useLayoutEffect, useRef, useState } from "react";
import { cx } from "@/lib/cx";

/**
 * Text state swap (Transitions.dev): when `text` changes, the old words lift out (180 ms),
 * the new ones settle in from below. Reduced motion swaps instantly. Used for the open-now
 * status, the tracker status and "Confirm booking" → "Booking…" → "Booked".
 *
 * The first text is rendered by React (server HTML included); later changes are written to the
 * node directly so the exit can finish before the words change. Wrap it in an aria-live region
 * when the change should be announced.
 */
export function TextSwap({ text, className }: { text: string; className?: string }) {
  const [initial] = useState(text);
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || el.textContent === text) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = text;
      return;
    }
    el.dataset.phase = "exit";
    let frame = 0;
    const timer = setTimeout(() => {
      el.textContent = text;
      el.dataset.phase = "enter";
      void el.offsetWidth;
      frame = requestAnimationFrame(() => {
        delete el.dataset.phase;
      });
    }, 180);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [text]);

  return (
    <span ref={ref} className={cx("swap", className)}>
      {initial}
    </span>
  );
}
