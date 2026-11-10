"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { X } from "lucide-react";
import { useRef } from "react";
import type { SymptomId } from "@/data/symptom-basics";
import { symptom, useSymptom } from "@/lib/stores";

export const CONCERN_COPY = {
  label: "Customer states",
  empty: "Pick what you notice. We'll give you a straight answer.",
  clear: "Clear",
} as const;

/**
 * The concern line at the top of the concern sheet: "Customer states" and what the customer said,
 * in quotes: the hero phrase when they came from the repair order, otherwise the symptom they
 * picked (its label comes from the tool's deferred chunk). Server HTML shows the empty line. It's also where the hero's phrase lands
 * ([data-concern], [data-concern-value]); while the phrase is in flight ([data-flight]) the
 * box keeps its own copy invisible.
 */
export function ConcernBox({ labelOf }: { labelOf?: (id: SymptomId) => string }) {
  const state = useSymptom();
  // The symptom labels arrive with the tool's deferred chunk (labelOf); a hero phrase needs none.
  const words = state.phrase ?? (state.id && labelOf ? labelOf(state.id) : null);
  const ref = useRef<HTMLDivElement>(null);

  const clear = () => {
    symptom.clear();
    // The Clear button is about to disappear; keep keyboard focus on the concern line.
    ref.current?.focus({ preventScroll: true });
  };

  return (
    <div
      ref={ref}
      id="concern"
      data-concern
      tabIndex={-1}
      // A filled-in form line: the words sit right on the ink rule (min height = the Clear button's).
      className="flex min-h-[52px] flex-col justify-end gap-1 border-b-[1.5px] border-ink pb-2 outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue sm:flex-row sm:items-end sm:justify-start sm:gap-4"
    >
      <span className="type-label shrink-0 sm:pb-[3px]">{CONCERN_COPY.label}</span>
      {words ? (
        <span className="flex min-w-0 flex-1 items-end justify-between gap-3">
          <span
            data-concern-value
            className="min-w-0 pb-[2px] font-mono text-[16px] leading-[1.45] text-ink transition-opacity duration-150 [[data-flight]_&]:opacity-0"
          >
            {`“${words}”`}
          </span>
          <button
            type="button"
            onClick={clear}
            className="-mb-1 inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-[6px] px-2 text-[15px] font-semibold text-graphite transition-colors hover:text-ink"
          >
            <X aria-hidden="true" size={16} strokeWidth={2.4} />
            {CONCERN_COPY.clear}
          </button>
        </span>
      ) : (
        <span className="pb-[2px] text-[16px] leading-[1.45] text-graphite">{CONCERN_COPY.empty}</span>
      )}
    </div>
  );
}
