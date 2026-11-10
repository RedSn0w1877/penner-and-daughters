// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { cx } from "@/lib/cx";
import { money, moneyRange } from "@/lib/pricing";

/**
 * A price in the mono face. Exact amounts print cents ("{d.cc}"); range ends print whole
 * dollars ("{n,nnn}"); a [low, high] pair prints "{low}–{high}".
 */
export function Money({
  value,
  range,
  className,
}: {
  value: number | readonly [number, number];
  /** Whole dollars (a range end). */
  range?: boolean;
  className?: string;
}) {
  const text = typeof value === "number" ? money(value, { range }) : moneyRange(value[0], value[1]);
  return <span className={cx("font-mono tabular-nums", className)}>{text}</span>;
}
