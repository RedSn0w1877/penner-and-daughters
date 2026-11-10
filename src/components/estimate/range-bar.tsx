// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The price list's ruler: a log-scale dollar scale (like a slide rule), a range bar per row, and
 * figures that roll on odometer drums when the vehicle class changes.
 *
 * None of this needs JavaScript. The server renders every row with the positions and digits of
 * all four vehicle classes as CSS custom properties; the price list's scope element carries
 * data-vehicle, and switching it lets CSS slide the bars (transform only, 350 ms) and roll the
 * drums (420 ms, 40 ms stagger right to left, a small wave down the rows). One attribute change
 * moves 29 bars and 58 figures with no React render and no layout work beyond the figures.
 */
import type { CSSProperties } from "react";
import { cx } from "@/lib/cx";
import { BIG_BILL, VEHICLE_CLASSES, classRange, money, moneyRange } from "@/lib/pricing";

/* ---------------------------------------------------------------------------------------------
 * Scale
 * ------------------------------------------------------------------------------------------- */

/** The ruler runs from twenty dollars to thirty-five hundred, on a log scale. */
export const SCALE_MIN = 20;
export const SCALE_MAX = 3500;
/** Labelled ticks. */
export const SCALE_LABELS = [50, 100, 250, 500, 1000, 2500] as const;

const LN_MIN = Math.log(SCALE_MIN);
const LN_SPAN = Math.log(SCALE_MAX) - LN_MIN;
const r4 = (n: number) => Math.round(n * 10_000) / 10_000;

/** 0–1 position of a dollar amount on the ruler. */
export function scaleX(dollars: number): number {
  const v = Math.min(SCALE_MAX, Math.max(SCALE_MIN, dollars));
  return r4((Math.log(v) - LN_MIN) / LN_SPAN);
}

type TickKind = "major" | "mid" | "minor";

/** Slide-rule ticks: tens below a hundred, fifties to a thousand, then every two hundred fifty. */
function ticks(): Array<{ x: number; kind: TickKind }> {
  const values = new Set<number>();
  for (let v = 20; v <= 100; v += 10) values.add(v);
  for (let v = 100; v <= 1000; v += 50) values.add(v);
  for (let v = 1000; v <= SCALE_MAX; v += 250) values.add(v);
  return [...values].map((v) => ({
    x: scaleX(v) * 1000,
    kind: (SCALE_LABELS as readonly number[]).includes(v)
      ? "major"
      : (v < 1000 && v % 100 === 0) || v % 1000 === 0
        ? "mid"
        : "minor",
  }));
}

const TICK_HEIGHT: Record<TickKind, number> = { major: 10, mid: 6.5, minor: 4 };

/**
 * One shared set of tick marks, drawn once per page and reused by every ruler with <use>. The
 * strokes don't scale, so a 1000-unit-wide drawing stretched to any width keeps hairline ticks.
 */
export function RulerDefs() {
  return (
    <svg className="rs-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <g id="rs-ruler" stroke="currentColor" strokeWidth="1">
          {ticks().map((t) => (
            <line key={t.x} x1={t.x} x2={t.x} y1={10 - TICK_HEIGHT[t.kind]} y2={10} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
      </defs>
    </svg>
  );
}

/** The labelled scale at the top of each group, aligned with the row tracks below it. */
export function ScaleRow() {
  return (
    <div className="rs-scale rs-grid" aria-hidden="true">
      <div className="rs-scale-track">
        {SCALE_LABELS.map((v) => (
          <span key={v} className="rs-scale-label" style={{ "--x": scaleX(v) } as CSSProperties}>
            {money(v, { range: true })}
          </span>
        ))}
        <svg className="rs-scale-ticks" viewBox="0 0 1000 10" preserveAspectRatio="none" focusable="false">
          <use href="#rs-ruler" />
        </svg>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------------------------
 * Per-class values
 * ------------------------------------------------------------------------------------------- */

/** The range for each vehicle class, in VEHICLE_CLASSES order. */
export function classRanges(base: readonly [number, number]): Array<[number, number]> {
  return VEHICLE_CLASSES.map((c) => classRange(base, c.id));
}

/** Bar positions for every class: --l0…--l3 (low end) and --h0…--h3 (high end). */
export function rangeVars(base: readonly [number, number]): CSSProperties {
  const vars: Record<string, number> = {};
  classRanges(base).forEach(([low, high], i) => {
    vars[`--l${i}`] = scaleX(low);
    vars[`--h${i}`] = scaleX(high);
  });
  return vars as CSSProperties;
}

/** Space-separated class ids whose high end reaches BIG_BILL ("suv pickup european"). */
export function bigBillOn(base: readonly [number, number]): string {
  return classRanges(base)
    .map((r, i) => (r[1] >= BIG_BILL ? VEHICLE_CLASSES[i].id : null))
    .filter(Boolean)
    .join(" ");
}

/* ---------------------------------------------------------------------------------------------
 * The track: hairline ticks, the bar with its end caps, or a pin for a flat price
 * ------------------------------------------------------------------------------------------- */

export function RangeTrack({ base, at }: { base?: readonly [number, number] | null; at?: number }) {
  const style: CSSProperties | undefined = base
    ? rangeVars(base)
    : at
      ? ({ "--x": scaleX(at) } as CSSProperties)
      : undefined;
  return (
    <div className="rs-track" style={style} aria-hidden="true">
      <svg className="rs-ticks" viewBox="0 0 1000 10" preserveAspectRatio="none" focusable="false">
        <use href="#rs-ruler" />
      </svg>
      {base && (
        <>
          <span className="rs-bar" />
          <span className="rs-cap" data-end="lo" />
          <span className="rs-cap" data-end="hi" />
        </>
      )}
      {!base && at ? <span className="rs-pin" /> : null}
    </div>
  );
}

/* ---------------------------------------------------------------------------------------------
 * Rolling figures, CSS only
 * ------------------------------------------------------------------------------------------- */

/** Drum position meaning "no digit here" (the drum collapses to zero width). */
const BLANK = 10;

type Cell =
  | { t: "static"; ch: string }
  | { t: "digit"; v: number[] }
  | { t: "comma"; v: number[] };

/** Right-aligned digit columns for one number across the four classes (BLANK where shorter). */
function numberCells(values: readonly number[]): Cell[] {
  const strs = values.map((v) => String(Math.round(v)));
  const width = Math.max(...strs.map((s) => s.length));
  const cells: Cell[] = [];
  for (let pos = 0; pos < width; pos++) {
    const digits = strs.map((s) => {
      const i = pos - (width - s.length);
      return i >= 0 ? Number(s[i]) : BLANK;
    });
    // The same digit in every class never moves: print it as plain text.
    cells.push(digits.every((d) => d === digits[0]) ? { t: "static", ch: String(digits[0]) } : { t: "digit", v: digits });
    const toRight = width - 1 - pos;
    if (toRight > 0 && toRight % 3 === 0) {
      // A thousands comma shows wherever that class has a digit in this column.
      const commas = digits.map((d) => (d === BLANK ? BLANK : 0));
      cells.push(commas.every((c) => c === 0) ? { t: "static", ch: "," } : { t: "comma", v: commas });
    }
  }
  return cells;
}

function drumVars(values: readonly number[], k: number): CSSProperties {
  return { "--v0": values[0], "--v1": values[1], "--v2": values[2], "--v3": values[3], "--k": k } as CSSProperties;
}

/**
 * The compact car's range, rolling to each class's range. Screen readers get the active class's
 * range as plain text (one sr-only line per class; CSS shows only the active one).
 */
export function RangeFigure({ base }: { base: readonly [number, number] }) {
  const ranges = classRanges(base);
  const cells: Cell[] = [
    { t: "static", ch: "$" },
    ...numberCells(ranges.map((r) => r[0])),
    { t: "static", ch: "–" },
    { t: "static", ch: "$" },
    ...numberCells(ranges.map((r) => r[1])),
  ];

  // Stagger index counted from the right, over the cells that move.
  let k = 0;
  const order = new Map<number, number>();
  for (let i = cells.length - 1; i >= 0; i--) if (cells[i].t !== "static") order.set(i, k++);

  return (
    <span className="rs-fig">
      {ranges.map((r, i) => (
        <span key={VEHICLE_CLASSES[i].id} className="rs-fig-sr sr-only" data-cls={VEHICLE_CLASSES[i].id}>
          {moneyRange(r[0], r[1])}
        </span>
      ))}
      <span className="rs-fig-vis" aria-hidden="true">
        {cells.map((cell, i) =>
          cell.t === "static" ? (
            <span key={i}>{cell.ch}</span>
          ) : cell.t === "digit" ? (
            <span key={i} className="rs-dg" style={drumVars(cell.v, order.get(i) ?? 0)} />
          ) : (
            <span key={i} className="rs-cm" style={drumVars(cell.v, order.get(i) ?? 0)}>
              ,
            </span>
          ),
        )}
      </span>
    </span>
  );
}

/* ---------------------------------------------------------------------------------------------
 * Shared with the estimate and the booking flow
 * ------------------------------------------------------------------------------------------- */

/**
 * The view-transition name the estimate's total shares with the estimate figure on /book/, so the
 * number morphs across that navigation. Only one element on a page may hold it at a time.
 */
export const ESTIMATE_TOTAL_TRANSITION = "estimate-total";

/** A dollar amount or an en-dash range of them, as formatted by money() / moneyRange(). */
const MONEY_PATTERN = /(\$\d{1,3}(?:,\d{3})*(?:\.\d\d)?(?:–\$\d{1,3}(?:,\d{3})*(?:\.\d\d)?)?)/g;
// Commas count only as thousands separators, so "$129, credited" leaves its comma in the text face.

/**
 * Copy with prices in it (the diagnosis box, the estimate notes): the figures are set in the mono face,
 * as every figure on the site is. The words come from the data files; this only styles them.
 */
export function MoneyText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(MONEY_PATTERN);
  if (parts.length === 1) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className={cx("whitespace-nowrap font-mono text-[0.94em] font-semibold tabular-nums", className)}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}
