// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Shop-time clock math. Everything is computed in SHOP.tz (America/Chicago), not the visitor's
 * zone: a driver in another time zone still sees "Open · until {close time}" when the shop is open.
 * Pure functions; the React side (a minute-aligned clock) lives in lib/use-media.ts.
 */
import { SHOP, formatClock, type DayHours, type Holiday } from "./facts";

export interface ShopParts {
  year: number;
  month: number;
  day: number;
  /** 0 = Sunday. */
  weekday: number;
  hour: number;
  minute: number;
  /** "2026-10-31" */
  dateKey: string;
}

export interface ShopStatus {
  open: boolean;
  /** Closed for a holiday today. */
  holiday: boolean;
  holidayName?: string;
  /** Header chip text, shown after the dot: "Open · until {close time}", "Closed · opens {open time}". */
  chip: string;
  /** Hero status line, shown after the dot: "Open now · closes {close time}". */
  line: string;
  closesAt?: Date;
  opensAt?: Date;
}

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

let dtf: Intl.DateTimeFormat | null = null;
function formatter() {
  // Building an Intl formatter is the expensive part; build it once.
  dtf ??= new Intl.DateTimeFormat("en-US", {
    timeZone: SHOP.tz,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
  return dtf;
}

const pad = (n: number) => String(n).padStart(2, "0");
const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

function rawParts(ms: number) {
  const out: Record<string, number> = {};
  for (const p of formatter().formatToParts(new Date(ms))) {
    if (p.type !== "literal") out[p.type] = Number(p.value);
  }
  return out as { year: number; month: number; day: number; hour: number; minute: number; second: number };
}

/** Wall-clock parts of `date` in shop time. */
export function shopParts(date: Date = new Date()): ShopParts {
  const p = rawParts(date.getTime());
  const dateKey = `${p.year}-${pad(p.month)}-${pad(p.day)}`;
  return { year: p.year, month: p.month, day: p.day, hour: p.hour % 24, minute: p.minute, weekday: weekdayOf(dateKey), dateKey };
}

/** "2026-10-31" for `date` in shop time. */
export function dateKey(date: Date = new Date()): string {
  return shopParts(date).dateKey;
}

/** Calendar arithmetic on date keys (no time zone involved). */
export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export function weekdayOf(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** "Mon, Nov 2" */
export function dayLabel(key: string): string {
  const [, m, d] = key.split("-").map(Number);
  return `${WEEKDAY_SHORT[weekdayOf(key)]}, ${MONTH_SHORT[m - 1]} ${d}`;
}

/** "Mon" */
export function weekdayShort(key: string): string {
  return WEEKDAY_SHORT[weekdayOf(key)];
}

/**
 * The instant at which the shop's wall clock reads `hhmm` on `key`. Handles DST (the offset is
 * measured at the target instant, then re-measured once in case the guess crossed a change).
 */
export function zonedDate(key: string, hhmm: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  const [hh, mm] = hhmm.split(":").map(Number);
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  const offsetAt = (ms: number) => {
    const p = rawParts(ms);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second) - Math.floor(ms / 1000) * 1000;
  };
  let ms = wall - offsetAt(wall);
  ms = wall - offsetAt(ms);
  return new Date(ms);
}

export function holidayOn(key: string): Holiday | undefined {
  return SHOP.holidays.find((h) => h.date === key);
}

/** Opening hours on `key`, or null when closed all day (Sundays and holidays). */
export function hoursFor(key: string): DayHours | null {
  if (holidayOn(key)) return null;
  return SHOP.hours[weekdayOf(key)] ?? null;
}

export function isBusinessDay(key: string): boolean {
  return hoursFor(key) !== null;
}

/** Which row of the location sheet's hours table is "today". */
export function hoursRow(date: Date = new Date()): "weekdays" | "saturday" | "sunday" {
  const w = shopParts(date).weekday;
  return w === 0 ? "sunday" : w === 6 ? "saturday" : "weekdays";
}

/** Next opening at or after (key, minute-of-day): skips Sundays and holidays. */
function nextOpen(key: string, minute: number): { key: string; hours: DayHours } | null {
  for (let i = 0; i < 14; i++) {
    const k = addDays(key, i);
    const h = hoursFor(k);
    if (!h) continue;
    if (i > 0 || minute < toMinutes(h.open)) return { key: k, hours: h };
  }
  return null;
}

/** "today" / "tomorrow" / "Mon", relative to `fromKey`. */
function relativeDay(fromKey: string, key: string): string {
  if (key === fromKey) return "today";
  if (key === addDays(fromKey, 1)) return "tomorrow";
  return weekdayShort(key);
}

/**
 * Open-now status in shop time.
 *   open weekday   chip "Open · until {close time}"   line "Open now · closes {close time}"
 *   open Saturday  chip "Open · until {close time}"   line "Open now · closes {close time}"
 *   closed         chip "Closed · opens {open time}"     line "Closed · opens tomorrow {open time} · key drop open 24/7"
 *   holiday        chip "Closed today · key drop open"
 * The chip names the weekday when the next opening isn't today or tomorrow ("Closed · opens Mon {open time}").
 */
export function shopStatus(now: Date = new Date()): ShopStatus {
  const p = shopParts(now);
  const minute = p.hour * 60 + p.minute;
  const today = hoursFor(p.dateKey);
  const hol = holidayOn(p.dateKey);

  if (today && minute >= toMinutes(today.open) && minute < toMinutes(today.close)) {
    return {
      open: true,
      holiday: false,
      chip: `Open · until ${formatClock(today.close, "ampm")}`,
      line: `Open now · closes ${formatClock(today.close)}`,
      closesAt: zonedDate(p.dateKey, today.close),
    };
  }

  const next = nextOpen(p.dateKey, minute);
  const when = next ? relativeDay(p.dateKey, next.key) : "";
  const opensAt = next ? zonedDate(next.key, next.hours.open) : undefined;
  const nearby = when === "today" || when === "tomorrow";
  const chipOpen = next ? `${nearby ? "" : `${when} `}${formatClock(next.hours.open, "ampm")}` : "";

  if (hol) {
    return {
      open: false,
      holiday: true,
      holidayName: hol.name,
      chip: "Closed today · key drop open",
      line: `Closed today for ${hol.name} · opens ${when} ${next ? formatClock(next.hours.open) : ""} · key drop open 24/7`,
      opensAt,
    };
  }

  return {
    open: false,
    holiday: false,
    chip: `Closed · opens ${chipOpen}`,
    line: `Closed · opens ${when} ${next ? formatClock(next.hours.open) : ""} · key drop open 24/7`,
    opensAt,
  };
}
