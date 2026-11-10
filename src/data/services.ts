// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The price list (32 rows, compact-car base), its groups, the eight service pages, and the
 * money-bearing copy that the price list, the estimate and the booking flow print. Ranges are
 * numbers; every "$150–$350" on the site is formatted from them.
 */
import { SHOP, WARRANTY } from "@/lib/facts";
import {
  DIAG,
  DIAG_CREDIT_DAYS,
  PARTS_TAX,
  PPI,
  SECOND_OPINION_MINUTES,
  SPLIT_PAY_OVER,
  SUPPLIES_RATE,
  TIRE_DISPOSAL,
  money,
  moneyRange,
} from "@/lib/pricing";
import type { SymptomId } from "./symptoms";

export type ServiceGroupId =
  | "brakes"
  | "battery"
  | "engine"
  | "cooling"
  | "ac"
  | "steering"
  | "tires"
  | "maintenance"
  | "used";

export type ServiceId =
  | "brake-pads"
  | "pads-rotors"
  | "brake-fluid"
  | "battery-test"
  | "battery"
  | "alternator"
  | "starter"
  | "diagnosis"
  | "spark-plugs"
  | "misfire"
  | "o2-sensor"
  | "catalytic"
  | "timing-belt"
  | "serpentine"
  | "coolant"
  | "thermostat"
  | "water-pump"
  | "radiator"
  | "ac-check"
  | "ac-compressor"
  | "struts"
  | "sway-links"
  | "wheel-bearing"
  | "cv-axle"
  | "tire"
  | "rotation"
  | "rotation-balance"
  | "alignment"
  | "oil"
  | "filters"
  | "trans-fluid"
  | "pre-purchase";

export type ServicePageSlug =
  | "brakes"
  | "check-engine-light"
  | "battery-and-starting"
  | "cooling-and-overheating"
  | "air-conditioning"
  | "steering-and-suspension"
  | "tires-and-alignment"
  | "oil-and-maintenance";

export type ServicePrice =
  | { kind: "range"; low: number; high: number }
  | { kind: "flat"; amount: number; note?: string }
  | { kind: "free" };

export interface Service {
  id: ServiceId;
  group: ServiceGroupId;
  name: string;
  /** One plain sentence (or two). */
  sentence: string;
  /** "About 1 hr" */
  time: string;
  price: ServicePrice;
  /** A photo print that opens on tap (filters: P5). */
  photo?: "filters";
}

export interface ServiceGroup {
  id: ServiceGroupId;
  title: string;
  /** "More about brakes" → /services/brakes/ (Used cars has no page). */
  page?: { slug: ServicePageSlug; link: string };
}

const range = (low: number, high: number): ServicePrice => ({ kind: "range", low, high });

export const SERVICE_GROUPS: readonly ServiceGroup[] = [
  { id: "brakes", title: "Brakes", page: { slug: "brakes", link: "More about brakes" } },
  {
    id: "battery",
    title: "Battery and starting",
    page: { slug: "battery-and-starting", link: "More about batteries and starting" },
  },
  {
    id: "engine",
    title: "Engine and check-engine light",
    page: { slug: "check-engine-light", link: "More about the check-engine light" },
  },
  { id: "cooling", title: "Cooling", page: { slug: "cooling-and-overheating", link: "More about cooling and overheating" } },
  { id: "ac", title: "Air conditioning", page: { slug: "air-conditioning", link: "More about AC" } },
  {
    id: "steering",
    title: "Steering and suspension",
    page: { slug: "steering-and-suspension", link: "More about steering and suspension" },
  },
  { id: "tires", title: "Tires and alignment", page: { slug: "tires-and-alignment", link: "More about tires and alignment" } },
  { id: "maintenance", title: "Maintenance", page: { slug: "oil-and-maintenance", link: "More about oil and maintenance" } },
  { id: "used", title: "Used cars" },
];

/** All 32 rows, in price-list order. */
export const SERVICES: readonly Service[] = [
  // Brakes
  {
    id: "brake-pads",
    group: "brakes",
    name: "Brake pads, one axle",
    sentence: "New pads on both front or both rear wheels, with the hardware cleaned and lubricated. Cheapest at the first squeal.",
    time: "About 1 hr",
    price: range(150, 350),
  },
  {
    id: "pads-rotors",
    group: "brakes",
    name: "Brake pads and rotors, one axle",
    sentence:
      "Pads plus the discs they squeeze, when the rotors are worn thin, scored or shaking. We show you the measurement first.",
    time: "1.5–3 hrs",
    price: range(250, 500),
  },
  {
    id: "brake-fluid",
    group: "brakes",
    name: "Brake fluid exchange",
    sentence: "Brake fluid soaks up water over time. We change it on your manual's schedule or when a test says so, never by its color.",
    time: "45–60 min",
    price: range(100, 210),
  },
  // Battery and starting
  {
    id: "battery-test",
    group: "battery",
    name: "Battery and charging test",
    sentence: "We test before we sell you anything.",
    time: "About 15 min",
    price: { kind: "free" },
  },
  {
    id: "battery",
    group: "battery",
    name: "Battery, installed",
    sentence: "Most last 3–5 years. Start-stop cars need a heavier-duty AGM battery, at the top of the range.",
    time: "20–45 min",
    price: range(150, 400),
  },
  {
    id: "alternator",
    group: "battery",
    name: "Alternator",
    sentence: "It recharges the battery while you drive. We test the whole charging system first.",
    time: "1.5–3 hrs",
    price: range(450, 1100),
  },
  {
    id: "starter",
    group: "battery",
    name: "Starter",
    sentence: "One click, or nothing, with a healthy battery often points here. The price depends on how buried it is.",
    time: "1–3 hrs",
    price: range(350, 1100),
  },
  // Engine and check-engine light
  {
    id: "diagnosis",
    group: "engine",
    name: "Check-engine light diagnosis",
    sentence: "A code tells us where to start. We test to find the real cause, then send a written estimate.",
    time: "About 1 hr",
    price: { kind: "flat", amount: DIAG, note: "credited if you go ahead" },
  },
  {
    id: "spark-plugs",
    group: "engine",
    name: "Spark plugs",
    sentence: "On your manual's schedule. Some engines hide the back plugs, which adds time.",
    time: "1–3 hrs",
    price: range(150, 450),
  },
  {
    id: "misfire",
    group: "engine",
    name: "Misfire repair (coil and plugs)",
    sentence: "For a rough idle or a flashing check-engine light. Fixing it fast protects the catalytic converter.",
    time: "1–2 hrs",
    price: range(250, 500),
  },
  {
    id: "o2-sensor",
    group: "engine",
    name: "Oxygen sensor",
    sentence: "One of the most common fixes for a steady check-engine light.",
    time: "30–90 min",
    price: range(200, 400),
  },
  {
    id: "catalytic",
    group: "engine",
    name: "Catalytic converter",
    sentence: "The part that cleans the exhaust. It often fails after an ignored misfire. Parts can take 1–2 days.",
    time: "2–4 hrs",
    price: range(1000, 2500),
  },
  {
    id: "timing-belt",
    group: "engine",
    name: "Timing belt, usually with the water pump",
    sentence:
      "Scheduled on engines that use one, often every 60,000–100,000 miles. A snapped belt can wreck the engine.",
    time: "3–6 hrs; drop it off for the day",
    price: range(500, 1400),
  },
  {
    id: "serpentine",
    group: "engine",
    name: "Serpentine belt",
    sentence: "The long rubber belt that drives the alternator, the AC and often the water pump. We check the tensioner too.",
    time: "30–90 min",
    price: range(120, 250),
  },
  // Cooling
  {
    id: "coolant",
    group: "cooling",
    name: "Coolant exchange",
    sentence: "Fresh coolant of the type your engine needs, on your manual's schedule.",
    time: "About 1 hr",
    price: range(120, 250),
  },
  {
    id: "thermostat",
    group: "cooling",
    name: "Thermostat",
    sentence: "A stuck one makes the engine overheat, or never warm up.",
    time: "1–3 hrs",
    price: range(250, 750),
  },
  {
    id: "water-pump",
    group: "cooling",
    name: "Water pump",
    sentence: "A drip at the front of the engine or a whine from the pump leads to overheating.",
    time: "2–5 hrs",
    price: range(450, 1200),
  },
  {
    id: "radiator",
    group: "cooling",
    name: "Radiator",
    sentence: "Cracked, leaking or clogged; we replace it and refill the system.",
    time: "2–4 hrs",
    price: range(600, 1500),
  },
  // Air conditioning
  {
    id: "ac-check",
    group: "ac",
    name: "AC check and recharge, with leak test",
    sentence: "We find the leak before we refill. A recharge without a fix doesn't last.",
    time: "1–2 hrs",
    price: range(150, 350),
  },
  {
    id: "ac-compressor",
    group: "ac",
    name: "AC compressor",
    sentence: "The AC's pump. Replacing it means flushing and recharging the system too.",
    time: "3–6 hrs, often next day",
    price: range(900, 2500),
  },
  // Steering and suspension
  {
    id: "struts",
    group: "steering",
    name: "Front struts, pair, with alignment",
    sentence: "For clunks, a floaty ride or the nose dipping when you brake. Always done in pairs.",
    time: "2–4 hrs",
    price: range(500, 1200),
  },
  {
    id: "sway-links",
    group: "steering",
    name: "Sway bar links, pair",
    sentence: "The most common cause of a clunk over small bumps, and one of the cheapest fixes.",
    time: "About 1 hr",
    price: range(150, 350),
  },
  {
    id: "wheel-bearing",
    group: "steering",
    name: "Wheel bearing, one wheel",
    sentence: "For a hum that rises with speed. Only the bad side gets replaced.",
    time: "1–2 hrs",
    price: range(300, 700),
  },
  {
    id: "cv-axle",
    group: "steering",
    name: "CV axle, one side",
    sentence: "For a click in tight turns. Caught early, a new rubber boot alone can do it.",
    time: "1–2 hrs",
    price: range(300, 900),
  },
  // Tires and alignment
  {
    id: "tire",
    group: "tires",
    name: "One tire, mounted and balanced",
    sentence: "Includes a new valve stem and recycling the old tire.",
    time: "30–45 min",
    price: range(110, 260),
  },
  {
    id: "rotation",
    group: "tires",
    name: "Tire rotation",
    sentence: "Every 5,000–7,500 miles so the tires wear evenly.",
    time: "30–45 min",
    price: range(25, 75),
  },
  {
    id: "rotation-balance",
    group: "tires",
    name: "Rotation and balance",
    sentence: "Add balancing only if you feel a shake.",
    time: "30–45 min",
    price: range(80, 135),
  },
  {
    id: "alignment",
    group: "tires",
    name: "Four-wheel alignment",
    sentence: "Sets the wheel angles so the car drives straight and the tires wear evenly. We check the suspension first.",
    time: "About 1 hr",
    price: range(100, 275),
  },
  // Maintenance
  {
    id: "oil",
    group: "maintenance",
    name: "Oil and filter change",
    sentence: "The exact oil your manual calls for, on the schedule it sets. Many newer engines go 7,500 miles or more.",
    time: "30–60 min",
    price: range(35, 125),
  },
  {
    id: "filters",
    group: "maintenance",
    name: "Engine or cabin air filter",
    sentence: "We show you the old filter next to a new one and replace it only if it's dirty.",
    time: "10–20 min",
    price: range(35, 100),
    photo: "filters",
  },
  {
    id: "trans-fluid",
    group: "maintenance",
    name: "Transmission fluid service (drain and fill)",
    sentence: "On the carmaker's schedule. No flushes on a high-mileage transmission that's never been serviced.",
    time: "About 1 hr",
    price: range(150, 400),
  },
  // Used cars
  {
    id: "pre-purchase",
    group: "used",
    name: "Pre-purchase inspection",
    sentence:
      "A top-to-bottom check of a car you're thinking of buying, with photos and a written report you can use to negotiate or walk away.",
    time: "1–1.5 hrs",
    price: { kind: "flat", amount: PPI },
  },
];

export const SERVICE_BY_ID = Object.fromEntries(SERVICES.map((s) => [s.id, s])) as Record<ServiceId, Service>;

export function servicesIn(group: ServiceGroupId): Service[] {
  return SERVICES.filter((s) => s.group === group);
}

/** "$150–$350" · "Free" · "$129, credited if you go ahead" · "$139" */
export function priceText(service: Service): string {
  const p = service.price;
  if (p.kind === "free") return "Free";
  if (p.kind === "flat") return p.note ? `${money(p.amount, { range: true })}, ${p.note}` : money(p.amount, { range: true });
  return moneyRange(p.low, p.high);
}

/** The compact-car range of a ranged service. */
export function rangeOf(id: ServiceId): [number, number] {
  const p = SERVICE_BY_ID[id].price;
  if (p.kind !== "range") throw new Error(`${id} has no range`);
  return [p.low, p.high];
}

/** "Brake pads, one axle: $150–$350" */
export function costLine(id: ServiceId): string {
  const s = SERVICE_BY_ID[id];
  return `${s.name}: ${priceText(s)}`;
}

/* ---------------------------------------------------------------------------------------------
 * Service pages (/services/[slug]/)
 * ------------------------------------------------------------------------------------------- */

export interface ServicePage {
  slug: ServicePageSlug;
  /** Breadcrumb name: "Home / Services / Brakes". */
  name: string;
  h1: string;
  /** <title>, before the layout's " | Penner & Daughters (portfolio sample)". */
  metaTitle: string;
  intro: string;
  /** "What's included", three bullets. */
  included: readonly [string, string, string];
  /** "Signs it's time": symptom links. */
  symptoms: readonly SymptomId[];
  /** "Typical prices": price-list rows. */
  rows: readonly ServiceId[];
  group: ServiceGroupId;
}

const town = SHOP.town;

export const SERVICE_PAGES: readonly ServicePage[] = [
  {
    slug: "brakes",
    name: "Brakes",
    h1: `Brake repair in ${town}`,
    metaTitle: `Brake Repair in ${town}`,
    intro: "Squeal, grind or a pedal that feels wrong? We measure the pads and rotors, text you photos, and quote before we touch a thing.",
    included: [
      "Pads and rotors measured and photographed",
      "Hardware cleaned and lubricated",
      "Road test, with the brakes bedded in, before you get the keys",
    ],
    symptoms: ["squeal-braking", "grind-braking", "shake-stopping", "brake-light", "leak-brake"],
    rows: ["brake-pads", "pads-rotors", "brake-fluid"],
    group: "brakes",
  },
  {
    slug: "check-engine-light",
    name: "Check-engine light",
    h1: `Check-engine light diagnosis in ${town}`,
    metaTitle: `Check-Engine Light Diagnosis in ${town}`,
    intro: `${money(DIAG, { range: true })} covers the first hour of testing and comes off your bill if you go ahead within ${DIAG_CREDIT_DAYS} days. We call before testing further.`,
    included: [
      "Codes read and the cause tested before any part is replaced",
      "A written estimate with photos",
      "A call before any extra testing",
    ],
    symptoms: ["cel-steady", "cel-flashing", "smell-egg", "mileage", "knock"],
    rows: ["diagnosis", "o2-sensor", "misfire", "spark-plugs", "catalytic"],
    group: "engine",
  },
  {
    slug: "battery-and-starting",
    name: "Battery and starting",
    h1: `Battery, starter and alternator repair in ${town}`,
    metaTitle: `Battery, Starter and Alternator Repair in ${town}`,
    intro: "Won't start, or the battery light came on? We test the battery and the charging system before we sell you anything.",
    included: ["Free battery and charging test", "The right battery for your car, including AGM", "Your old battery recycled"],
    symptoms: ["nostart-clicks", "nostart-oneclick", "nostart-cranks", "battery-light"],
    rows: ["battery-test", "battery", "alternator", "starter"],
    group: "battery",
  },
  {
    slug: "cooling-and-overheating",
    name: "Cooling and overheating",
    h1: `Cooling system and overheating repair in ${town}`,
    metaTitle: `Cooling System and Overheating Repair in ${town}`,
    intro: "Temperature gauge climbing, steam, or a sweet-smelling puddle? We pressure-test the system to find the leak first.",
    included: ["Pressure test to find the leak", "The coolant type your engine needs", "Hoses, belt and fan checked"],
    symptoms: ["temp-red", "leak-coolant", "smell-sweet", "smoke-white"],
    rows: ["coolant", "thermostat", "water-pump", "radiator"],
    group: "cooling",
  },
  {
    slug: "air-conditioning",
    name: "Air conditioning",
    h1: `Car AC repair in ${town}`,
    metaTitle: `Car AC Repair in ${town}`,
    intro: "Blowing warm? We find the leak before we refill, so the cold lasts.",
    included: ["Pressure and leak test", "Refrigerant recharged to spec", "Cabin filter checked"],
    symptoms: ["ac-warm", "leak-ac", "squeal-startup"],
    rows: ["ac-check", "ac-compressor", "filters"],
    group: "ac",
  },
  {
    slug: "steering-and-suspension",
    name: "Steering and suspension",
    h1: `Steering and suspension repair in ${town}`,
    metaTitle: `Steering and Suspension Repair in ${town}`,
    intro: "Clunks, clicks, hums or a car that wanders. We find the worn part and show it to you.",
    included: [
      "A road test with you, if you like, to hear the noise",
      "Worn parts shown and measured",
      "Alignment checked after the work",
    ],
    symptoms: ["clunk-bumps", "click-turns", "hum-speed", "pulls", "shake-highway"],
    rows: ["struts", "sway-links", "wheel-bearing", "cv-axle"],
    group: "steering",
  },
  {
    slug: "tires-and-alignment",
    name: "Tires and alignment",
    h1: `Tires and alignment in ${town}`,
    metaTitle: `Tires and Alignment in ${town}`,
    intro: "Tread measured in 32nds of an inch, pressures set, and an honest word on whether you need tires yet.",
    included: [
      "Tread and sidewalls checked on all four",
      "Pressures set to the sticker in your door",
      `Old tires recycled (${money(TIRE_DISPOSAL, { range: true })} each)`,
    ],
    symptoms: ["tpms-steady", "tpms-flash", "shake-highway", "pulls"],
    rows: ["tire", "rotation", "rotation-balance", "alignment"],
    group: "tires",
  },
  {
    slug: "oil-and-maintenance",
    name: "Oil and maintenance",
    h1: `Oil changes and maintenance in ${town}`,
    metaTitle: `Oil Changes and Maintenance in ${town}`,
    intro: "Done by your owner's manual. We'll tell you what's due, what isn't, and why.",
    included: [
      "The oil grade your manual specifies",
      "Filters shown to you before we replace them",
      "A reminder text when the next service is due",
    ],
    symptoms: ["mileage", "leak-oil", "smoke-blue"],
    rows: ["oil", "filters", "trans-fluid", "brake-fluid", "coolant", "spark-plugs", "timing-belt"],
    group: "maintenance",
  },
];

export const SERVICE_PAGE_BY_SLUG = Object.fromEntries(SERVICE_PAGES.map((p) => [p.slug, p])) as Record<
  ServicePageSlug,
  ServicePage
>;

/* ---------------------------------------------------------------------------------------------
 * Price-list, estimate and booking copy that carries money. (Prices are printed from numbers.)
 * ------------------------------------------------------------------------------------------- */

const pct = (rate: number) => `${Math.round(rate * 100)}%`;
const diag = money(DIAG, { range: true });

export const PRICE_LIST_COPY = {
  diagnosisBox: `Check-engine light, or not sure what's wrong? ${diag} covers the first hour of testing. It comes off your bill if you go ahead within ${DIAG_CREDIT_DAYS} days, and we call before testing any further.`,
  vehicleCaption: "Typical range for this kind of car. You approve the exact price before we start.",
  servicePageNote: "Compact car prices. You approve the exact price before we start.",
  changesTitle: "What changes the price",
  changes: [
    "Your car: on some engines the part is buried behind others.",
    "The part: quality aftermarket or factory.",
    "Rust: seized bolts take longer, and we call before going over.",
  ],
  payment: "We take cards, debit, cash, checks, Apple Pay and Google Pay, or pay by text.",
  notDone: "Not something we do: bodywork and paint, glass, or transmission rebuilds. We'll diagnose it and point you to someone good.",
} as const;

export const ESTIMATE_COPY = {
  title: "Your estimate",
  draft: "Draft · prices include supplies and tax",
  empty: "Nothing here yet. Add a job from the price list, or approve a line in the inspection above.",
  labor: "Labor",
  supplies: `Shop supplies (${pct(SUPPLIES_RATE)} of labor)`,
  disposal: "Tire disposal",
  tax: `Tax on parts (${pct(PARTS_TAX)})`,
  lineTotal: "Line total",
  /** Range lines. */
  typical: (low: number, high: number) => `Typical ${moneyRange(low, high)} · exact price after we see the car`,
  gradeNote: `Both carry our ${WARRANTY.adjective}. Factory parts cost more; we'll tell you when they're worth it.`,
  approveLine: "Approve this line",
  remove: "Remove",
  total: "Total, with supplies and tax",
  estimatedTotal: "Estimated total",
  splitPay: `Over ${money(SPLIT_PAY_OVER, { range: true })}? Pay half at pickup and half within 30 days, no interest.`,
  bigBill:
    "Bigger bills can also go on a third-party car-care card. Its promo plans use deferred interest: if the balance isn't paid in full by the end of the promo, interest is charged back to the day you paid. We'll walk you through it before you sign.",
  diagCredit: `The ${diag} diagnosis comes off your bill if you go ahead within ${DIAG_CREDIT_DAYS} days.`,
  approvedStamp: "APPROVED BY YOU",
  yourCopy: "Your copy. Take it to any shop.",
  print: "Print or save as PDF",
  bookWith: "Book with this estimate",
  clear: "Clear",
} as const;

/** Booking step 1 chips. `service` is the row whose typical price the confirm step shows. */
export const BOOKING_CONCERNS: ReadonlyArray<{ id: string; label: string; service?: ServiceId }> = [
  { id: "brakes", label: "Brakes", service: "brake-pads" },
  { id: "check-engine", label: "Check-engine light", service: "diagnosis" },
  { id: "oil", label: "Oil and filter", service: "oil" },
  { id: "ac", label: "AC", service: "ac-check" },
  { id: "battery", label: "Battery or won't start", service: "battery-test" },
  { id: "tires", label: "Tires or alignment", service: "alignment" },
  { id: "other", label: "Something else" },
  { id: "diagnose", label: `Not sure: diagnose it (${diag}, credited if you go ahead)`, service: "diagnosis" },
  { id: "pre-purchase", label: `Used-car inspection (${money(PPI, { range: true })})`, service: "pre-purchase" },
  {
    id: "second-opinion",
    label: `Second opinion on another shop's estimate (free ${SECOND_OPINION_MINUTES}-minute look)`,
  },
];

export const BOOKING_COPY = {
  diagnosisReview: `Diagnosis: ${diag}, credited if you go ahead within ${DIAG_CREDIT_DAYS} days`,
  /** "Use my estimate ($434.38)" */
  useEstimate: (total: number) => `Use my estimate (${money(total)})`,
  secondOpinionBox: `Got an estimate from another shop? Bring it in. We'll look at the car and tell you what we'd do. It's a free ${SECOND_OPINION_MINUTES}-minute look.`,
} as const;
