"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Step 1, "What's going on": paper chips, one choice. Anything carried in (your estimate, or the
 * symptom you picked in the guide) comes first, on a dashed edge; the chosen chip goes ballpoint
 * blue with a tick.
 */
import { ViewTransition } from "react";
import { ESTIMATE_TOTAL_TRANSITION, MoneyText } from "@/components/estimate/range-bar";
import { PenTick } from "@/components/ui/pen-tick";

export interface ConcernOption {
  id: string;
  label: string;
  /** Carried in from the estimate or the symptom guide. */
  carried?: boolean;
  /** The estimate total inside the label; on /book/ it shares the estimate's transition name. */
  figure?: { text: string; named: boolean };
}

function FigureLabel({ label, figure }: { label: string; figure: NonNullable<ConcernOption["figure"]> }) {
  const at = label.indexOf(figure.text);
  if (at < 0) return <MoneyText text={label} />;
  const fig = (
    <span className="whitespace-nowrap font-mono text-[0.94em] font-semibold tabular-nums">{figure.text}</span>
  );
  return (
    <>
      {label.slice(0, at)}
      {figure.named ? (
        <ViewTransition name={ESTIMATE_TOTAL_TRANSITION} share="auto" default="none">
          {fig}
        </ViewTransition>
      ) : (
        fig
      )}
      {label.slice(at + figure.text.length)}
    </>
  );
}

export function StepConcern({
  titleId,
  title,
  options,
  value,
  onPick,
}: {
  titleId: string;
  title: string;
  options: readonly ConcernOption[];
  value: string | null;
  onPick: (id: string) => void;
}) {
  return (
    <>
      <h3 id={titleId} className="bk-step-title" tabIndex={-1} data-step-title="">
        {title}
      </h3>
      <div className="bk-chips" role="radiogroup" aria-labelledby={titleId}>
        {options.map((o) => {
          const checked = value === o.id;
          return (
            <label key={o.id} className="bk-chip" data-carried={o.carried ? "" : undefined}>
              <input
                type="radio"
                className="sr-only"
                name={`${titleId}-pick`}
                value={o.id}
                checked={checked}
                onChange={() => onPick(o.id)}
              />
              <span className="bk-chip-tick" aria-hidden="true">
                <PenTick active={checked} size={16} />
              </span>
              <span>{o.figure ? <FigureLabel label={o.label} figure={o.figure} /> : <MoneyText text={o.label} />}</span>
            </label>
          );
        })}
      </div>
    </>
  );
}
