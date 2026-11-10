// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Shared words: the paper-slip toasts, navigation, sheet imprints and the labels more than one
 * section prints. Section-specific copy lives with its section; anything with a phone number,
 * the address or the hours comes from lib/facts.ts, anything with a price from lib/pricing.ts.
 */
import { SHOP } from "@/lib/facts";

/** Paper-slip toasts (sonner). Show them with notify() from components/providers/lazy-toaster. */
export const TOASTS = {
  /** "Added to your estimate: Front brake pads, $221.86." / "Added to your estimate: Front brake pads." */
  added: (name: string, price?: string) =>
    price ? `Added to your estimate: ${name}, ${price}.` : `Added to your estimate: ${name}.`,
  removed: (name: string) => `Removed ${name}.`,
  remindLater: "Noted. We'll text you a reminder in 3 months (demo).",
  tireNotToday: "Your call. This one we'd fix today: a sidewall bulge can fail at highway speed.",
  directions: "Fictional address. On a real shop's site this opens your maps app.",
  addressCopied: "Address copied.",
  textUpdates: "You'd get a text at each step. Demo only: nothing was sent.",
} as const;

export interface NavItem {
  label: string;
  /** In-page target on the home page ("#prices"), or a route ("/track/"). */
  hash?: `#${string}`;
  href?: string;
}

/** Header and menu navigation, in page order. */
export const NAV: readonly NavItem[] = [
  { label: "What's wrong?", hash: "#whats-wrong" },
  { label: "Prices", hash: "#prices" },
  { label: "Your car's day", hash: "#your-day" },
  { label: "Warranty", hash: "#warranty" },
  { label: "Find us", hash: "#find-us" },
  { label: "Track my car", href: "/track/" },
];

/** Section ids, in page order. */
export const SECTION_IDS = {
  hero: "top",
  triage: "whats-wrong",
  inspection: "inspection",
  prices: "prices",
  day: "your-day",
  warranty: "warranty",
  findUs: "find-us",
  book: "book",
} as const;

/** Left side of each sheet's foot imprint (the right side is COPY.imprint from lib/facts). */
export const IMPRINTS = {
  hero: `Repair order ${SHOP.exampleCar.ro}`,
  concern: "Concern sheet",
  inspection: "Inspection · example",
  prices: "Price list",
  estimate: "Your estimate",
  day: "Day sheet",
  warranty: "Warranty card",
  location: "Location sheet",
  book: "Appointment book",
  returnTag: "Return tag",
  terms: "Terms of use",
  privacy: "Privacy",
} as const;

export const LABELS = {
  call: "Call",
  book: "Book",
  bookATime: "Book a time",
  directions: "Directions",
  textUs: "Text us",
  orTextUs: "or text us",
  menu: "Menu",
  close: "Close",
  pauseVideo: "Pause video",
  playVideo: "Play video",
  skipToMain: "Skip to main content",
  skipToBooking: "Skip to booking",
  backToTop: "Back to top",
  stop: "Stop",
  hearIt: "Hear it",
  nothingToHear: "Nothing to hear yet.",
  approve: "Approve",
  notToday: "Not today",
  nothingToDo: "Nothing to do",
  add: "Add",
  next: "Next",
  back: "Back",
  previous: "Previous",
  services: "Services",
  terms: "Terms",
  privacy: "Privacy",
  trackMyCar: "Track my car",
} as const;

/** "Book · $434.38" on the header and tear-off Book buttons once the estimate has lines. */
export const bookWithTotal = (total: string) => `Book · ${total}`;
