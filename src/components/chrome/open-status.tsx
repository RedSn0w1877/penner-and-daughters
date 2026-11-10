"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { TextSwap } from "@/components/ui/text-swap";
import { cx } from "@/lib/cx";
import { HOURS_TEXT } from "@/lib/facts";
import { shopStatus } from "@/lib/hours";
import { useMinuteClock } from "@/lib/use-media";

/**
 * Open-now status in shop time, refreshed on the minute.
 *   chip (header):  "● Open · until {close time}" / "● Closed · opens {open time}" / "● Closed today · key drop open"
 *   line (hero):    "● Open now · closes {close time}" / "● Closed · opens tomorrow {open time} · key drop open 24/7"
 * Before hydration (and without JS) it prints the hours instead, in a reserved width, then the
 * live status swaps in. The dot is green only when open (the one documented use of --ok
 * outside the car); the word always says it too.
 */
export function OpenStatus({ variant = "chip", className }: { variant?: "chip" | "line"; className?: string }) {
  const now = useMinuteClock();
  const status = now ? shopStatus(now) : null;
  const fallback = variant === "chip" ? HOURS_TEXT.chipFallback : HOURS_TEXT.lineFallback;
  const text = status ? (variant === "chip" ? status.chip : status.line) : fallback;

  return (
    <span
      className={cx(
        variant === "chip"
          ? "status-chip"
          : // Two lines reserved on phones, so the swap from the hours to the live status never shifts the sheet.
            "status-line inline-flex min-h-[2lh] items-baseline gap-2 sm:min-h-0",
        className,
      )}
    >
      <span
        className="status-dot self-center"
        data-open={status?.open ? "true" : "false"}
        data-known={status ? "true" : undefined}
        aria-hidden="true"
      />
      <TextSwap text={text} />
    </span>
  );
}
