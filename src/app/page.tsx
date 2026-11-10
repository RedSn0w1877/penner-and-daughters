// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { Booking } from "@/components/sections/booking";
import { Estimate } from "@/components/sections/estimate";
import { FindUs } from "@/components/sections/find-us";
import { Hero } from "@/components/sections/hero";
import { Inspection } from "@/components/sections/inspection";
import { Triage } from "@/components/sections/triage";
import { Warranty } from "@/components/sections/warranty";
import { YourDay } from "@/components/sections/your-day";

/**
 * The front counter, top to bottom: #top → #whats-wrong → #inspection → #prices → #your-day →
 * #warranty → #find-us → #book. Each section component renders its own root element with its id.
 *
 * No Suspense boundaries here: React streams a large boundary out of line (hidden until an inline
 * script reveals it), which would blank those sections without JS. Hydration is kept short
 * instead by islands (components/islands.tsx): the biggest sections never hydrate on first load.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Triage />
      <Inspection />
      <Estimate />
      <YourDay />
      <Warranty />
      <FindUs />
      <Booking />
    </>
  );
}
