"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useTier } from "@/lib/tier";
import { afterLoadIdle } from "@/lib/use-media";

/**
 * SLIP, for every <Sheet> on the page: each sheet below the fold starts 24px lower at −0.6°
 * with a deeper shadow, and slides up from under the previous sheet as it arrives.
 *   touch: an IntersectionObserver flips it in (520 ms, cubic-bezier(.2,.7,.1,1)).
 *   full:  GSAP scrubs it with the scroll (loaded at idle; refreshPriority −1, so pins measure first).
 *   lite / reduced motion: nothing moves.
 * Sheets already on screen at hydration are left alone, and anything inside [data-no-slip]
 * (or rendered with slip={false}) is skipped.
 */
export function SlipController() {
  const tier = useTier();
  const pathname = usePathname();

  useEffect(() => {
    if (!tier || tier === "lite") return;
    const fold = window.innerHeight * 0.94;
    const sheets = Array.from(document.querySelectorAll<HTMLElement>(".sheet[data-slip]")).filter(
      (s) => !s.closest("[data-no-slip]") && !s.parentElement?.closest(".sheet") && s.getBoundingClientRect().top > fold,
    );
    if (!sheets.length) return;
    sheets.forEach((s) => (s.dataset.slipState = "armed"));

    // Once a sheet has landed, drop the attribute: no lingering transform (it would trap fixed children).
    const settle = (sheet: HTMLElement) => {
      delete sheet.dataset.slipState;
      sheet.style.removeProperty("--slip");
    };

    if (tier === "touch") {
      const timers: Array<ReturnType<typeof setTimeout>> = [];
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const sheet = entry.target as HTMLElement;
            sheet.dataset.slipState = "in";
            timers.push(setTimeout(() => settle(sheet), 600));
            io.unobserve(sheet);
          }
        },
        { rootMargin: "0px 0px -6% 0px" },
      );
      sheets.forEach((s) => io.observe(s));
      return () => {
        io.disconnect();
        timers.forEach(clearTimeout);
        sheets.forEach(settle);
      };
    }

    let disposed = false;
    let kill: (() => void) | undefined;
    const cancel = afterLoadIdle(() => {
      void import("@/lib/gsap").then(({ gsap }) => {
        if (disposed) return;
        const tweens = sheets.map((sheet) => {
          // A sheet already scrolled past its end when this (idle) import lands gets onLeave
          // synchronously, inside fromTo, before `tween` exists: note it and kill the tween once
          // fromTo returns, never touch `tween` from inside its own constructor.
          let made = false;
          let left = false;
          const tween = gsap.fromTo(
            sheet,
            { "--slip": 1 },
            {
              "--slip": 0,
              ease: "none",
              scrollTrigger: {
                trigger: sheet,
                start: "top bottom",
                end: "top 72%",
                scrub: 0.5,
                refreshPriority: -1,
                onLeave: (self) => {
                  self.kill();
                  if (made) tween.kill();
                  else left = true;
                  settle(sheet);
                },
              },
            },
          );
          made = true;
          if (left) tween.kill();
          return tween;
        });
        kill = () =>
          tweens.forEach((t) => {
            t.scrollTrigger?.kill();
            t.kill();
          });
      });
    });

    return () => {
      disposed = true;
      cancel();
      kill?.();
      sheets.forEach(settle);
    };
  }, [tier, pathname]);

  return null;
}
