// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Every fact about the shop lives here and only here: name, address, phone numbers, hours,
 * holidays, people, the warranty wording and the shared fine print. Components import these
 * and never retype them, so a client build changes one file. (The acceptance grep checks that
 * the phone number, the street address and the hours appear in this file only.)
 *
 * Penner & Daughters is fictional. The (555) numbers can't be dialed, and there is deliberately
 * no state, ZIP or map coordinate anywhere.
 */
import { COPYRIGHT_NOTICE, STUDIO } from "./copyright";

/** Shop hours for one day, as 24-hour "HH:MM" wall-clock strings in shop time. */
export interface DayHours {
  readonly open: string;
  readonly close: string;
}

export interface Holiday {
  /** ISO date in shop time. */
  readonly date: string;
  readonly name: string;
  /** "Thu, Nov 26" */
  readonly short: string;
}

/** 0 = Sunday … 6 = Saturday (same as Date#getDay). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const WEEKDAYS: DayHours = { open: "07:30", close: "18:00" };
const SATURDAY: DayHours = { open: "08:00", close: "13:00" };
/** The free shuttle runs a shorter day than the shop. */
const SHUTTLE: DayHours = { open: "07:30", close: "17:00" };

const NAME = "Penner & Daughters Auto Repair";
const SHORT = "Penner & Daughters";
const STREET = "2207 Cooper Mill Road";
const TOWN = "Halden Crossing";
const PHONE = "(555) 014-2290";
const OWNER_PHONE = "(555) 014-2297";

/**
 * "HH:MM" (24 h) → clock text.
 * - full  "7:30 AM", "6:00 PM"   (status lines, slots, the hours table)
 * - ampm  "7:30 AM", "6 PM"      (drops ":00"; chips and compact lines)
 * - short "7:30", "6"            (no suffix; the reserved-width chip fallback)
 * - hm    "7:30", "5:00"         (no suffix, keeps minutes)
 */
export function formatClock(hhmm: string, style: "full" | "ampm" | "short" | "hm" = "full"): string {
  const [h, m] = hhmm.split(":").map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const suffix = h < 12 ? "AM" : "PM";
  const mm = String(m).padStart(2, "0");
  if (style === "full") return `${h12}:${mm} ${suffix}`;
  if (style === "hm") return `${h12}:${mm}`;
  const t = m === 0 ? `${h12}` : `${h12}:${mm}`;
  return style === "ampm" ? `${t} ${suffix}` : t;
}

export const SHOP = {
  name: NAME,
  shortName: SHORT,
  /** Header wordmark: name in Archivo 820, then "Auto Repair" in graphite. */
  wordmark: { name: SHORT, sub: "Auto Repair" },
  /** The letterhead and the stamps are the only all-caps text on the site. */
  letterhead: SHORT.toUpperCase(),
  founded: 1998,
  /** Names only: never photos, never faces. */
  owner: { name: "Ruth Penner", first: "Ruth", role: "Owner" },
  advisor: { name: "Ana Penner", first: "Ana", role: "Service advisor" },
  tech: { name: "Cass Penner", first: "Cass", role: "Lead technician" },

  street: STREET,
  town: TOWN,
  address: `${STREET}, ${TOWN}`,
  road: "Cooper Mill Road",
  cross: "Tanner Street",
  landmark: "the old grain elevator",
  directions: {
    fromRoute9: "From Route 9, turn onto Cooper Mill Road at the grain elevator. We're the second building on the right.",
    parking:
      "Park in spaces 1–6 on the Tanner Street side. The blue door on the left is the office; the steel key slot is just to its right.",
  },

  phone: {
    display: PHONE,
    tel: "tel:+15550142290",
    sms: "sms:+15550142290",
    /** schema.org wants this shape. */
    schema: "+1-555-014-2290",
  },
  /** Owner's direct line: the warranty block and the footer only. */
  ownerPhone: { display: OWNER_PHONE, tel: "tel:+15550142297" },

  /** Shop time zone. A real client build pins the shop's own IANA zone here. */
  tz: "America/Chicago",
  siteUrl: "https://redsn0w1877.github.io/penner-and-daughters/",
  towns: ["Halden Crossing", "North Halden", "Millbrook Flats", "Cedar Point", "Wren Valley"],

  /** Index = weekday (0 Sunday). null = closed. Key drop and pickup boxes are 24/7 regardless. */
  hours: [null, WEEKDAYS, WEEKDAYS, WEEKDAYS, WEEKDAYS, WEEKDAYS, SATURDAY] as ReadonlyArray<DayHours | null>,
  holidays: [
    { date: "2026-11-26", name: "Thanksgiving", short: "Thu, Nov 26" },
    { date: "2026-12-25", name: "Christmas Day", short: "Fri, Dec 25" },
    { date: "2027-01-01", name: "New Year's Day", short: "Fri, Jan 1" },
  ] as ReadonlyArray<Holiday>,

  /** Booking grid: half-hour rows; nextOpening() needs this much notice. */
  slots: {
    weekday: { first: "07:30", last: "16:30" },
    saturday: { first: "08:00", last: "12:00" },
    waitWithUsLast: "15:30",
    stepMinutes: 30,
    leadMinutes: 90,
  },

  gettingAround: {
    shuttleMiles: 5,
    shuttleHours: SHUTTLE,
    rideCreditMax: 20,
    loaners: 2,
    farAwayMiles: 50,
  },

  notDone: ["bodywork and paint", "glass", "transmission rebuilds"],

  /** The one example car that runs through the whole page. */
  exampleCar: {
    ro: "4471",
    description: "2015 compact sedan",
    miles: "98,412 mi",
    keyTag: "4471",
    pickupBox: 3,
  },
} as const;

/** Today-style status text and every printed form of the hours. Built from SHOP.hours, never typed. */
const f = formatClock;
const wd = WEEKDAYS;
const sa = SATURDAY;

export const HOURS_TEXT = {
  /** Status chip before hydration (reserved width): "Mon–Fri 7:30–6 · Sat 8–1" */
  chipFallback: `Mon–Fri ${f(wd.open, "short")}–${f(wd.close, "short")} · Sat ${f(sa.open, "short")}–${f(sa.close, "short")}`,
  /** Hero status line before hydration. */
  lineFallback: `Mon–Fri ${f(wd.open, "ampm")}–${f(wd.close, "ampm")} · Sat ${f(sa.open, "ampm")}–${f(sa.close, "ampm")} · key drop 24/7`,
  /** Footer. */
  footer: `Mon–Fri ${f(wd.open, "ampm")}–${f(wd.close, "ampm")} · Sat ${f(sa.open, "ampm")}–${f(sa.close, "ampm")} · Sun closed · Key drop and pickup boxes 24/7`,
  /** In a sentence: "Mon–Fri 7:30 AM–6 PM, Sat 8 AM–1 PM" */
  sentence: `Mon–Fri ${f(wd.open, "ampm")}–${f(wd.close, "ampm")}, Sat ${f(sa.open, "ampm")}–${f(sa.close, "ampm")}`,
  /** Location sheet hours table. */
  table: [
    { id: "weekdays", days: "Monday–Friday", hours: `${f(wd.open)} – ${f(wd.close)}` },
    { id: "saturday", days: "Saturday", hours: `${f(sa.open)} – ${f(sa.close)}` },
    { id: "sunday", days: "Sunday", hours: "Closed" },
  ] as const,
  keyDrop: "Key drop and pickup boxes: open 24/7",
  holidays: "Closed Thanksgiving (Thu, Nov 26), Christmas Day and New Year's Day.",
  waitWithUs: `Wait-with-us times run ${f(SHOP.slots.weekday.first)}–${f(SHOP.slots.waitWithUsLast)}.`,
  saturdaySlots: "Saturday mornings only",
  shuttle: `weekdays ${f(SHUTTLE.open, "hm")}–${f(SHUTTLE.close, "hm")}`,
} as const;

/** Phone numbers inside sentences. The number itself is only ever SHOP.phone.display. */
export const PHONE_TEXT = {
  call: `Call ${PHONE}`,
  callOrText: `${PHONE} · call or text`,
  ownerLine: `Owner's direct line: ${SHOP.owner.name}, ${OWNER_PHONE}`,
  bookFallback: `Call or text ${PHONE} to book. ${HOURS_TEXT.sentence}.`,
  guideFootnote: `This guide can't see your car. If anything feels unsafe, pull over and call ${PHONE}.`,
  warrantyClaim: `Call or text ${PHONE}. We inspect it free.`,
  ownerTag: `Something not right? ${SHOP.owner.name}, owner: ${OWNER_PHONE}. That's my direct line.`,
  approveOrCall: `Approve line by line, or call me: ${PHONE}.`,
  callAdvisor: `Call ${SHOP.advisor.first}: ${PHONE}`,
} as const;

/** Getting around while we work (day sheet) and the arrival choices (booking step 2). */
const ga = SHOP.gettingAround;
export const GETTING_AROUND = [
  { id: "wait", title: "Wait with us", body: "Jobs under an hour: coffee, Wi-Fi, a desk with outlets, and a window into Bay 1." },
  { id: "dropoff", title: "Drop off", body: "Any time we're open. We text you when it's ready." },
  {
    id: "nightdrop",
    title: "Night key drop",
    body: "Open 24/7. Park in any numbered space, grab an envelope from the box by the slot, write your name, number and what's going on, and drop it in with your keys. We text you when we start.",
  },
  { id: "shuttle", title: "Free shuttle", body: `Within ${ga.shuttleMiles} miles, ${HOURS_TEXT.shuttle}.` },
  { id: "ride", title: "Ride credit", body: `Up to $${ga.rideCreditMax} each way, beyond the shuttle's ${ga.shuttleMiles} miles.` },
  {
    id: "loaner",
    title: "Loaner car",
    body: "Two of them, free, for jobs that run past a day. Reserve when you book; just replace the fuel you use.",
  },
] as const;

export type Arrival = "wait" | "dropoff" | "nightdrop" | "ride";

export const ARRIVALS: ReadonlyArray<{ id: Arrival; label: string; note?: string }> = [
  { id: "wait", label: "Wait with us", note: "Jobs under an hour." },
  { id: "dropoff", label: "Drop it off" },
  { id: "nightdrop", label: "Night key drop", note: "Leave your keys the night before." },
  {
    id: "ride",
    label: "I need a ride",
    note: `Free shuttle within ${ga.shuttleMiles} miles. Ride credit up to $${ga.rideCreditMax} beyond that. Loaner for jobs that run past a day.`,
  },
];

/** One warranty, one wording. Every variant below is the same promise in a different seat. */
export const WARRANTY = {
  months: 36,
  miles: 36_000,
  /** The canonical sentence. */
  sentence: "36 months / 36,000 miles, parts and labor, on every repair we do.",
  /** Hero promise and the booking summary ("…warranty, parts and labor"). */
  short: "36 months / 36,000 miles warranty, parts and labor",
  /** Estimate grade note. */
  adjective: "36-month / 36,000-mile warranty",
  /** Embossed on the card. */
  embossed: "36 months · 36,000 miles",
  /** The last ratchet line. */
  ratchet: "36 months. 36,000 miles.",
  lead: "Every repair we do is covered for 36 months or 36,000 miles, parts and labor. Here's exactly what that means.",
  card: "Parts and labor, on every repair we do.",
  covered: "Every part we install and the labor to put it in.",
  notCovered:
    "Normal wear on brake pads and wiper blades. Damage from accidents or abuse. Parts you bring in: we cover our labor for 12 months.",
  claim: PHONE_TEXT.warrantyClaim,
  outOfTown: `More than ${ga.farAwayMiles} miles away? Call us first. We'll authorize a nearby shop and pay parts and labor up to our posted rates.`,
} as const;

/** The fine print every page carries. */
export const COPY = {
  /** Notice line at the top of every page. */
  notice: `Portfolio sample by ${STUDIO} · ${SHORT} is a fictional shop`,
  /** Right side of every sheet's foot imprint. */
  imprint: `Portfolio sample by ${STUDIO} · fictional business · do not redistribute`,
  /** The printed estimate's imprint. */
  printImprint: `Portfolio sample by ${STUDIO} · fictional business`,
  fictionLine: `${SHORT} is a fictional shop.`,
  /** Footer disclosure: says what each kind of media is (data/media.ts MEDIA_LABEL uses the same words). */
  footerFiction: `${SHORT} is a fictional business. The address and phone numbers are made up for an ${STUDIO} portfolio sample. The photos and clips of the shop are AI-generated for the sample, one clip (a wrench on a wheel) is stock footage from Pexels, and the parts diagrams, the blue key tag and the binder clips are 3D renders. There is no real ${SHORT} to show.`,
  copyright: COPYRIGHT_NOTICE,
} as const;

/**
 * sms: link with an optional prefilled body. "?&body=" is the form both iOS and Android accept.
 * The body is preset copy (never user data).
 */
export function smsHref(body?: string): string {
  return body ? `${SHOP.phone.sms}?&body=${encodeURIComponent(body)}` : SHOP.phone.sms;
}

/** The hero's "or text us" body. */
export const SMS_BODY_DEFAULT = `Hi ${SHORT}, about my car: `;
