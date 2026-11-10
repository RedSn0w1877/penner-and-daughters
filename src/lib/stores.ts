"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Three tiny shared stores, built on useSyncExternalStore (no state library):
 *
 *   estimate  the lines the visitor has approved in the inspection or added from the price list
 *   symptom   the concern picked in the hero or the symptom guide
 *   booking   what the booking flow should start with (a concern, "use my estimate", an arrival)
 *
 * State lives in memory only. The privacy page promises the estimate is gone when you leave,
 * so nothing here touches storage. Each store replaces its snapshot object on change, so
 * React sees a new value exactly when something changed.
 */
import { startTransition, useEffect, useState, useSyncExternalStore } from "react";
import type { SymptomId } from "@/data/symptom-basics";
import type { Arrival } from "./facts";
import { jobMath, sumMoney, type Grade, type LineMath, type Part } from "./pricing";

function createStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    initial,
    get: () => state,
    set(next: T) {
      state = next;
      listeners.forEach((l) => l());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/* =============================================================================================
 * Estimate
 * =========================================================================================== */

export type EstimateSource = "inspection" | "price-list" | "booking";

interface LineBase {
  /** Stable id: a service id ("brake-pads") or an inspection job id ("front-pads"). Re-adding replaces. */
  id: string;
  name: string;
  approved?: boolean;
  source?: EstimateSource;
}

/** Itemized and exact: computed with lineMath. */
export interface ExactLineInput extends LineBase {
  kind: "exact";
  parts: readonly Part[];
  hours: number;
  laborNote?: string;
  /** Tires recycled. */
  disposal?: number;
  grade?: Grade;
}

/** A typical range from the price list: "Typical {low}–{high} · exact price after we see the car". */
export interface RangeLineInput extends LineBase {
  kind: "range";
  low: number;
  high: number;
  /** The vehicle class the range was scaled for, for the line's note. */
  vehicle?: string;
}

/** A fixed price that never scales: diagnosis, pre-purchase inspection, free checks. */
export interface FlatLineInput extends LineBase {
  kind: "flat";
  amount: number;
  note?: string;
}

export type EstimateLineInput = ExactLineInput | RangeLineInput | FlatLineInput;

export type EstimateLine =
  | (ExactLineInput & { grade: Grade; approved: boolean; math: LineMath; total: number })
  | (RangeLineInput & { approved: boolean })
  | (FlatLineInput & { approved: boolean; total: number });

export interface EstimateSnapshot {
  lines: EstimateLine[];
  /** Exact and flat lines only. */
  exactTotal: number;
  /** exactTotal + the low/high ends of any range lines (both equal exactTotal when there are none). */
  rangeLow: number;
  rangeHigh: number;
  hasRanges: boolean;
  /** At least one line, and every line approved. */
  allApproved: boolean;
  count: number;
}

function resolveLine(input: EstimateLineInput): EstimateLine {
  const approved = input.approved ?? false;
  if (input.kind === "exact") {
    const grade = input.grade ?? "aftermarket";
    const math = jobMath(input, grade);
    return { ...input, grade, approved, math, total: math.total };
  }
  if (input.kind === "flat") return { ...input, approved, total: input.amount };
  return { ...input, approved };
}

function snapshotOf(lines: EstimateLine[]): EstimateSnapshot {
  const fixed = lines.filter((l): l is Extract<EstimateLine, { total: number }> => l.kind !== "range");
  const ranges = lines.filter((l): l is Extract<EstimateLine, { kind: "range" }> => l.kind === "range");
  const exactTotal = sumMoney(fixed.map((l) => l.total));
  return {
    lines,
    exactTotal,
    rangeLow: sumMoney([exactTotal, ...ranges.map((l) => l.low)]),
    rangeHigh: sumMoney([exactTotal, ...ranges.map((l) => l.high)]),
    hasRanges: ranges.length > 0,
    allApproved: lines.length > 0 && lines.every((l) => l.approved),
    count: lines.length,
  };
}

const estimateStore = createStore<EstimateSnapshot>(snapshotOf([]));

function updateLines(fn: (lines: EstimateLine[]) => EstimateLine[]) {
  estimateStore.set(snapshotOf(fn(estimateStore.get().lines)));
}

/** Read the estimate in a component. */
export function useEstimate(): EstimateSnapshot {
  return useSyncExternalStore(estimateStore.subscribe, estimateStore.get, () => estimateStore.initial);
}

/**
 * Whether one line is on the estimate. A boolean snapshot, so a component using it re-renders only
 * when that line comes or goes (the price list's 32 Add buttons don't all re-render on every Add).
 */
export function useInEstimate(id: string): boolean {
  return useSyncExternalStore(
    estimateStore.subscribe,
    () => estimateStore.get().lines.some((l) => l.id === id),
    () => false,
  );
}

/**
 * One primitive read off the estimate (a total string, a flag). The component re-renders only
 * when that value changes, in the same commit as the change: for the control that was pressed.
 */
export function useEstimateValue<T extends string | number | boolean>(select: (s: EstimateSnapshot) => T): T {
  return useSyncExternalStore(
    estimateStore.subscribe,
    () => select(estimateStore.get()),
    () => select(estimateStore.initial),
  );
}

/**
 * The estimate for big views elsewhere on the page (the estimate sheet, the booking flow, the
 * inspection summary): it catches up in a transition, a render React can interrupt and split, so
 * an Add or Approve tap paints its own tick first and never waits on them. (A useSyncExternalStore
 * update is always rendered synchronously, even inside startTransition, hence the local state.)
 */
export function useEstimateDeferred(): EstimateSnapshot {
  const [snap, setSnap] = useState(estimateStore.get);
  useEffect(() => {
    const sync = () => startTransition(() => setSnap(estimateStore.get()));
    const off = estimateStore.subscribe(sync);
    // Catch anything that changed between the first render and this subscription (same object: no-op).
    queueMicrotask(sync);
    return off;
  }, []);
  return snap;
}

export const estimate = {
  /** Add a line, or replace the line with the same id (keeping its position). */
  add(line: EstimateLineInput) {
    const next = resolveLine(line);
    updateLines((lines) =>
      lines.some((l) => l.id === line.id) ? lines.map((l) => (l.id === line.id ? next : l)) : [...lines, next],
    );
  },
  remove(id: string) {
    updateLines((lines) => lines.filter((l) => l.id !== id));
  },
  /** Switch an exact line between quality aftermarket and factory parts (recomputes the line). */
  setGrade(id: string, grade: Grade) {
    updateLines((lines) =>
      lines.map((l) => (l.id === id && l.kind === "exact" ? resolveLine({ ...l, grade }) : l)),
    );
  },
  approve(id: string, approved = true) {
    updateLines((lines) => lines.map((l) => (l.id === id ? { ...l, approved } : l)));
  },
  clear() {
    estimateStore.set(snapshotOf([]));
  },
  has(id: string) {
    return estimateStore.get().lines.some((l) => l.id === id);
  },
  get: estimateStore.get,
  subscribe: estimateStore.subscribe,
  useEstimate,
};

/* =============================================================================================
 * Symptom
 * =========================================================================================== */

export type SymptomSource = "hero" | "triage" | "pull-over" | "normal-list" | "service-page" | "link";

export interface SymptomState {
  id: SymptomId | null;
  from: SymptomSource | null;
  /** The hero's "customer states" phrase, when the pick came from there. */
  phrase: string | null;
  /** Bumps on every set(), so re-picking the same symptom still reads as a new event. */
  seq: number;
}

const symptomStore = createStore<SymptomState>({ id: null, from: null, phrase: null, seq: 0 });

export function useSymptom(): SymptomState {
  return useSyncExternalStore(symptomStore.subscribe, symptomStore.get, () => symptomStore.initial);
}

export const symptom = {
  set(id: SymptomId, from: SymptomSource = "triage", phrase?: string) {
    symptomStore.set({ id, from, phrase: phrase ?? null, seq: symptomStore.get().seq + 1 });
  },
  clear() {
    symptomStore.set({ id: null, from: null, phrase: null, seq: symptomStore.get().seq + 1 });
  },
  get: symptomStore.get,
  subscribe: symptomStore.subscribe,
  useSymptom,
};

/* =============================================================================================
 * Booking prefill
 * =========================================================================================== */

export type { Arrival };

export interface BookingPrefill {
  /** A concern to carry in as the first chip (a symptom label or a phrase). */
  concern?: string;
  /** Carry the current estimate in ("Use my estimate ({total})"); read its total from useEstimate(). */
  estimate?: boolean;
  arrival?: Arrival;
}

export interface BookingState {
  concern: string | null;
  estimate: boolean;
  arrival: Arrival | null;
  /** Bumps on every prefill(), so the flow can reset to step 1 and show the carried chip. */
  seq: number;
}

const bookingStore = createStore<BookingState>({ concern: null, estimate: false, arrival: null, seq: 0 });

export function useBooking(): BookingState {
  return useSyncExternalStore(bookingStore.subscribe, bookingStore.get, () => bookingStore.initial);
}

export const booking = {
  /** Merge what the visitor carried in. Pass only the fields you want to set. */
  prefill(p: BookingPrefill) {
    const s = bookingStore.get();
    bookingStore.set({
      concern: p.concern !== undefined ? p.concern : s.concern,
      estimate: p.estimate !== undefined ? p.estimate : s.estimate,
      arrival: p.arrival !== undefined ? p.arrival : s.arrival,
      seq: s.seq + 1,
    });
  },
  reset() {
    bookingStore.set({ concern: null, estimate: false, arrival: null, seq: bookingStore.get().seq + 1 });
  },
  get: bookingStore.get,
  subscribe: bookingStore.subscribe,
  useBooking,
};
