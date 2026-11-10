"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The warranty's four promises in big type, set with RATCHET as each line comes into view: every
 * word advances in two 6px clicks (steps(2), 90 ms a word), and the last word widens from Archivo
 * wdth 64 to 70 as it lands, like a ratchet seating.
 *
 * The animation is CSS; the only script is an IntersectionObserver that arms each line and marks it
 * seen. The words are hidden only once armed (JS running, html.js) and with motion allowed, so
 * without JS, before the island comes alive, or with reduced motion the lines are simply there. Screen readers get each line as one sentence.
 */
import { useEffect, useRef, type CSSProperties } from "react";
import { cx } from "@/lib/cx";
import { WARRANTY } from "@/lib/facts";

const LINES = [
  "Photos before any work.",
  "You approve every dollar first.",
  "Same day on most repairs, when parts are in stock.",
  WARRANTY.ratchet,
] as const;

const STYLES = `
@layer properties, theme, base, components, utilities;
@layer components {
  @keyframes ratchet-click { from { translate: -12px 0; } to { translate: 0 0; } }
  @keyframes ratchet-show { from { opacity: 0; } to { opacity: 1; } }
  @keyframes ratchet-seat { from { font-variation-settings: "wdth" 64; } to { font-variation-settings: "wdth" 70; } }
  .ratchet-word { display: inline-block; }
  @media (prefers-reduced-motion: no-preference) {
    html.js .ratchet-line[data-armed]:not([data-seen]) .ratchet-word { opacity: 0; }
  }
  .ratchet-line[data-seen] .ratchet-word {
    animation:
      ratchet-click 90ms steps(2, jump-start) calc(var(--i) * 90ms) both,
      ratchet-show 90ms steps(1, jump-start) calc(var(--i) * 90ms) both;
  }
  .ratchet-line[data-seen] .ratchet-word[data-last] {
    animation:
      ratchet-click 90ms steps(2, jump-start) calc(var(--i) * 90ms) both,
      ratchet-show 90ms steps(1, jump-start) calc(var(--i) * 90ms) both,
      ratchet-seat 220ms var(--ease-ink) calc(var(--i) * 90ms + 90ms) both;
  }
}`;

export function RatchetLines({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.seen = "";
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -14% 0px" },
    );
    // Armed only once this script runs: the server HTML (shown before the island comes alive, or
    // without JS) keeps every word visible.
    root.querySelectorAll<HTMLElement>(".ratchet-line").forEach((line) => {
      line.dataset.armed = "";
      io.observe(line);
    });
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={cx("flex flex-col gap-[0.32em] text-[clamp(40px,6vw,96px)]", className)}>
      <style href="warranty-ratchet" precedence="default">
        {STYLES}
      </style>
      {LINES.map((line) => {
        const words = line.split(" ");
        return (
          <p key={line} className="ratchet-line font-[830] leading-[0.94] tracking-[-0.01em] text-ink [--wdth:64]">
            <span className="sr-only">{line}</span>
            <span aria-hidden="true">
              {words.map((word, i) => (
                <span key={i}>
                  <span
                    className={cx("ratchet-word", i === words.length - 1 && "[--wdth:70]")}
                    data-last={i === words.length - 1 ? "" : undefined}
                    style={{ "--i": i } as CSSProperties}
                  >
                    {word}
                  </span>
                  {i < words.length - 1 ? " " : null}
                </span>
              ))}
            </span>
          </p>
        );
      })}
    </div>
  );
}
