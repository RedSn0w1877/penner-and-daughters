// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * "How long will I be without my car?" — one car's day (RO 4471), told three ways from this one
 * file: the desktop film chapter, the stacked day sheet (phones, tablets, lite, no JS) and the
 * tracker card (also /track/). Every quoted string is final copy (spec §11.5).
 *
 * Shop facts never get typed here: the opening time, the closing hour, the advisor and the
 * technician, the pickup box and the story total all come from lib/facts and lib/pricing, so the
 * day stays true if the shop's hours or prices change.
 */
import { GETTING_AROUND, PHONE_TEXT, SHOP, formatClock } from "@/lib/facts";
import { STORY_TOTALS, money } from "@/lib/pricing";
import type { ClipId, PhotoId } from "./media";

const car = SHOP.exampleCar;
const total = money(STORY_TOTALS.approved);
/** The story runs on a Tuesday ("Day sheet · Tue"). */
const tuesday = SHOP.hours[2]!;
const closesAt = formatClock(tuesday.close, "short");

/** "HH:MM" → minutes after midnight. */
const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const DAY = 24 * 60;

/**
 * Media labels on every print and film in this section (the burned-in watermark is on the frames).
 * They live in data/media.ts, next to the files they describe: "AI-generated" for the Flow stills
 * and clips, "stock footage" for the Pexels torque clip.
 */
export { MEDIA_LABEL } from "./media";

/* =============================================================================================
 * The night (phase 1) and the dawn
 * =========================================================================================== */

/**
 * Clock values are minutes after midnight on the night of the drop. The morning runs past 1440,
 * so the drums keep turning forward through midnight while the clock scrubs.
 */
export const NIGHT = {
  title: "How long will I be without my car?",
  lead: "Here's one car's day, from the night drop to pickup. Every step comes with a text.",

  /** 7:12 PM: keys in the slot. */
  dropAt: toMinutes("19:12"),
  dropLine: "The night before.",
  dropNote: "Keys and a note go in the steel slot by the blue door. Envelopes and a pen are inside the box.",

  /** 6:30 AM the next morning. */
  waitAt: DAY + toMinutes("06:30"),
  waitLine: "Your car waits in our lot overnight.",

  /** The bay door goes up at opening time; the clock clicks over from the minute before. */
  openAt: DAY + toMinutes(tuesday.open),
  doorLine: `${formatClock(tuesday.open, "hm")}. Bay door up. Your car is first in.`,

  developCaption: "Same bay you saw up top. Now it's your car's turn.",

  /** Under the drum clock, so nobody reads it as the real time. */
  clockCaption: "The time, through one example day",
} as const;

/* =============================================================================================
 * The day (phase 2): the day sheet's columns, the seven steps, the texts
 * =========================================================================================== */

export type DayColumnId = "keys-in" | "looking" | "waiting" | "parts" | "repair" | "road-test" | "ready";

export const DAY_COLUMNS: ReadonlyArray<{ id: DayColumnId; label: string }> = [
  { id: "keys-in", label: "Keys in" },
  { id: "looking", label: "Looking" },
  { id: "waiting", label: "Waiting on you" },
  { id: "parts", label: "Parts" },
  { id: "repair", label: "Repair" },
  { id: "road-test", label: "Road test" },
  { id: "ready", label: "Ready" },
];

export const columnIndex = (id: DayColumnId) => DAY_COLUMNS.findIndex((c) => c.id === id);

/** What the print on the day sheet shows at a step. */
export type DayPrintMedia =
  | { kind: "clip"; clip: ClipId; once: boolean }
  | { kind: "photo"; photo: PhotoId }
  /** The customer's blue "APPROVED BY YOU" stamp lands over the print. */
  | { kind: "stamp" };

export interface DayText {
  from: "shop" | "you";
  time: string;
  body: string;
  /** The button inside the last bubble ("Pay $434.38 (demo)"). */
  action?: string;
}

export interface DayStep {
  id: string;
  /** "7:45 AM" */
  time: string;
  /** Minutes after midnight on the drop night (for the drum clock). */
  minutes: number;
  column: DayColumnId;
  line: string;
  print: DayPrintMedia;
  texts: readonly DayText[];
}

const at = (hhmm: string) => ({ time: formatClock(hhmm), minutes: DAY + toMinutes(hhmm) });

export const DAY_SHEET = {
  title: "Day sheet · Tue",
  car: `Repair order ${car.ro} · ${car.description}`,
  /** The CSS phone's thread header. */
  thread: `${SHOP.advisor.first} · ${SHOP.shortName}`,
  threadMeta: "Text message · Today",
  nightDrop: "Book a night drop",
} as const;

export const DAY_STEPS: readonly DayStep[] = [
  {
    id: "lift",
    ...at("07:45"),
    column: "looking",
    line: "Up on the lift for a first look.",
    print: { kind: "clip", clip: "lift-rise", once: true },
    texts: [],
  },
  {
    id: "photos",
    ...at("08:15"),
    column: "waiting",
    line: "Photos and a written price, by text.",
    print: { kind: "clip", clip: "pad-gauge", once: false },
    texts: [{ from: "shop", time: formatClock("08:15"), body: "Photos are in. Four things; one we'd fix today." }],
  },
  {
    id: "approved",
    ...at("08:40"),
    column: "parts",
    line: `You approved front pads and the left front tire: ${total}. The belt can wait; we'll remind you in 3 months.`,
    print: { kind: "stamp" },
    texts: [
      { from: "you", time: formatClock("08:40"), body: "Do the pads and the tire. Belt next time." },
      { from: "shop", time: formatClock("08:41"), body: "Thanks! Parts ordered. Ready by mid-afternoon." },
    ],
  },
  {
    id: "parts",
    ...at("10:30"),
    column: "repair",
    line: `Parts arrive. ${SHOP.tech.first} gets to work.`,
    print: { kind: "photo", photo: "parts" },
    texts: [{ from: "shop", time: formatClock("10:30"), body: "Parts are here." }],
  },
  {
    id: "torque",
    ...at("12:50"),
    column: "repair",
    line: "Wheels back on, torqued in a star pattern.",
    print: { kind: "clip", clip: "torque", once: true },
    texts: [],
  },
  {
    id: "road",
    ...at("13:15"),
    column: "road-test",
    line: "Road test: 6 miles, brakes bedded in.",
    print: { kind: "clip", clip: "road-test", once: true },
    texts: [{ from: "shop", time: formatClock("13:16"), body: "Out on a road test." }],
  },
  {
    id: "ready",
    ...at("14:05"),
    column: "ready",
    line: `Ready. Pay by text. Keys at the counter until ${closesAt}, or in pickup box ${car.pickupBox} any time after.`,
    print: { kind: "clip", clip: "pickup-box", once: true },
    texts: [
      {
        from: "shop",
        time: formatClock("14:05"),
        body: `All done. ${total}, supplies and tax included. Keys at the counter until ${closesAt}, or pickup box ${car.pickupBox} after hours; I'll text you the code.`,
        action: `Pay ${total} (demo)`,
      },
    ],
  },
];

/**
 * The shop's auto-reply to the night drop. It seeds the film chapter's phone, so the thread is
 * never blank before the first step's text (the getting-around copy: "We text you when we start").
 */
export const NIGHT_REPLY: DayText & { key: string } = {
  from: "shop",
  time: formatClock("19:14"),
  body: "Got your keys. We'll text you when we start.",
  key: "night-reply",
};

/** Every text up to and including step `n` (1-based; 0 = none yet). */
export function textsThrough(n: number): Array<DayText & { step: number; key: string }> {
  return DAY_STEPS.slice(0, n).flatMap((s, i) => s.texts.map((t, j) => ({ ...t, step: i + 1, key: `${s.id}-${j}` })));
}

/** The print a step shows; the approval stamp lands over the previous step's print. */
export function printFor(stepIndex: number): Exclude<DayPrintMedia, { kind: "stamp" }> | null {
  for (let i = stepIndex; i >= 0; i--) {
    const p = DAY_STEPS[i]?.print;
    if (p && p.kind !== "stamp") return p;
  }
  return null;
}

/* =============================================================================================
 * Getting around while we work
 * =========================================================================================== */

export const GETTING_AROUND_COPY = {
  title: "Getting around while we work",
  items: GETTING_AROUND,
} as const;

/* =============================================================================================
 * Track my car (the card on the day sheet and /track/)
 * =========================================================================================== */

export const TRACKER_STEPS: ReadonlyArray<{ id: string; label: string; time: string }> = [
  { id: "keys", label: "Keys in", time: `${formatClock("19:12")}, the night before` },
  { id: "lift", label: "On the lift", time: DAY_STEPS[0].time },
  { id: "photos", label: "Photos sent", time: DAY_STEPS[1].time },
  { id: "approved", label: "Approved", time: DAY_STEPS[2].time },
  { id: "parts", label: "Parts in", time: DAY_STEPS[3].time },
  { id: "road", label: "Road test", time: DAY_STEPS[5].time },
  { id: "ready", label: "Ready", time: DAY_STEPS[6].time },
];

/** The live step before anyone runs the demo: mid-morning, parts just in. */
export const TRACKER_DEFAULT_LIVE = 4;

/** "Run the demo day" plays the seven steps in 20 seconds. */
export const TRACKER_RUN_MS = 20_000;

export const TRACKER_COPY = {
  title: "Track my car",
  roLabel: "Repair order number",
  show: "Show status",
  car: `Repair order ${car.ro} · ${car.description}`,
  advisor: `${SHOP.advisor.role}: ${SHOP.advisor.name}`,
  now: "Now",
  run: "Run the demo day",
  pause: "Pause",
  textMe: "Text me updates",
  callAdvisor: PHONE_TEXT.callAdvisor,
  notFound: `We can't find that number. In this demo, try ${car.ro}.`,
  ro: car.ro,
} as const;

/** "Keys in · 7:12 PM, the night before" */
export const trackerStepText = (i: number) => `${TRACKER_STEPS[i].label} · ${TRACKER_STEPS[i].time}`;
