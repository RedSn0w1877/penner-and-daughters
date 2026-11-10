// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The appointment book. There's no server, so availability is generated: each day's grid is
 * seeded by its date string (FNV-1a → mulberry32), which makes it stable across reloads,
 * visitors and the server/client boundary. About 45% of slots are open, with a floor of
 * 3 open slots on a weekday and 2 on a Saturday.
 */
import { SHOP, formatClock } from "./facts";
import { addDays, dateKey, dayLabel, isBusinessDay, weekdayOf, zonedDate } from "./hours";

export interface Slot {
  /** "{date}T{hh:mm}" */
  id: string;
  /** Shop wall-clock time, "hh:mm". */
  time: string;
  start: Date;
  /** "h:mm AM" */
  label: string;
  /** False = taken (pencil-struck in the book). */
  open: boolean;
}

export interface BusinessDay {
  /** "2026-11-02" */
  key: string;
  /** "Mon, Nov 2" */
  label: string;
  weekday: number;
  saturday: boolean;
}

/** A slot is open when rand() > OPEN_THRESHOLD. */
const OPEN_THRESHOLD = 0.55;
const MIN_OPEN = { weekday: 3, saturday: 2 } as const;

/** 32-bit FNV-1a. */
function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const toHHMM = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** Half-hour start times for a day: from opening to the last slot of each day (see facts.ts for the hours). */
export function slotTimes(key: string): string[] {
  if (!isBusinessDay(key)) return [];
  const range = weekdayOf(key) === 6 ? SHOP.slots.saturday : SHOP.slots.weekday;
  const out: string[] = [];
  for (let t = toMinutes(range.first); t <= toMinutes(range.last); t += SHOP.slots.stepMinutes) out.push(toHHMM(t));
  return out;
}

/** Every slot on a day (open and taken). Empty on Sundays and holidays. */
export function slotsFor(day: string | Date): Slot[] {
  const key = typeof day === "string" ? day : dateKey(day);
  const times = slotTimes(key);
  if (!times.length) return [];

  const rand = mulberry32(fnv1a(key));
  const open = times.map(() => rand() > OPEN_THRESHOLD);
  const floor = weekdayOf(key) === 6 ? MIN_OPEN.saturday : MIN_OPEN.weekday;
  let count = open.filter(Boolean).length;
  while (count < floor) {
    const i = Math.floor(rand() * times.length);
    if (!open[i]) {
      open[i] = true;
      count++;
    }
  }

  return times.map((time, i) => ({
    id: `${key}T${time}`,
    time,
    start: zonedDate(key, time),
    label: formatClock(time),
    open: open[i],
  }));
}

/**
 * The next `n` business days (Mon–Sat, skipping Sundays and holidays), starting with `from`'s own
 * date when that is a business day. Labels read "Mon, Nov 2".
 */
export function businessDays(from: Date = new Date(), n = 10): BusinessDay[] {
  const out: BusinessDay[] = [];
  let key = dateKey(from);
  for (let guard = 0; out.length < n && guard < n * 3 + 14; guard++, key = addDays(key, 1)) {
    if (!isBusinessDay(key)) continue;
    const weekday = weekdayOf(key);
    out.push({ key, label: dayLabel(key), weekday, saturday: weekday === 6 });
  }
  return out;
}

/** Earliest bookable time: SHOP.slots.leadMinutes (90) from now. */
export function earliestBookable(now: Date = new Date()): Date {
  return new Date(now.getTime() + SHOP.slots.leadMinutes * 60_000);
}

/** Open and far enough ahead to book. */
export function isBookable(slot: Slot, now: Date = new Date()): boolean {
  return slot.open && slot.start.getTime() >= earliestBookable(now).getTime();
}

/** "today {time}" · "tomorrow {time}" · "Mon, Nov 2 · {time}" */
export function slotPhrase(slot: Slot, now: Date = new Date()): string {
  const todayKey = dateKey(now);
  const key = slot.id.slice(0, 10);
  if (key === todayKey) return `today ${slot.label}`;
  if (key === addDays(todayKey, 1)) return `tomorrow ${slot.label}`;
  return `${dayLabel(key)} · ${slot.label}`;
}

/** The first open slot at least 90 minutes out, skipping Sundays and holidays. */
export function nextOpening(now: Date = new Date()): { start: Date; label: string; slot: Slot } | null {
  const earliest = earliestBookable(now).getTime();
  let key = dateKey(now);
  for (let i = 0; i < 30; i++, key = addDays(key, 1)) {
    for (const slot of slotsFor(key)) {
      if (slot.open && slot.start.getTime() >= earliest) {
        return { start: slot.start, label: slotPhrase(slot, now), slot };
      }
    }
  }
  return null;
}
