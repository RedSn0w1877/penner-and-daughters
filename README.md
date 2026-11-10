# PENNER & DAUGHTERS AUTO REPAIR — Showcase

> © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute. See [LICENSE](LICENSE).

Showcase piece #4: a website for a fictional family-run repair shop that shows its paperwork instead of saying "honest". Kroma Labs is industrial, Apex Dynamics is kinetic and Aetheria is editorial; this one is a working front counter, built for the kind of local service business HVNF actually rebuilds. The whole page is the stack of documents a good shop hands you, laid on a steel service counter, and every document works before anyone calls. The repair order answers "who and where" in three seconds. The concern sheet tells you how soon to come in, what it usually is and what it usually costs (with synthesized car noises and a dash cluster). The photo inspection explodes four Blender-modelled parts into live service-manual diagrams. The price list builds an itemized estimate you approve line by line. A night-to-pickup film shows your car's day, and the appointment book takes a booking without a server. One color rule runs through every pixel: red, amber and green describe the car; ballpoint blue is you. This is the full-stack showcase: WebGL (three + react-three-fiber + drei), GSAP pins and scrubs, Lenis, motion, Web Audio, sonner, canvas-confetti, border-beam and liquid-gooey, all on a Next.js static export.

## Run it

```bash
npm install
npm run dev -- -p 3004
```

Open http://localhost:3004. In production the site is exported to `out/` and served from GitHub Pages under `/penner-and-daughters/` (`.github/workflows/deploy-pages.yml`).

QA tip: add `?tier=full`, `?tier=touch` or `?tier=lite` to force an experience tier for one page load.

## How it fits together

| Piece | Where | What it does |
| --- | --- | --- |
| Shop facts | `src/lib/facts.ts` | The only home of the name, address, phone numbers, hours, holidays, people and warranty wording; every printed form of the hours is built from the same data |
| Money | `src/lib/pricing.ts` | Labor rate, supplies, tax and disposal rules; `lineMath()` itemizes a job in integer cents with half-up rounding (pads $221.86, tire $212.52, belt $137.56, factory pads $251.22); vehicle-class ranges round to $5 |
| Open now and the appointment book | `src/lib/hours.ts`, `src/lib/slots.ts` | Shop-time status (America/Chicago, DST and holidays included) and a seeded, stable slot grid (FNV-1a + mulberry32) that drives "Next opening" and the booking flow |
| Experience tiers | `src/lib/tier.ts` | `full` (desktop: Lenis, pins, the one WebGL canvas), `touch` (phones and tablets: frame sequences, IntersectionObserver motion) and `lite` (reduced motion, Save-Data, slow networks: posters and final states), decided once, hydration-safe |
| Shared state | `src/lib/stores.ts` | Estimate, symptom and booking stores on `useSyncExternalStore`, in memory only |
| Motion plumbing | `src/lib/gsap.ts`, `src/components/providers/*` | One GSAP registration that sleeps 2 s after the last input (zero frames at rest, ScrollTrigger's keep-alive loop included); Lenis on the full tier only; SLIP for every sheet; lazily loaded paper-slip toasts |
| Paper kit | `src/components/ui/*` | Sheet (carbon copies, pantograph, perforated foot), Stamp, Print, FilmClip, Odometer, PenTick, PaperTabs, Money, LineCar, the Call / Book / text buttons |
| Film clips | `src/components/ui/film-clip.tsx`, `src/data/media.ts` | Poster first (the no-JS view and the LCP), video attached after load + idle on the tiers that play it, paused off-screen and in hidden tabs, one at a time on phones |
| Guide and price data | `src/data/symptoms.ts`, `src/data/services.ts`, `src/data/copy.ts` | 35 symptoms with verdicts and zones, the 32-row price list and 8 service pages, toasts and shared labels |
| Car noises | `src/lib/audio/*` | Six Web Audio recipes (squeal, grind, click, hum, clunk, chirp), tap-only, gain capped at 0.2, always captioned |
| Chrome | `src/components/chrome/*`, `src/components/sections/site-header.tsx`, `site-footer.tsx` | Notice line, sticky header with open-now status, phone tear-off bar, menu sheet, footer with Terms and Privacy |
| Sections | `src/components/sections/*` and their folders | Repair order, concern sheet, photo inspection, price list and estimate, the car's day, warranty card, location sheet, appointment book |
| 3D and media | `src/components/three/*`, `public/models`, `public/media`, `public/frames` | Draco GLBs exploded from Blender node extras with ink outlines; Blender-rendered stills, clips and pre-rendered frame sequences |
| Copyright marks | `src/lib/copyright.ts`, `src/components/brand/*` | Notice line, sheet imprints, pantograph, burned-in media marks, footer © line and the header on every source file |

## Note on the fiction

Penner & Daughters Auto Repair, Halden Crossing and every fact on the site are made up for this sample: the shop, the people, the address, the hours, the prices and the warranty. The (555) numbers can't be dialed, there's no state, ZIP or map coordinate anywhere, and the booking flow sends nothing. There are no reviews, ratings, testimonials, certifications, awards or partner logos, on purpose. Every photo and clip is a 3D render made in Blender (one fictional shop, no people) and carries a burned-in "HVNF Studios · portfolio sample" mark; none of it shows a real place.
