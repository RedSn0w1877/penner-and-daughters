// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The symptom guide: 35 things a driver notices, each with a verdict (how soon), what it
 * usually is, what it usually costs and what waiting does. Costs are printed from the price
 * list (data/services.ts), so a price changes in one place.
 *
 * Verdicts are rubber stamps: shape + word + color, never color alone.
 */
import type { SoundId } from "@/lib/audio/sounds";
import { SHOP } from "@/lib/facts";
import { DIAG, money } from "@/lib/pricing";
import { costLine, priceText, SERVICE_BY_ID } from "./services";

export {
  HERO_PHRASES,
  VERDICTS,
  ZONES,
  type Ellipse,
  type SymptomId,
  type TabId,
  type Verdict,
  type ZoneId,
} from "./symptom-basics";
import type { SymptomId, TabId, Verdict, ZoneId } from "./symptom-basics";

/* ---------------------------------------------------------------------------------------------
 * Tabs and groups
 * ------------------------------------------------------------------------------------------- */

export interface SymptomGroup {
  id: string;
  /** Group name for the server-rendered guide (none for the noise and light tabs). */
  label?: string;
  /** Panel heading in the interactive leak tab. */
  question?: string;
  symptoms: readonly SymptomId[];
}

export interface TabDef {
  id: TabId;
  label: string;
  intro?: string;
  groups: readonly SymptomGroup[];
}

export const TABS: readonly TabDef[] = [
  {
    id: "noise",
    label: "A noise",
    intro: "Tap a sound to hear it. Pick the one that matches.",
    groups: [
      {
        id: "noise",
        symptoms: ["squeal-braking", "grind-braking", "click-turns", "hum-speed", "clunk-bumps", "squeal-startup"],
      },
    ],
  },
  {
    id: "light",
    label: "A light on the dash",
    intro: "Tap the light you're seeing.",
    groups: [
      {
        id: "light",
        symptoms: [
          "cel-steady",
          "cel-flashing",
          "oil-light",
          "battery-light",
          "temp-red",
          "brake-light",
          "tpms-steady",
          "tpms-flash",
        ],
      },
    ],
  },
  {
    id: "leak",
    label: "A leak or smell",
    groups: [
      {
        id: "puddle",
        label: "Puddle color",
        question: "What color is the puddle?",
        symptoms: ["leak-coolant", "leak-red", "leak-oil", "leak-brake", "leak-ac"],
      },
      { id: "smell", label: "Smell", question: "What does it smell like?", symptoms: ["smell-egg", "smell-sweet", "smell-burnt"] },
      {
        id: "smoke",
        label: "Smoke from the tailpipe",
        question: "Smoke from the tailpipe?",
        symptoms: ["smoke-vapor", "smoke-white", "smoke-blue", "smoke-black"],
      },
    ],
  },
  {
    id: "other",
    label: "Something else",
    groups: [
      { id: "wont-start", label: "Won't start", symptoms: ["nostart-clicks", "nostart-oneclick", "nostart-cranks"] },
      { id: "feels-wrong", label: "Feels wrong", symptoms: ["shake-highway", "pulls", "shake-stopping", "knock"] },
      { id: "comfort", label: "Comfort and fuel", symptoms: ["ac-warm", "mileage"] },
    ],
  },
];

/* ---------------------------------------------------------------------------------------------
 * The dash cluster: six ISO-style lights. Two have a steady/flashing toggle.
 * ------------------------------------------------------------------------------------------- */

export type DashLightId = "cel" | "oil" | "battery" | "temp" | "brake" | "tpms";

export interface DashLight {
  id: DashLightId;
  /** Accessible name. */
  name: string;
  /** The real color of the lamp. */
  color: "amber" | "red";
  steady: SymptomId;
  flashing?: SymptomId;
  toggle?: { steady: string; flashing: string };
}

export const DASH_LIGHTS: readonly DashLight[] = [
  {
    id: "cel",
    name: "Check-engine light",
    color: "amber",
    steady: "cel-steady",
    flashing: "cel-flashing",
    toggle: { steady: "Steady", flashing: "Flashing" },
  },
  { id: "oil", name: "Oil pressure light", color: "red", steady: "oil-light" },
  { id: "battery", name: "Battery light", color: "red", steady: "battery-light" },
  { id: "temp", name: "Engine temperature light", color: "red", steady: "temp-red" },
  { id: "brake", name: "Brake light", color: "red", steady: "brake-light" },
  {
    id: "tpms",
    name: "Tire-pressure light",
    color: "amber",
    steady: "tpms-steady",
    flashing: "tpms-flash",
    toggle: { steady: "Steady", flashing: "Flashes, then stays on" },
  },
];

/* ---------------------------------------------------------------------------------------------
 * The 35 entries
 * ------------------------------------------------------------------------------------------- */

export interface Symptom {
  id: SymptomId;
  tab: TabId;
  group: string;
  label: string;
  verdict: Verdict;
  /** "Most likely" */
  likely: string;
  /** "Also possible" */
  also?: string;
  /** "Usually costs" */
  costs: string;
  /** "If you wait" */
  ifWait: string;
  /** "Where we'd look first" */
  zone: ZoneId;
  sound?: SoundId;
  /** The noise helpers: drag the steering wheel, set the speed, hit the bump. */
  interactive?: "wheel" | "speed" | "bump";
  light?: { id: DashLightId; mode?: "steady" | "flashing" };
  /** Puddle colors (hex). */
  swatch?: readonly string[];
  /** Links to "See a … inspection" (#inspection-item-n). */
  inspection?: 1 | 2 | 3 | 4;
  /** Prefilled text message body. */
  smsBody: string;
  /** What the booking flow carries in. */
  bookingConcern: string;
}

const diag = money(DIAG, { range: true });
const rangeText = (id: Parameters<typeof costLine>[0]) => priceText(SERVICE_BY_ID[id]);
const QUOTE_FIRST = "Depends on the cause. We'll quote before any work.";

type Entry = Omit<Symptom, "tab" | "group" | "smsBody" | "bookingConcern">;

const ENTRIES: readonly Entry[] = [
  // A noise
  {
    id: "squeal-braking",
    label: "Squeal when braking",
    verdict: "within-2-weeks",
    likely: "The pads' built-in wear tab is touching the rotor. It's a warning: the pads are nearly worn out.",
    also: "A short squeak on damp mornings that fades after a few stops is surface rust. That's normal.",
    costs: costLine("brake-pads"),
    ifWait: `Past the squeal comes the grind, and a pads job becomes pads and rotors (${rangeText("pads-rotors")}).`,
    zone: "front-wheel",
    sound: "squeal",
    inspection: 1,
  },
  {
    id: "grind-braking",
    label: "Grinding when braking",
    verdict: "today",
    likely: "The pads are worn through to metal and scoring the rotors. Now and then it's a stone caught in the brake.",
    costs: costLine("pads-rotors"),
    ifWait: "Every mile adds damage, and calipers can be next. Limit driving.",
    zone: "front-wheel",
    sound: "grind",
    inspection: 1,
  },
  {
    id: "click-turns",
    label: "Clicking in tight turns",
    verdict: "within-2-weeks",
    likely:
      "A worn outer CV joint (the flexible joint at the end of a front axle), usually after its rubber boot tore. Look for grease splattered inside the wheel.",
    costs: costLine("cv-axle"),
    ifWait: "An axle that lets go can leave you stranded. Caught early, a new boot alone can be enough.",
    zone: "front-wheel",
    sound: "click",
    interactive: "wheel",
  },
  {
    id: "hum-speed",
    label: "Hum that gets louder with speed",
    verdict: "this-week",
    likely: "A worn wheel bearing. The sound often changes when you swerve gently left or right.",
    also: "Tires with uneven, scalloped wear can hum too.",
    costs: costLine("wheel-bearing"),
    ifWait: "A badly worn bearing is a safety risk.",
    zone: "any-wheel",
    sound: "hum",
    interactive: "speed",
  },
  {
    id: "clunk-bumps",
    label: "Clunk over bumps",
    verdict: "within-2-weeks",
    likely: "Worn sway bar links: the most common cause, and one of the cheapest fixes.",
    also: "Strut mounts, ball joints or tie-rod ends.",
    costs: costLine("sway-links"),
    ifWait: "Come in today if the steering feels loose or the car wanders.",
    zone: "under-front",
    sound: "clunk",
    interactive: "bump",
  },
  {
    id: "squeal-startup",
    label: "Squeal at startup or when the AC kicks on",
    verdict: "within-2-weeks",
    likely:
      "A slipping, worn or oil-soaked serpentine belt (the long rubber belt that drives the alternator, AC and water pump), or a weak belt tensioner.",
    costs: costLine("serpentine"),
    ifWait: "If the belt snaps you lose battery charging and power steering, and often engine cooling.",
    zone: "engine",
    sound: "chirp",
    inspection: 3,
  },
  // A light on the dash
  {
    id: "cel-steady",
    label: "Check-engine light, steady",
    verdict: "this-week",
    likely: "Often an oxygen sensor, an ignition coil or spark plugs. Sometimes it's just a loose gas cap.",
    costs: `Diagnosis: ${diag} for the first hour, credited if you go ahead`,
    ifWait: "Usually fine to drive if the car runs normally. A failing sensor can quietly cost you fuel.",
    zone: "engine",
    light: { id: "cel", mode: "steady" },
  },
  {
    id: "cel-flashing",
    label: "Check-engine light, flashing",
    verdict: "stop-driving",
    likely: "A severe misfire is sending unburned fuel into the exhaust and overheating the catalytic converter.",
    costs: costLine("misfire"),
    ifWait: `Driving on it can turn a coil repair into a catalytic converter (${rangeText("catalytic")}).`,
    zone: "engine",
    light: { id: "cel", mode: "flashing" },
  },
  {
    id: "oil-light",
    label: "Red oil-can light",
    verdict: "stop-driving",
    likely: "The oil level is very low, or the engine has lost oil pressure.",
    costs: `Depends on the cause. Diagnosis: ${diag}`,
    ifWait:
      "Shut the engine off at the first safe spot and check the dipstick. If the light stays on after topping up, don't drive it.",
    zone: "engine",
    light: { id: "oil" },
  },
  {
    id: "battery-light",
    label: "Battery light while driving, or dimming lights",
    verdict: "today",
    likely: "The alternator isn't charging, or the drive belt is slipping or broken.",
    costs: `${costLine("alternator")} · ${costLine("serpentine")}`,
    ifWait:
      "The car runs until the battery drains, then stops. Drive straight to us or somewhere safe with the AC and extras off.",
    zone: "engine",
    light: { id: "battery" },
  },
  {
    id: "temp-red",
    label: "Temperature gauge in the red, or steam",
    verdict: "stop-driving",
    likely: "Low coolant from a leak, a stuck thermostat, a failing water pump or fan, or a snapped belt.",
    costs: `${costLine("thermostat")} · ${costLine("water-pump")}`,
    ifWait:
      "Pull over and shut the engine off. Never open a hot radiator cap; wait at least 30 minutes. Stuck in traffic? AC off, heater on full until you can stop.",
    zone: "engine",
    light: { id: "temp" },
  },
  {
    id: "brake-light",
    label: "Red BRAKE light, or a soft, sinking pedal",
    verdict: "stop-driving",
    likely:
      "Air or moisture in the brake fluid, a fluid leak, or a failing master cylinder (the part that pushes fluid to the brakes). First check that the parking brake is fully off.",
    costs: QUOTE_FIRST,
    ifWait: "Don't drive it. If it isn't safe to move, we'll help you arrange a tow.",
    zone: "all-wheels",
    light: { id: "brake" },
  },
  {
    id: "tpms-steady",
    label: "Tire-pressure light, steady",
    verdict: "today",
    likely: "At least one tire is about 25% low. Cold snaps often set it off.",
    costs: "Air is free. A flat repair or a new tire if one is damaged.",
    ifWait: "Check and inflate all four tires today. The right pressure is on the sticker inside the driver's door.",
    zone: "all-wheels",
    light: { id: "tpms", mode: "steady" },
  },
  {
    id: "tpms-flash",
    label: "Tire-pressure light flashes, then stays on",
    verdict: "when-convenient",
    likely: "A fault in a tire-pressure sensor or in the system itself. Your tires may be fine.",
    costs: "Sensor check during any visit",
    ifWait: "Check your tire pressures by hand until it's fixed.",
    zone: "all-wheels",
    light: { id: "tpms", mode: "flashing" },
  },
  // A leak or smell
  {
    id: "leak-coolant",
    label: "Green, orange, pink or yellow puddle",
    verdict: "this-week",
    likely: "Coolant, from a hose, the radiator or the water pump.",
    costs: `Finding the leak: ${diag} diagnosis, credited if you go ahead. Water pump, if that's it: ${rangeText("water-pump")}`,
    ifWait: "Watch the temperature gauge. Top up only when the engine is cold.",
    zone: "under-front",
    swatch: ["#5DBB63", "#F08A3C", "#E98FB2", "#E8D04A"],
  },
  {
    id: "leak-red",
    label: "Red or reddish-brown puddle",
    verdict: "this-week",
    likely: "Transmission or power-steering fluid. Some coolants are red too.",
    costs: `Finding the leak: ${diag} diagnosis`,
    ifWait: "Low fluid makes a transmission overheat. Limit driving until we've looked.",
    zone: "under-middle",
    swatch: ["#9E2A22"],
  },
  {
    id: "leak-oil",
    label: "Amber, brown or black puddle",
    verdict: "within-2-weeks",
    likely: "Engine oil, often from a worn gasket or seal.",
    costs: `Finding the leak: ${diag} diagnosis`,
    ifWait: "Check the dipstick and keep the oil topped up until then.",
    zone: "under-front",
    swatch: ["#5A3A1A"],
  },
  {
    id: "leak-brake",
    label: "Clear-to-yellow, oily fluid near a wheel",
    verdict: "stop-driving",
    likely: "A brake fluid leak.",
    costs: QUOTE_FIRST,
    ifWait: "Don't drive it. Call and we'll help you arrange a tow.",
    zone: "any-wheel",
    swatch: ["#E8D9A0"],
  },
  {
    id: "leak-ac",
    label: "Clear water under the front passenger side",
    verdict: "normal",
    likely: "Condensation from the air conditioning.",
    costs: "Nothing to fix",
    ifWait: "Nothing to do. It drips more on hot, humid days.",
    zone: "passenger-floor",
    swatch: ["#CFE3EA"],
  },
  {
    id: "smell-egg",
    label: "Rotten-egg smell",
    verdict: "within-2-weeks",
    likely: "An overworked catalytic converter, often because the engine is burning too much fuel.",
    costs: `Diagnosis: ${diag}`,
    ifWait: `Fixing the cause early can save the converter (${rangeText("catalytic")}).`,
    zone: "under-middle",
  },
  {
    id: "smell-sweet",
    label: "Sweet smell inside, foggy windows",
    verdict: "this-week",
    likely: "Coolant, possibly from the heater core behind the dash.",
    costs: `Diagnosis: ${diag}`,
    ifWait: "Watch the temperature gauge, and crack a window.",
    zone: "dash",
  },
  {
    id: "smell-burnt",
    label: "Burnt smell, with slipping or hard shifts",
    verdict: "this-week",
    likely: "Low or burnt transmission fluid, worn clutches inside, or a solenoid problem.",
    costs: `Transmission fluid service, if that's all it is: ${rangeText("trans-fluid")}`,
    ifWait: "Limit driving. We won't sell a flush on a transmission that's never been serviced.",
    zone: "under-middle",
  },
  {
    id: "smoke-vapor",
    label: "Thin white vapor on a cold start",
    verdict: "normal",
    likely: "Condensation burning off. It's gone once the engine warms up.",
    costs: "Nothing to fix",
    ifWait: "Nothing to do.",
    zone: "tailpipe",
  },
  {
    id: "smoke-white",
    label: "Thick white smoke with a sweet smell",
    verdict: "stop-driving",
    likely: "Coolant is burning, possibly a head gasket.",
    costs: QUOTE_FIRST,
    ifWait: "Pull over, shut it off and call.",
    zone: "tailpipe",
  },
  {
    id: "smoke-blue",
    label: "Blue-grey smoke",
    verdict: "within-2-weeks",
    likely: "The engine is burning oil.",
    costs: `Diagnosis: ${diag}`,
    ifWait: "Check the oil level often until we've seen it.",
    zone: "tailpipe",
  },
  {
    id: "smoke-black",
    label: "Black smoke",
    verdict: "within-2-weeks",
    likely: "Too much fuel, often a sensor or fuel-system fault.",
    costs: `Diagnosis: ${diag}`,
    ifWait: "It wastes fuel and can damage the catalytic converter over time.",
    zone: "tailpipe",
  },
  // Something else
  {
    id: "nostart-clicks",
    label: "Won't start: rapid clicking",
    verdict: "today",
    likely: "A weak or dead battery, or loose, corroded terminals.",
    costs: `Battery test: free · New battery: ${rangeText("battery")} installed`,
    ifWait: "Call us. A jump or a battery test usually sorts it the same day. Batteries over 3 years old are the usual suspects.",
    zone: "engine",
    inspection: 4,
  },
  {
    id: "nostart-oneclick",
    label: "Won't start: one click or nothing, lights work",
    verdict: "today",
    likely: "The starter motor, its relay or a bad connection.",
    costs: costLine("starter"),
    ifWait: "Call. We'll help you decide between a jump and a tow.",
    zone: "engine",
  },
  {
    id: "nostart-cranks",
    label: "Cranks normally but won't start",
    verdict: "today",
    likely: "Fuel supply (such as the fuel pump), ignition, or a sensor or wiring fault. Or an empty tank.",
    costs: `Diagnosis: ${diag}`,
    ifWait: "Usually needs a tow. Call and we'll help arrange it.",
    zone: "engine",
  },
  {
    id: "shake-highway",
    label: "Shakes at highway speed (55–70 mph)",
    verdict: "this-week",
    likely: "A tire out of balance or a lost wheel weight, a bent wheel, a damaged tire, or a worn CV axle.",
    costs: costLine("rotation-balance"),
    ifWait: "Come in today if you can see a bulge on a tire.",
    zone: "all-wheels",
    inspection: 2,
  },
  {
    id: "pulls",
    label: "Pulls to one side",
    verdict: "within-2-weeks",
    likely:
      "Uneven tire pressure first. Then alignment, a worn tire or worn suspension. If it only pulls when braking: a sticking caliper.",
    costs: costLine("alignment"),
    ifWait: "Check tire pressures today. Come in sooner if it pulls hard when braking.",
    zone: "all-wheels",
  },
  {
    id: "shake-stopping",
    label: "Steering wheel or pedal shakes when you stop",
    verdict: "this-week",
    likely: "Uneven (‘warped’) rotors, or pad material built up on them.",
    costs: costLine("pads-rotors"),
    ifWait: "It can take longer to stop.",
    zone: "front-wheel",
    inspection: 1,
  },
  {
    id: "knock",
    label: "Engine knocking or pinging",
    verdict: "this-week",
    likely: "Fuel with a lower octane than the car needs, low oil, or worn engine parts.",
    costs: `Diagnosis: ${diag}`,
    ifWait: "Check the oil today. Stop driving if the knock is loud and rhythmic or the oil light comes on.",
    zone: "engine",
  },
  {
    id: "ac-warm",
    label: "AC blowing warm",
    verdict: "when-convenient",
    likely:
      "Low refrigerant from a leak, most often. Sometimes the compressor, a dirty condenser, a fuse or relay, or a clogged cabin filter.",
    costs: costLine("ac-check"),
    ifWait: "Come in sooner in a heat wave, or with kids, older passengers or pets aboard.",
    zone: "engine",
  },
  {
    id: "mileage",
    label: "Gas mileage suddenly worse",
    verdict: "when-convenient",
    likely: "Low tire pressure, overdue filters or spark plugs, or a failing oxygen sensor.",
    costs: costLine("o2-sensor"),
    ifWait: "Check tire pressures first. A bad oxygen sensor can cut mileage a lot.",
    zone: "engine",
  },
];

/** "Squeal when braking" → "squeal when braking"; acronyms ("AC") keep their capitals. */
function lowerFirst(label: string): string {
  const first = label.split(/[\s:,]/)[0];
  if (first.length > 1 && first === first.toUpperCase()) return label;
  return label.charAt(0).toLowerCase() + label.slice(1);
}

const placement = new Map<SymptomId, { tab: TabId; group: string }>();
for (const tab of TABS) for (const g of tab.groups) for (const id of g.symptoms) placement.set(id, { tab: tab.id, group: g.id });

export const SYMPTOMS: readonly Symptom[] = ENTRIES.map((e) => ({
  ...e,
  tab: placement.get(e.id)!.tab,
  group: placement.get(e.id)!.group,
  smsBody: `Hi ${SHOP.shortName}, my car: ${lowerFirst(e.label)}.`,
  bookingConcern: e.label,
}));

export const SYMPTOM_BY_ID = Object.fromEntries(SYMPTOMS.map((s) => [s.id, s])) as Record<SymptomId, Symptom>;

/* ---------------------------------------------------------------------------------------------
 * Hero phrases, safety lists and inspection links
 * ------------------------------------------------------------------------------------------- */

/** "Pull over and call if you see:" Each item opens its symptom. */
export const PULL_OVER: ReadonlyArray<{ label: string; symptom: SymptomId }> = [
  { label: "The check-engine light flashing", symptom: "cel-flashing" },
  { label: "The temperature gauge in the red, or steam", symptom: "temp-red" },
  { label: "The red oil-can light", symptom: "oil-light" },
  { label: "A soft or sinking brake pedal, or the red BRAKE light", symptom: "brake-light" },
  { label: "Oily, clear-to-yellow fluid near a wheel", symptom: "leak-brake" },
  { label: "Thick white smoke that smells sweet", symptom: "smoke-white" },
];

/** "Usually nothing to fix:" */
export const USUALLY_NORMAL: ReadonlyArray<{ label: string; symptom: SymptomId }> = [
  { label: "A brief brake squeak on damp mornings that fades after a few stops", symptom: "squeal-braking" },
  { label: "Clear water dripping under the front passenger side (that's the AC)", symptom: "leak-ac" },
  { label: "Thin white vapor from the tailpipe on a cold start", symptom: "smoke-vapor" },
];

export const INSPECTION_LINKS: Record<1 | 2 | 3 | 4, { label: string; href: string }> = {
  1: { label: "See a brake inspection", href: "#inspection-item-1" },
  2: { label: "See a tire inspection", href: "#inspection-item-2" },
  3: { label: "See a belt inspection", href: "#inspection-item-3" },
  4: { label: "See a battery inspection", href: "#inspection-item-4" },
};
