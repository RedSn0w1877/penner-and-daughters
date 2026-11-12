// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * "What did you find?" (spec §11.3): the photo inspection Ana texts for the example car,
 * RO 4471. Every string here is final copy; every price comes out of lineMath() via the story
 * jobs in lib/pricing (nothing is typed), and the phone number comes from lib/facts.
 *
 * Also here: the scroll choreography shared by the pinned desktop stage, the touch sequence
 * players and the WebGL diagram (one source of timing for every tier).
 */
import { TOASTS } from "@/data/copy";
import type { PartId, PhotoId } from "@/data/media";
import { PHONE_TEXT, SHOP } from "@/lib/facts";
import { STORY_JOBS, STORY_TOTALS, money, type ExactJob } from "@/lib/pricing";

/* =============================================================================================
 * Section copy
 * =========================================================================================== */

export const INSPECTION_COPY = {
  title: "What did you find?",
  lead: "An example of the inspection we text you. Every item gets a photo, a measurement and a price. You approve each line, or tell us “not today.”",
  /** Mono, top right of the section. */
  meta: [
    `Repair order ${SHOP.exampleCar.ro} · Tue 8:15 AM`,
    `${SHOP.exampleCar.description} · ${SHOP.exampleCar.miles}`,
    `Inspected by ${SHOP.tech.name}, ${SHOP.tech.role.toLowerCase()}`,
    `Texts from ${SHOP.advisor.name}, ${SHOP.advisor.role.toLowerCase()}`,
  ],
  walkCaption: `Where ${SHOP.tech.first} found things`,
  /** The pencil note a "Not today" leaves on the line. */
  remindNote: "Remind me in 3 months",
  summary: {
    approvedSoFar: "Approved so far",
    included: "tax and shop supplies included",
    seeEstimate: "See your estimate",
    href: "#prices",
  },
} as const;

/* =============================================================================================
 * The text thread (from Ana)
 * =========================================================================================== */

export type ItemId = "pads" | "tire" | "belt" | "battery";

export type ThreadMedia =
  | { kind: "video"; clip: "pad-gauge"; photo: PhotoId; caption: string }
  | { kind: "photo"; photo: PhotoId };

export interface ThreadMessage {
  id: string;
  time: string;
  text: string;
  media?: ThreadMedia;
  /** The inspection item this text is about. */
  item?: ItemId;
}

const p = (n: number) => money(n);

export const THREAD = {
  from: `${SHOP.advisor.first} · ${SHOP.shortName}`,
  header: "Text message · Today",
  /** Above the thread wherever it's a plain stack (phones, tablets, lite). */
  example: "Example: what your text will look like",
  messages: [
    {
      id: "hello",
      time: "8:15 AM",
      text: `Morning! It's ${SHOP.advisor.first}. ${SHOP.tech.first} finished looking over your car. Four things, with photos. Nothing gets done until you say so.`,
    },
    {
      id: "pads",
      time: "8:15 AM",
      item: "pads",
      media: { kind: "video", clip: "pad-gauge", photo: "pads", caption: "Video · 8 sec" },
      text: `Front brakes: the inner pad is down to 3 mm. New is 10. That's your squeal. ${p(STORY_TOTALS.pads)} all-in.`,
    },
    {
      id: "tire",
      time: "8:16 AM",
      item: "tire",
      media: { kind: "photo", photo: "bulge" },
      text: `Left front tire has a bulge in the sidewall. That one we'd fix today. ${p(STORY_TOTALS.tire)}.`,
    },
    {
      id: "belt",
      time: "8:16 AM",
      item: "belt",
      media: { kind: "photo", photo: "belt" },
      text: `Your belt has a few small cracks. Fine for now; we'd replace it within 3 months. ${p(STORY_TOTALS.belt)}.`,
    },
    {
      id: "battery",
      time: "8:17 AM",
      item: "battery",
      media: { kind: "photo", photo: "battery" },
      text: "Battery tested good, 12.6 volts. We cleaned the terminals. No charge.",
    },
    { id: "call", time: "8:17 AM", text: PHONE_TEXT.approveOrCall },
  ] satisfies ThreadMessage[] as readonly ThreadMessage[],
} as const;

/* =============================================================================================
 * The four items
 * =========================================================================================== */

/** Inspection results reuse the stamp shapes: SOON amber triangle, FIX NOW red octagon, GOOD green circle. */
export type Rating = "soon" | "fix-now" | "good";
/** Rating color tokens (always shown with a number or a word). */
export type Tone = "soon" | "stop" | "ok";

export const RATING_TONE: Record<Rating, Tone> = { soon: "soon", "fix-now": "stop", good: "ok" };
export const RATING_WORD: Record<Rating, string> = { soon: "soon", "fix-now": "fix now", good: "good" };

export interface Callout {
  /** Matches the model's Anchor_n and the pre-rendered anchors.json ids. */
  n: number;
  label: string;
  text: string;
  /** The part wears its rating color in the diagram. */
  finding?: boolean;
}

export interface InspectionItem {
  n: 1 | 2 | 3 | 4;
  id: ItemId;
  /** Target of the triage links ("See a brake inspection" → #inspection-item-1). */
  domId: string;
  name: string;
  rating: Rating;
  measurement: string;
  /** The exact estimate line this item adds when approved. */
  job: ExactJob;
  price: number;
  /** Diagram title and subtitle. */
  title: string;
  subtitle: string;
  callouts: readonly Callout[];
  /** 3D part / pre-rendered frame set. */
  part: PartId;
  /** Nothing to approve: the battery shows "Nothing to do". */
  noAction?: boolean;
}

export const ITEMS: readonly InspectionItem[] = [
  {
    n: 1,
    id: "pads",
    domId: "inspection-item-1",
    name: "Front brake pads",
    rating: "soon",
    measurement: "Inner pad 3 mm left · new is 10 mm",
    job: STORY_JOBS.pads,
    price: STORY_TOTALS.pads,
    title: "Front brakes, left side",
    subtitle: "Taken apart and measured. The inner pad wears fastest.",
    part: "brake",
    callouts: [
      { n: 1, label: "Rotor", text: "27.4 mm thick · minimum 26.0" },
      { n: 2, label: "Inner pad", text: "3 mm left of 10", finding: true },
      { n: 3, label: "Outer pad", text: "4 mm left of 10" },
      { n: 4, label: "Caliper", text: "Slides freely" },
      { n: 5, label: "Wear tab", text: "Touching the rotor. That's the squeal." },
    ],
  },
  {
    n: 2,
    id: "tire",
    domId: "inspection-item-2",
    name: "Left front tire",
    rating: "fix-now",
    measurement: "Bulge in the sidewall · tread 6/32 in.",
    job: STORY_JOBS.tire,
    price: STORY_TOTALS.tire,
    title: "Left front tire",
    subtitle: "Cut away so you can see inside. A bulge means the cords under the rubber are broken.",
    part: "tire",
    callouts: [
      { n: 1, label: "Sidewall", text: "Bulge from a pothole hit", finding: true },
      { n: 2, label: "Tread", text: "6/32 in. left · plenty" },
      { n: 3, label: "Steel belts", text: "Fine where we can see" },
      { n: 4, label: "Wheel", text: "Straight, no cracks" },
    ],
  },
  {
    n: 3,
    id: "belt",
    domId: "inspection-item-3",
    name: "Serpentine belt",
    rating: "soon",
    measurement: "4 cracks across the ribs in 3 in.",
    job: STORY_JOBS.belt,
    price: STORY_TOTALS.belt,
    title: "Belt drive, front of the engine",
    subtitle: "One belt turns the alternator, the AC and the water pump.",
    part: "belt",
    callouts: [
      { n: 1, label: "Belt ribs", text: "4 cracks in 3 in.", finding: true },
      { n: 2, label: "Tensioner", text: "Holds steady" },
      { n: 3, label: "Idler pulley", text: "Spins quietly" },
      { n: 4, label: "Alternator pulley", text: "No wobble" },
    ],
  },
  {
    n: 4,
    id: "battery",
    domId: "inspection-item-4",
    name: "Battery",
    rating: "good",
    measurement: "Tested 12.6 V · 86% health · 3 years old",
    job: STORY_JOBS.battery,
    price: STORY_TOTALS.battery,
    title: "Battery",
    subtitle: "Tested, cleaned, and left alone.",
    part: "battery",
    noAction: true,
    callouts: [
      { n: 1, label: "Voltage", text: "12.6 V resting" },
      { n: 2, label: "Health", text: "86% · 3 years old" },
      { n: 3, label: "Terminals", text: "Cleaned and coated, no charge", finding: true },
      { n: 4, label: "Hold-down", text: "Tight" },
    ],
  },
];

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i])) as Record<ItemId, InspectionItem>;

/** Walk-around dots on the top-view car when zones-v1.json has no "findings" (normalized). */
export const WALK_DEFAULTS: Record<1 | 2 | 3 | 4, { x: number; y: number }> = {
  1: { x: 0.217, y: 0.732 },
  2: { x: 0.217, y: 0.822 },
  3: { x: 0.13, y: 0.329 },
  4: { x: 0.146, y: 0.704 },
};

/** Accessible name for an item's walk-around dot: "1: Front brake pads, soon". */
export const walkLabel = (item: InspectionItem) => `${item.n}: ${item.name}, ${RATING_WORD[item.rating]}`;

/* =============================================================================================
 * Toasts (spec §10 wording, from data/copy)
 * =========================================================================================== */

export const INSPECTION_TOASTS = {
  approved: (item: InspectionItem) => TOASTS.added(item.name, money(item.price)),
  notToday: (item: InspectionItem) => (item.id === "tire" ? TOASTS.tireNotToday : TOASTS.remindLater),
} as const;

/* =============================================================================================
 * Pad-wear ruler (item 1)
 * =========================================================================================== */

export type WearMM = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface WearStatus {
  text: string;
  /** The price inside the sentence (Number pop-in), and what follows it. */
  price?: string;
  after?: string;
}

export const WEAR = {
  label: "Drag to see what waiting does",
  /** As found: the inner pad has 3 mm left. */
  asFound: 3 as WearMM,
  newMM: 10,
  ticks: [
    { mm: 10, label: "10 mm · new" },
    { mm: 7, label: "7" },
    { mm: 5, label: "5" },
    { mm: 3, label: "3 · squeal" },
    { mm: 1, label: "1" },
    { mm: 0, label: "0 · grind" },
  ] as const,
  readout: (mm: number) => `Pad left: ${mm} mm`,
  status(mm: number): WearStatus {
    if (mm > 3) return { text: "Quiet. Plenty of pad left." };
    if (mm === 3) return { text: "Squeal starts here. Pads only: ", price: p(STORY_TOTALS.pads), after: "." };
    if (mm >= 1) return { text: "Squealing every stop. Still pads only: ", price: p(STORY_TOTALS.pads), after: "." };
    return {
      text: "Grinding. Now it's pads and rotors: ",
      price: p(STORY_TOTALS.padsRotors),
      after: ". That's why we tell you at the squeal.",
    };
  },
  /** What "Hear it" plays at this wear (null: nothing to hear yet). */
  sound: (mm: number): "squeal" | "grind" | null => (mm > 3 ? null : mm === 0 ? "grind" : "squeal"),
  /** Pre-rendered wear stills exist at these thicknesses (touch / lite). */
  stills: [10, 7, 5, 3, 1, 0] as const,
} as const;

/** The nearest pre-rendered wear still for a thickness (ties go to the more worn one). */
export function nearestWearStill(mm: number): 10 | 7 | 5 | 3 | 1 | 0 {
  let best: 10 | 7 | 5 | 3 | 1 | 0 = 10;
  let bestD = Infinity;
  for (const s of WEAR.stills) {
    const d = Math.abs(s - mm);
    if (d < bestD || (d === bestD && s < best)) {
      best = s;
      bestD = d;
    }
  }
  return best;
}

/* =============================================================================================
 * Scroll choreography (every tier). Units are vh of scroll on the pinned desktop stage.
 *   intro 20vh, then four items × 80vh. Inside each item:
 *   0–15% the part assembles in from 1.6× its explode vectors · 15–55% EXPLODE ·
 *   55–85% callouts draw (INK) · 85–100% hold.
 * =========================================================================================== */

export const TIMING = {
  introVh: 20,
  itemVh: 80,
  assembleEnd: 0.15,
  explodeEnd: 0.55,
  inkEnd: 0.85,
  /** The part starts this far out when it assembles in. */
  assembleFrom: 1.6,
} as const;

/** Total pinned scroll, in vh. */
export const PIN_VH = TIMING.introVh + ITEMS.length * TIMING.itemVh;

export function smootherstep(x: number): number {
  const t = x <= 0 ? 0 : x >= 1 ? 1 : x;
  return t * t * t * (t * (t * 6 - 15) + 10);
}

const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x);

export interface StageState {
  /** 0–3 */
  item: number;
  /** Progress through the item's 80vh, 0–1 (negative during the intro, down to −0.25). */
  p: number;
}

/** Pin progress (0–1 over PIN_VH) → active item and its local progress. */
export function stageAt(progress: number): StageState {
  const s = clamp01(progress) * PIN_VH - TIMING.introVh;
  if (s < 0) return { item: 0, p: s / TIMING.itemVh };
  const item = Math.min(ITEMS.length - 1, Math.floor(s / TIMING.itemVh));
  return { item, p: Math.min(1, (s - item * TIMING.itemVh) / TIMING.itemVh) };
}

/** Pin progress at which `item` reaches local progress `p` (the inverse of stageAt). */
export function progressAt(item: number, p: number): number {
  return (TIMING.introVh + (item + p) * TIMING.itemVh) / PIN_VH;
}

/**
 * Explode factor at local progress p: 1.6 → 0 while assembling in (the first item also uses the
 * intro), 0 → 1 through EXPLODE, then 1.
 */
export function explodeAt(p: number, item: number): number {
  const { assembleEnd, explodeEnd, assembleFrom } = TIMING;
  if (p < assembleEnd) {
    const start = item === 0 ? -TIMING.introVh / TIMING.itemVh : 0;
    const u = (p - start) / (assembleEnd - start);
    return assembleFrom * (1 - smootherstep(u));
  }
  return smootherstep((p - assembleEnd) / (explodeEnd - assembleEnd));
}

/** Callout INK progress at local progress p (0 → 1 across 55–85%). */
export function inkAt(p: number): number {
  return clamp01((p - TIMING.explodeEnd) / (TIMING.inkEnd - TIMING.explodeEnd));
}

/** How many thread messages have arrived at pin progress `progress` (the greeting is always there). */
export function arrivedAt(progress: number): number {
  const { item, p } = stageAt(progress);
  if (item === 0) return p < -0.12 ? 1 : 2;
  if (item < 3) return item + 2;
  return p < 0.5 ? 5 : 6;
}
