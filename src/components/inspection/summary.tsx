"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * After the pin (spec §11.3): the four lines with their states, so a visitor who scrolled past
 * can still answer each one, then "Approved so far", the total (ROLL) with "tax and shop supplies
 * included", and "See your estimate". The total is read from the estimate store, so it always
 * agrees with "Your estimate" and the Book buttons (pads + tire is the story total in lib/pricing).
 */
import { Odometer } from "@/components/ui/odometer";
import { Sheet } from "@/components/ui/sheet";
import { IMPRINTS } from "@/data/copy";
import { INSPECTION_COPY, ITEMS } from "@/data/inspection";
import { cx } from "@/lib/cx";
import { money, sumMoney } from "@/lib/pricing";
import { useEstimateDeferred } from "@/lib/stores";
import { ItemRow } from "./item-row";

export function InspectionSummary({ className }: { className?: string }) {
  const { lines } = useEstimateDeferred();
  const total = sumMoney(
    ITEMS.map((item) => {
      const line = lines.find((l) => l.id === item.job.id && l.approved);
      return line && line.kind === "exact" ? line.total : 0;
    }),
  );
  const copy = INSPECTION_COPY.summary;

  return (
    <Sheet imprint={IMPRINTS.inspection} className={cx("relative", className)}>
      <ul className="divide-y divide-rule">
        {ITEMS.map((item) => (
          <li key={item.id} className="py-4 first:pt-0">
            <ItemRow item={item} compact />
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-t-[1.5px] border-ink pt-5">
        <div>
          <p className="type-label">{copy.approvedSoFar}</p>
          <p className="mono-total mt-2 text-ink" aria-live="polite">
            <Odometer value={money(total)} />
          </p>
          <p className="mt-2 text-[15px] text-graphite">{copy.included}</p>
        </div>
        <a href={copy.href} className="text-link inline-flex min-h-11 items-center">
          {copy.seeEstimate}
        </a>
      </div>
    </Sheet>
  );
}
