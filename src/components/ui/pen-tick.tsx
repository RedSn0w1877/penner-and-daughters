// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import type { CSSProperties } from "react";
import { cx } from "@/lib/cx";

/**
 * A tick in blue ballpoint (blue is always the customer's mark). INK: it writes itself in at
 * handwriting speed, 270 ms with the tail running a little long, after `delay` ms. Without JS,
 * or with reduced motion, it's simply drawn.
 *
 * `active={false}` keeps it unwritten (with JS) until you flip it on, e.g. when a line is approved.
 */
export function PenTick({
  delay = 0,
  active = true,
  size = 22,
  title,
  className,
}: {
  delay?: number;
  active?: boolean;
  size?: number;
  /** Accessible name; omit when the text next to it already says it. */
  title?: string;
  className?: string;
}) {
  return (
    <svg
      className={cx("pen-tick", className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      data-active={active ? "true" : "false"}
      style={{ "--tick-delay": `${delay}ms` } as CSSProperties}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path pathLength={1} d="M3.4 12.9c1.7 1.5 3.6 3.7 5.4 6.4 2.9-6 6.6-11 12.4-16.1" />
    </svg>
  );
}
