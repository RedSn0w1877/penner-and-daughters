"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * One line of "Your estimate".
 *   exact (from the inspection): the itemized breakdown from lineMath, with a parts-grade switch
 *     when the part comes in quality aftermarket or factory; amounts roll when the grade changes.
 *   range (from the price list): "Typical … · exact price after we see the car".
 *   flat (diagnosis, pre-purchase, free checks): one amount.
 * Every line: "Approve this line" (a square box, ticked in blue pen) and Remove.
 * The carbon variant is the canary copy: the same words, read-only, the ticks in carbon blue.
 */
import { useId } from "react";
import { notify } from "@/components/providers/lazy-toaster";
import { Odometer } from "@/components/ui/odometer";
import { PenTick } from "@/components/ui/pen-tick";
import { TOASTS } from "@/data/copy";
import { ESTIMATE_COPY } from "@/data/services";
import { GRADES, VEHICLE_CLASSES, laborText, money } from "@/lib/pricing";
import { estimate, type EstimateLine as Line } from "@/lib/stores";
import { MoneyText } from "./range-bar";

type ExactLine = Extract<Line, { kind: "exact" }>;

const DEFAULT_VEHICLE = VEHICLE_CLASSES[0].label;

export function EstimateLine({ line, variant }: { line: Line; variant: "top" | "carbon" }) {
  const uid = useId();
  const nameId = `${uid}-name`;
  const carbon = variant === "carbon";
  const graded = line.kind === "exact" && line.parts.some((p) => p.graded);

  return (
    <article className="el" aria-labelledby={nameId}>
      <div className="el-head">
        <h4 id={nameId} className="el-name">
          {line.name}
        </h4>
        {line.kind === "flat" && (
          <span className="el-amount">
            <Odometer value={money(line.total)} />
          </span>
        )}
      </div>

      {line.kind === "exact" && <Breakdown line={line} />}
      {line.kind === "range" && (
        <p className="el-typical">
          <MoneyText text={ESTIMATE_COPY.typical(line.low, line.high)} />
          {line.vehicle && line.vehicle !== DEFAULT_VEHICLE && <span className="el-vehicle">{line.vehicle}</span>}
        </p>
      )}
      {line.kind === "flat" && line.note && <p className="el-typical">{line.note}</p>}

      {graded && !carbon && <GradeSwitch line={line as ExactLine} labelledBy={nameId} />}

      <div className="el-actions">
        {carbon ? (
          <span className="el-approve" data-static="">
            <span className="el-box" aria-hidden="true">
              <PenTick active={line.approved} size={20} />
            </span>
            <span>{ESTIMATE_COPY.approveLine}</span>
          </span>
        ) : (
          <label className="el-approve">
            <input
              type="checkbox"
              className="sr-only"
              checked={line.approved}
              aria-describedby={nameId}
              onChange={(e) => estimate.approve(line.id, e.currentTarget.checked)}
            />
            <span className="el-box" aria-hidden="true">
              <PenTick active={line.approved} size={20} />
            </span>
            <span>{ESTIMATE_COPY.approveLine}</span>
          </label>
        )}
        {!carbon && (
          <button
            type="button"
            className="el-remove"
            aria-describedby={nameId}
            onClick={() => {
              estimate.remove(line.id);
              notify(TOASTS.removed(line.name));
              // The button is about to leave the page: keep keyboard focus on the estimate.
              requestAnimationFrame(() => document.getElementById("est-title")?.focus());
            }}
          >
            {ESTIMATE_COPY.remove}
          </button>
        )}
      </div>
    </article>
  );
}

/** The §3 breakdown: parts, labor, shop supplies, tire disposal, tax on parts, line total. */
function Breakdown({ line }: { line: ExactLine }) {
  const m = line.math;
  // "Battery test and terminal clean": nothing to itemize, just the line total.
  const empty = m.parts.length === 0 && m.hours === 0;
  return (
    <table className="el-math">
      <tbody>
        {!empty &&
          m.parts.map((part, i) => (
            <tr key={i}>
              <td>{part.label}</td>
              <td>
                <Odometer value={money(part.amount)} />
              </td>
            </tr>
          ))}
        {!empty && (
          <tr>
            <td>
              {ESTIMATE_COPY.labor}: <MoneyText text={laborText(m.hours)} className="font-medium" />
              {line.laborNote ? ` (${line.laborNote})` : ""}
            </td>
            <td>{money(m.labor)}</td>
          </tr>
        )}
        {!empty && (
          <tr>
            <td>{ESTIMATE_COPY.supplies}</td>
            <td>{money(m.supplies)}</td>
          </tr>
        )}
        {m.disposal > 0 && (
          <tr>
            <td>{ESTIMATE_COPY.disposal}</td>
            <td>{money(m.disposal)}</td>
          </tr>
        )}
        {!empty && (
          <tr>
            <td>{ESTIMATE_COPY.tax}</td>
            <td>
              <Odometer value={money(m.tax)} />
            </td>
          </tr>
        )}
        <tr className="el-sum">
          <td>{ESTIMATE_COPY.lineTotal}</td>
          <td>
            <Odometer value={money(m.total)} />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/** Quality aftermarket / Factory, as a two-way paper switch (radio group). */
function GradeSwitch({ line, labelledBy }: { line: ExactLine; labelledBy: string }) {
  const uid = useId();
  const noteId = `${uid}-note`;
  return (
    <div className="el-grade">
      <div className="el-grade-opts" role="radiogroup" aria-labelledby={labelledBy} aria-describedby={noteId}>
        {GRADES.map((g) => (
          <label key={g.id} className="el-grade-opt">
            <input
              type="radio"
              className="sr-only"
              name={`${uid}-grade`}
              value={g.id}
              checked={line.grade === g.id}
              onChange={() => estimate.setGrade(line.id, g.id)}
            />
            <span>{g.label}</span>
          </label>
        ))}
      </div>
      <p id={noteId} className="el-grade-note">
        <MoneyText text={ESTIMATE_COPY.gradeNote} />
      </p>
    </div>
  );
}
