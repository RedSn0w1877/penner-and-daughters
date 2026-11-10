"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The hours, as ruled rows on the location sheet. Today's row (in shop time) gets a graphite pencil
 * loop once the page knows the time; the server and no-JS view prints the plain table. Every hour
 * string comes from HOURS_TEXT in lib/facts.
 */
import { cx } from "@/lib/cx";
import { HOURS_TEXT } from "@/lib/facts";
import { hoursRow } from "@/lib/hours";
import { useMinuteClock } from "@/lib/use-media";

/** An elongated hand-drawn loop around a whole row (viewBox 0 0 100 20, stretched to fit). */
const ROW_LOOP =
  "M8 3.2C22 0.4 58 0.6 86 1.6C97 2 99.4 6.2 98.8 10.4C98.2 15.6 92 18.6 78 18.9C54 19.4 22 19.2 9 17.6C2.4 16.8 0.6 13 1 9.6C1.6 4.8 6 2.6 15 1.9";

export function HoursTable({ className }: { className?: string }) {
  const now = useMinuteClock();
  const today = now ? hoursRow(now) : null;

  return (
    <div className={cx("border-t-[1.5px] border-ink", className)}>
      <style href="location-hours" precedence="default">{`
@layer properties, theme, base, components, utilities;
@layer components {
  .hours-loop path { stroke-dasharray: 1; stroke-dashoffset: 1; animation: ink-draw 420ms var(--ease-ink) 150ms forwards; }
  @media (prefers-reduced-motion: reduce) { .hours-loop path { animation: none; stroke-dashoffset: 0; } }
}`}</style>
      <dl>
        {HOURS_TEXT.table.map((row) => {
          const isToday = today === row.id;
          return (
            <div key={row.id} className="relative flex items-baseline justify-between gap-4 border-b border-dashed border-rule px-2 py-3">
              <dt className={cx("text-[17px]", isToday ? "font-bold text-ink" : "font-semibold text-ink")}>
                {row.days}
                {isToday && <span className="sr-only"> (today)</span>}
              </dt>
              <dd className="text-right font-mono text-[15.5px] font-semibold tabular-nums text-ink">{row.hours}</dd>
              {isToday && (
                <svg
                  className="hours-loop pointer-events-none absolute -inset-x-1 -inset-y-[3px] h-[calc(100%+6px)] w-[calc(100%+8px)] overflow-visible"
                  viewBox="0 0 100 20"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d={ROW_LOOP} pathLength={1} fill="none" stroke="var(--graphite)" strokeWidth="1.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                </svg>
              )}
            </div>
          );
        })}
      </dl>
    </div>
  );
}
