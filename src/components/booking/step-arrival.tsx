"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Step 2, "How you'll get here": a ruled list with square boxes ticked in blue pen. Wait with us,
 * drop it off, the night key drop, or a ride (shuttle, ride credit, loaner).
 */
import { PenTick } from "@/components/ui/pen-tick";
import { ARRIVALS, type Arrival } from "@/lib/facts";

export function StepArrival({
  titleId,
  title,
  value,
  onPick,
}: {
  titleId: string;
  title: string;
  value: Arrival | null;
  onPick: (id: Arrival) => void;
}) {
  return (
    <>
      <h3 id={titleId} className="bk-step-title" tabIndex={-1} data-step-title="">
        {title}
      </h3>
      <div className="bk-opts" role="radiogroup" aria-labelledby={titleId}>
        {ARRIVALS.map((a) => {
          const inputId = `${titleId}-${a.id}`;
          const noteId = a.note ? `${inputId}-note` : undefined;
          const checked = value === a.id;
          return (
            <div key={a.id} className="bk-opt">
              <input
                id={inputId}
                type="radio"
                className="sr-only"
                name={`${titleId}-pick`}
                value={a.id}
                checked={checked}
                aria-describedby={noteId}
                onChange={() => onPick(a.id)}
              />
              <label htmlFor={inputId}>
                <span className="bk-box" aria-hidden="true">
                  <PenTick active={checked} size={18} />
                </span>
                <span className="bk-opt-title">{a.label}</span>
              </label>
              {a.note && (
                <p id={noteId} className="bk-opt-note">
                  {a.note}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
