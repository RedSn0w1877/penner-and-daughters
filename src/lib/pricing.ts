// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Money rules and the exact lines. Every exact price on the site comes out of lineMath();
 * nothing is typed. The math runs in integer cents with an explicit half-up rule, because
 * binary floats round 138.50 × 7% (= 9.695) down to 9.69 and the shop's sheet says 9.70.
 */

/** $/hr, from a standard labor guide; hours are shown on every line. */
export const LABOR = 146;
/** Shop supplies: 5% of labor, capped, on its own line. */
export const SUPPLIES_RATE = 0.05;
export const SUPPLIES_CAP = 25;
/** Fictional local rate. Parts only; labor isn't taxed. */
export const PARTS_TAX = 0.07;
/** Per tire. */
export const TIRE_DISPOSAL = 3;
/** First hour of testing; credited in full if the repair is approved within DIAG_CREDIT_DAYS. */
export const DIAG = 129;
export const DIAG_CREDIT_DAYS = 30;
/** Pre-purchase inspection. */
export const PPI = 139;
/** Over this, pay half at pickup and half within 30 days. */
export const SPLIT_PAY_OVER = 500;
/** At or over this, the third-party car-care card note appears. */
export const BIG_BILL = 1000;
/** Factory parts cost this multiple of quality aftermarket. */
export const FACTORY_PARTS = 1.35;
/** The free second-opinion look. */
export const SECOND_OPINION_MINUTES = 20;

export type Grade = "aftermarket" | "factory";

export const GRADES: ReadonlyArray<{ id: Grade; label: string; tag: string }> = [
  { id: "aftermarket", label: "Quality aftermarket", tag: "quality aftermarket" },
  { id: "factory", label: "Factory", tag: "factory" },
];

export interface Part {
  label: string;
  /** Unit price in dollars, quality aftermarket grade. */
  price: number;
  /** Defaults to 1. Shown as "Brake rotors, front (2 × $66.80)". */
  qty?: number;
  /** Append the grade to the label: "Brake pad set, front (quality aftermarket)". */
  graded?: boolean;
}

export interface PricedPart {
  /** Display label, quantity and grade included. */
  label: string;
  unit: number;
  qty: number;
  amount: number;
}

export interface LineMath {
  grade: Grade;
  parts: PricedPart[];
  partsTotal: number;
  hours: number;
  labor: number;
  supplies: number;
  disposal: number;
  tax: number;
  total: number;
}

const toCents = (dollars: number) => Math.round(dollars * 100);
/** Rate → basis points (0.07 → 700, 1.35 → 13 500). */
const toBp = (rate: number) => Math.round(rate * 10_000);
/** a × b ÷ 10 000, rounded half-up, for non-negative integers. Exact: no float ties. */
const mulBp = (a: number, b: number) => Math.floor((2 * a * b + 10_000) / 20_000);

const fmtExact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const fmtWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** "$1,234.56" for exact amounts; "$1,235" for range ends (`{ range: true }`). Render it in the mono face. */
export function money(n: number, opts: { range?: boolean } = {}): string {
  return (opts.range ? fmtWhole : fmtExact).format(n);
}

/** "$150–$350" (en dash, whole dollars). */
export function moneyRange(low: number, high: number): string {
  return `${money(low, { range: true })}–${money(high, { range: true })}`;
}

/** "0.9 hr", "1 hr", "1.6 hr". */
export function hoursText(hours: number): string {
  return `${Number(hours.toFixed(2))} hr`;
}

/** "0.9 hr × $146" */
export function laborText(hours: number): string {
  return `${hoursText(hours)} × ${money(LABOR, { range: true })}`;
}

/** Sum dollar amounts without float drift (221.86 + 212.52 is exactly 434.38). */
export function sumMoney(values: readonly number[]): number {
  return values.reduce((acc, v) => acc + toCents(v), 0) / 100;
}

function partLabel(part: Part, grade: Grade, unitCents: number): string {
  const qty = part.qty ?? 1;
  let label = part.label;
  if (part.graded) label += ` (${GRADES.find((g) => g.id === grade)!.tag})`;
  if (qty > 1) label += ` (${qty} × ${money(unitCents / 100)})`;
  return label;
}

/**
 * One estimate line, itemized. Each component is rounded half-up to the cent, then summed.
 * `disposal` is the number of tires recycled (true = 1). Factory grade multiplies every part
 * price by FACTORY_PARTS and recomputes the tax.
 *
 *   lineMath([{ label: "Brake pad set, front", price: 78.4, graded: true }], 0.9).total === 221.86
 */
export function lineMath(
  parts: readonly Part[],
  hours: number,
  opts: { disposal?: number | boolean; grade?: Grade } = {},
): LineMath {
  const grade: Grade = opts.grade ?? "aftermarket";
  const factor = grade === "factory" ? toBp(FACTORY_PARTS) : 10_000;

  let partsC = 0;
  const priced: PricedPart[] = parts.map((part) => {
    const qty = part.qty ?? 1;
    const unitC = mulBp(toCents(part.price), factor);
    partsC += unitC * qty;
    return { label: partLabel(part, grade, unitC), unit: unitC / 100, qty, amount: (unitC * qty) / 100 };
  });

  // Hours in hundredths × $/hr is already cents.
  const laborC = Math.round(hours * 100) * LABOR;
  const suppliesC = Math.min(mulBp(laborC, toBp(SUPPLIES_RATE)), toCents(SUPPLIES_CAP));
  const tires = opts.disposal === true ? 1 : typeof opts.disposal === "number" ? opts.disposal : 0;
  const disposalC = tires * toCents(TIRE_DISPOSAL);
  const taxC = mulBp(partsC, toBp(PARTS_TAX));
  const totalC = partsC + laborC + suppliesC + disposalC + taxC;

  return {
    grade,
    parts: priced,
    partsTotal: partsC / 100,
    hours,
    labor: laborC / 100,
    supplies: suppliesC / 100,
    disposal: disposalC / 100,
    tax: taxC / 100,
    total: totalC / 100,
  };
}

/* ---------------------------------------------------------------------------------------------
 * Vehicle classes for the price list. Range ends scale and round to the nearest $5 (half-up).
 * Flat rows (Free, $129, $139) never scale.
 * ------------------------------------------------------------------------------------------- */

export type VehicleClass = "compact" | "suv" | "pickup" | "european";

export const VEHICLE_CLASSES: ReadonlyArray<{ id: VehicleClass; label: string; factor: number }> = [
  { id: "compact", label: "Compact car", factor: 1 },
  { id: "suv", label: "SUV or minivan", factor: 1.15 },
  { id: "pickup", label: "Pickup", factor: 1.25 },
  { id: "european", label: "European", factor: 1.35 },
];

export function classRange(base: readonly [number, number], cls: VehicleClass): [number, number] {
  const factor = toBp(VEHICLE_CLASSES.find((v) => v.id === cls)?.factor ?? 1);
  // d × factor is in 1/10 000 dollars; nearest $5 = 50 000 units, half-up.
  const round5 = (d: number) => Math.floor((2 * d * factor + 50_000) / 100_000) * 5;
  return [round5(base[0]), round5(base[1])];
}

/* ---------------------------------------------------------------------------------------------
 * The example car's jobs (RO 4471). The only exact prices on the site; always computed.
 * ------------------------------------------------------------------------------------------- */

export interface ExactJob {
  id: string;
  name: string;
  parts: readonly Part[];
  hours: number;
  /** Shown after the hours: "Labor 0.4 hr (mount, balance, sensor reset)". */
  laborNote?: string;
  /** Tires recycled. */
  disposal?: number;
}

export const STORY_JOBS = {
  pads: {
    id: "front-pads",
    name: "Front brake pads",
    parts: [{ label: "Brake pad set, front", price: 78.4, graded: true }],
    hours: 0.9,
  },
  /** What the pads job becomes if you wait for the grind. */
  padsRotors: {
    id: "front-pads-rotors",
    name: "Front brake pads and rotors",
    parts: [
      { label: "Brake pad set, front", price: 78.4 },
      { label: "Brake rotors, front", price: 66.8, qty: 2 },
    ],
    hours: 1.6,
  },
  tire: {
    id: "left-front-tire",
    name: "Left front tire",
    parts: [
      { label: "Tire 205/55R16, all-season", price: 134 },
      { label: "Valve stem", price: 4.5 },
    ],
    hours: 0.4,
    laborNote: "mount, balance, sensor reset",
    disposal: 1,
  },
  belt: {
    id: "serpentine-belt",
    name: "Serpentine belt",
    parts: [{ label: "Serpentine belt, 6-rib", price: 42.6 }],
    hours: 0.6,
  },
  battery: {
    id: "battery-check",
    name: "Battery test and terminal clean",
    parts: [],
    hours: 0,
  },
} as const satisfies Record<string, ExactJob>;

export function jobMath(job: ExactJob, grade?: Grade): LineMath {
  return lineMath(job.parts, job.hours, { disposal: job.disposal, grade });
}

/** $221.86 · $472.12 · $212.52 · $137.56 · $0.00, the approved story total $434.38 and all three $571.94. */
export const STORY_TOTALS = {
  pads: jobMath(STORY_JOBS.pads).total,
  padsFactory: jobMath(STORY_JOBS.pads, "factory").total,
  padsRotors: jobMath(STORY_JOBS.padsRotors).total,
  tire: jobMath(STORY_JOBS.tire).total,
  belt: jobMath(STORY_JOBS.belt).total,
  battery: jobMath(STORY_JOBS.battery).total,
  /** Pads + tire: what the example customer approves. */
  approved: sumMoney([jobMath(STORY_JOBS.pads).total, jobMath(STORY_JOBS.tire).total]),
  /** Pads + tire + belt. */
  all: sumMoney([jobMath(STORY_JOBS.pads).total, jobMath(STORY_JOBS.tire).total, jobMath(STORY_JOBS.belt).total]),
} as const;
