"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { Odometer } from "@/components/ui/odometer";
import { cx } from "@/lib/cx";
import { nextOpening } from "@/lib/slots";
import { useMinuteClock } from "@/lib/use-media";

const SERVER_TEXT = "Book online any time, or call during open hours.";

/**
 * The hero's next opening, in mono with a reserved height. Server/no-JS text:
 * "Book online any time, or call during open hours." The client rolls in
 * "Next appointment: today {time}" (ROLL) from the seeded appointment book.
 */
export function NextOpening({ className }: { className?: string }) {
  const now = useMinuteClock();
  const next = now ? nextOpening(now) : null;
  return (
    <span className={cx("mono-measure block min-h-[2lh] sm:min-h-[1lh]", className)}>
      {next ? (
        <>
          Next appointment: <Odometer value={next.label} rollIn />
        </>
      ) : (
        SERVER_TEXT
      )}
    </span>
  );
}
