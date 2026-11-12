"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { useEffect, useRef } from "react";
import { FilmClip } from "@/components/ui/film-clip";
import { Print } from "@/components/ui/print";
import { CLIPS, HERO_BAND_SIZES, HERO_PRINT_SIZES, clipLabel } from "@/data/media";
import { cx } from "@/lib/cx";
import { useTier } from "@/lib/tier";
import { afterLoadIdle } from "@/lib/use-media";

/** The print's caption: the spec's place and time, then what the clip is (from data/media.ts). */
export const HERO_CAPTION = `Bay 2, 7:31 AM · ${clipLabel(CLIPS.hero.source)}`;

/*
 * Scroll parallax (desktop full tier): over the hero's own height the sheet travels at 0.92 of the
 * scroll, the print at 1.06, and the pink carbon slides 6px further out from under the sheet.
 * Everything stays within 8%.
 */
const SHEET_LAG = 0.08;
const PRINT_LEAD = 0.06;
const PINK_DRIFT_PX = 6;

/**
 * The hero's film print: the bay at 7:31 AM, the silver sedan up on the lift. Desktop: a 4:5 print
 * clipped over the repair order's right edge, tilted 1.4°. Under 1024px: a 16:9 band across the
 * top at −0.8°, with the sheet lying over its bottom margin. One <FilmClip>: the poster is the
 * server HTML and the LCP (preloaded in sections/hero.tsx); the loop attaches after load + idle.
 */
export function HeroPrint({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const tier = useTier();

  useEffect(() => {
    if (tier !== "full") return;
    let disposed = false;
    let revert: (() => void) | undefined;
    const cancel = afterLoadIdle(() => {
      void import("@/lib/gsap").then(({ gsap }) => {
        const print = ref.current;
        const hero = print?.closest<HTMLElement>("#top");
        const sheet = hero?.querySelector<HTMLElement>("[data-hero-sheet]");
        const pink = sheet?.querySelector<HTMLElement>('.sheet-carbon[data-copy="pink"]');
        if (disposed || !print || !hero || !sheet) return;
        const ctx = gsap.context(() => {
          const scrollTrigger = { trigger: hero, start: "top top", end: "bottom top", scrub: true, invalidateOnRefresh: true };
          gsap.to(sheet, { y: () => hero.offsetHeight * SHEET_LAG, ease: "none", scrollTrigger });
          gsap.to(print, { y: () => -hero.offsetHeight * PRINT_LEAD, ease: "none", scrollTrigger: { ...scrollTrigger } });
          if (pink) gsap.to(pink, { y: `+=${PINK_DRIFT_PX}`, x: `+=${PINK_DRIFT_PX / 2}`, ease: "none", scrollTrigger: { ...scrollTrigger } });
        }, hero);
        revert = () => ctx.revert();
      });
    });
    return () => {
      disposed = true;
      cancel();
      revert?.();
    };
  }, [tier]);

  // On a narrow band the caption wraps after the "·", never inside the label ("demo footage, AI-generated").
  const [when, what] = HERO_CAPTION.split(" · ");
  return (
    <div ref={ref} data-hero-print className={className}>
      <Print
        caption={
          <span className="flex flex-wrap gap-x-[0.6ch]">
            <span className="whitespace-nowrap">{`${when} · `}</span>
            <span className="whitespace-nowrap">{what}</span>
          </span>
        }
        // The tilt differs by layout, so it rides on the `rotate` property instead of Print's own --tilt.
        tilt={0}
        className={cx("-rotate-[0.8deg] max-lg:pb-9 lg:rotate-[1.4deg]")}
      >
        {/* Pause / Play sits bottom-left: the burned-in "HVNF Studios · portfolio sample" mark owns the bottom-right.
            Under 1024px the band is a shorter 3:1 crop anchored to the bottom (the mark and the car stay whole,
            only brick above the door goes), so the buttons and the quick picks reach the first screen. */}
        <FilmClip
          id="hero"
          variant="print"
          phoneVariant="band"
          sizes={HERO_PRINT_SIZES}
          phoneSizes={HERO_BAND_SIZES}
          priority
          className="max-lg:aspect-[3/1] max-lg:[&>picture>img]:object-bottom max-lg:[&>video]:object-bottom [&_.film-toggle]:right-auto [&_.film-toggle]:left-[10px]"
        />
      </Print>
    </div>
  );
}
