// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * "How long will I be without my car?" (#your-day). One car's day, from the night drop to pickup.
 *
 * The server renders the stacked day sheet: a dusk band, the night (the night-drop band, the clock,
 * the lines), the dawn (the door-rise band), a band that goes from night to the counter, then the
 * seven steps as ruled rows with their texts and prints. That is the whole section on phones and
 * tablets (where only the night drop, the door rise and the pad gauge play), with reduced motion
 * and without JS (posters, static times).
 *
 * On the desktop full tier, DayUpgrade swaps the stacked sheet for the pinned film chapter
 * (components/day/night-film.tsx) once the page has loaded and gone idle.
 *
 * After it: Getting around while we work, and the Track my car card.
 *
 * The stacked sheet and the tracker are islands (components/islands.tsx): complete server HTML,
 * but no second copy in the RSC payload and no code in the first load.
 */
import { GettingAround } from "@/components/day/getting-around";
import { StackedDayIsland, TrackerIsland } from "@/components/islands";

export function YourDay() {
  return (
    <section id="your-day" aria-labelledby="your-day-title" className="relative">
      {/* Dusk: the counter darkens into the night. */}
      <div aria-hidden="true" className="h-[30vh] bg-[linear-gradient(180deg,var(--counter),var(--night))]" />
      <StackedDayIsland />
      <div className="counter-wrap grid gap-10 pb-[var(--section-pad)] pt-[clamp(48px,7vw,96px)] lg:grid-cols-12 lg:items-start">
        <GettingAround className="lg:col-span-7" />
        <TrackerIsland className="lg:col-span-5" />
      </div>
    </section>
  );
}
