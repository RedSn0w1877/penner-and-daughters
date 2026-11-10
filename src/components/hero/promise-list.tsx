// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { PenTick } from "@/components/ui/pen-tick";
import { cx } from "@/lib/cx";
import { WARRANTY } from "@/lib/facts";

/** The repair order's four promises. The last one is the warranty, worded once in lib/facts. */
export const PROMISES = [
  "Photos of anything we recommend, texted before work starts",
  "A written price for every line: parts, labor, supplies, tax",
  "Your OK before we spend a dollar",
  WARRANTY.short,
] as const;

/** First tick at 0.4 s, then one every 120 ms (INK: each stroke writes itself in). */
const FIRST_TICK_MS = 400;
const TICK_STAGGER_MS = 120;

/**
 * Four promises, each with a square ink checkbox ticked in blue ballpoint (blue is always the
 * customer's mark). Pure CSS: without JS, or with reduced motion, the ticks are simply drawn.
 */
export function PromiseList({ className }: { className?: string }) {
  return (
    <ul className={cx("grid gap-2.5", className)}>
      {PROMISES.map((promise, i) => (
        <li key={promise} className="flex items-start gap-3 text-[16px] leading-[1.4] lg:text-[17px]">
          <span aria-hidden="true" className="relative mt-[3px] size-[17px] shrink-0 rounded-[2px] border-[1.5px] border-ink">
            <PenTick delay={FIRST_TICK_MS + i * TICK_STAGGER_MS} size={25} className="absolute -left-[3px] -top-[9px]" />
          </span>
          <span>{promise}</span>
        </li>
      ))}
    </ul>
  );
}
