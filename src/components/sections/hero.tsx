// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { preload } from "react-dom";
import { HeroPrint } from "@/components/hero/hero-print";
import { HeroSheet } from "@/components/hero/hero-sheet";
import { clipRendition } from "@/data/media";

/**
 * #top: the repair order and its film print.
 *
 * The LCP is the print's poster: the 4:5 AVIF on desktop, the 16:9 band AVIF on phones. React 19
 * hoists these two preloads into <head>, each limited to its own layout by a media query, so a
 * browser fetches exactly one of them, at high priority, before it has parsed the <picture>.
 *
 * Layout: desktop puts the sheet on columns 1–7 and clips the print over its right edge by 40px
 * (the print sits on top). Under 1024px the print becomes a band above the sheet and the sheet
 * lies over the band's bottom 36px (the sheet sits on top).
 */
export function Hero() {
  const desk = clipRendition("hero", "print").poster;
  const band = clipRendition("hero", "band").poster;
  preload(desk.avif, { as: "image", type: "image/avif", fetchPriority: "high", media: "(min-width: 1024px)" });
  preload(band.avif, { as: "image", type: "image/avif", fetchPriority: "high", media: "(max-width: 1023px)" });

  return (
    <section id="top" aria-labelledby="hero-title" className="pb-6 lg:pb-4">
      <div className="counter-wrap grid grid-cols-1 pt-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:pt-12">
        <HeroSheet className="relative z-[2] max-lg:-mt-9 lg:z-[1] lg:col-start-1 lg:row-start-1" />
        <HeroPrint className="relative z-[1] max-lg:order-first lg:z-[2] lg:col-start-2 lg:row-start-1 lg:-ml-10 lg:mt-16 lg:w-[min(520px,calc(100%+40px))] lg:self-start" />
      </div>
    </section>
  );
}
