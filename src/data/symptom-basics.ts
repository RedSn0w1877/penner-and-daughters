// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The small, always-needed part of the symptom guide: verdict stamps, the zones on the line-art
 * car, the ids, and the hero's "Customer states" phrases. It lives apart from data/symptoms.ts
 * (the 35 full answers, which also pull in the price list) so the first page load can stamp,
 * circle and cycle phrases without shipping the whole guide. data/symptoms.ts re-exports all of it.
 */

export type Verdict = "stop-driving" | "today" | "this-week" | "within-2-weeks" | "when-convenient" | "normal";

export const VERDICTS: Record<
  Verdict,
  { word: string; shape: "octagon" | "triangle" | "circle"; tone: "stop" | "soon" | "ok"; rank: number }
> = {
  "stop-driving": { word: "STOP DRIVING", shape: "octagon", tone: "stop", rank: 0 },
  today: { word: "TODAY", shape: "octagon", tone: "stop", rank: 1 },
  "this-week": { word: "THIS WEEK", shape: "triangle", tone: "soon", rank: 2 },
  "within-2-weeks": { word: "WITHIN 2 WEEKS", shape: "triangle", tone: "soon", rank: 3 },
  "when-convenient": { word: "WHEN CONVENIENT", shape: "circle", tone: "ok", rank: 4 },
  normal: { word: "THAT'S NORMAL", shape: "circle", tone: "ok", rank: 5 },
};

/* ---------------------------------------------------------------------------------------------
 * Zones on the line-art car. Ellipses are normalized (0–1) to the side / top SVG's viewBox.
 * These are the code defaults, copied from public/img/car/zones-v1.json (which still loads at
 * runtime), so nothing jumps when it arrives. Top view: front to the left, the car's left side at
 * the bottom.
 * ------------------------------------------------------------------------------------------- */

export type ZoneId =
  | "front-wheel"
  | "any-wheel"
  | "all-wheels"
  | "engine"
  | "under-front"
  | "under-middle"
  | "tailpipe"
  | "dash"
  | "passenger-floor";

export interface Ellipse {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export const ZONES: Record<ZoneId, { name: string; side: Ellipse; top: Ellipse }> = {
  "front-wheel": {
    name: "Front wheels",
    side: { cx: 0.217, cy: 0.736, rx: 0.081, ry: 0.22 },
    top: { cx: 0.217, cy: 0.814, rx: 0.081, ry: 0.081 },
  },
  "any-wheel": {
    name: "Any wheel",
    side: { cx: 0.766, cy: 0.736, rx: 0.081, ry: 0.22 },
    top: { cx: 0.766, cy: 0.814, rx: 0.081, ry: 0.081 },
  },
  "all-wheels": {
    name: "All four wheels",
    side: { cx: 0.491, cy: 0.736, rx: 0.396, ry: 0.243 },
    top: { cx: 0.491, cy: 0.5, rx: 0.396, ry: 0.415 },
  },
  engine: {
    name: "Engine bay",
    side: { cx: 0.163, cy: 0.502, rx: 0.118, ry: 0.151 },
    top: { cx: 0.163, cy: 0.5, rx: 0.118, ry: 0.252 },
  },
  "under-front": {
    name: "Under the front",
    side: { cx: 0.197, cy: 0.826, rx: 0.142, ry: 0.081 },
    top: { cx: 0.197, cy: 0.5, rx: 0.142, ry: 0.236 },
  },
  "under-middle": {
    name: "Under the middle",
    side: { cx: 0.512, cy: 0.826, rx: 0.173, ry: 0.075 },
    top: { cx: 0.512, cy: 0.5, rx: 0.173, ry: 0.224 },
  },
  tailpipe: {
    name: "Tailpipe",
    side: { cx: 0.967, cy: 0.762, rx: 0.041, ry: 0.075 },
    top: { cx: 0.967, cy: 0.296, rx: 0.045, ry: 0.065 },
  },
  dash: {
    name: "Dashboard and cabin",
    side: { cx: 0.38, cy: 0.368, rx: 0.065, ry: 0.116 },
    top: { cx: 0.38, cy: 0.5, rx: 0.061, ry: 0.269 },
  },
  "passenger-floor": {
    name: "Under the front passenger side",
    side: { cx: 0.42, cy: 0.826, rx: 0.085, ry: 0.075 },
    top: { cx: 0.42, cy: 0.317, rx: 0.085, ry: 0.122 },
  },
};

export type TabId = "noise" | "light" | "leak" | "other";

export type SymptomId =
  | "squeal-braking"
  | "grind-braking"
  | "click-turns"
  | "hum-speed"
  | "clunk-bumps"
  | "squeal-startup"
  | "cel-steady"
  | "cel-flashing"
  | "oil-light"
  | "battery-light"
  | "temp-red"
  | "brake-light"
  | "tpms-steady"
  | "tpms-flash"
  | "leak-coolant"
  | "leak-red"
  | "leak-oil"
  | "leak-brake"
  | "leak-ac"
  | "smell-egg"
  | "smell-sweet"
  | "smell-burnt"
  | "smoke-vapor"
  | "smoke-white"
  | "smoke-blue"
  | "smoke-black"
  | "nostart-clicks"
  | "nostart-oneclick"
  | "nostart-cranks"
  | "shake-highway"
  | "pulls"
  | "shake-stopping"
  | "knock"
  | "ac-warm"
  | "mileage";

/** The hero's "Customer states" line cycles these, then rests on the first. */
export const HERO_PHRASES: ReadonlyArray<{ phrase: string; symptom: SymptomId }> = [
  { phrase: "Squeals when I brake, mostly in the morning.", symptom: "squeal-braking" },
  { phrase: "Check-engine light came on this morning.", symptom: "cel-steady" },
  { phrase: "Puddle under the front, kind of green.", symptom: "leak-coolant" },
  { phrase: "Clicks when I turn into the driveway.", symptom: "click-turns" },
];
