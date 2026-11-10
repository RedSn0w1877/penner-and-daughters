// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The day sheet's status board: seven ruled columns ("Keys in" → "Ready"), a lug nut on each that
 * gets a white paint-pen witness mark once the car is past it (the site's progress mark), and a
 * steel rail with a hook per column where the blue key tag hangs. Moving `active` slides the tag
 * to the new hook; the chapter swings it with swingKeyTag().
 *
 * Presentational and server-safe; the desktop chapter hides it from screen readers and reads the
 * same steps out as a list instead.
 */
import type { CSSProperties } from "react";
import { DAY_COLUMNS } from "@/data/day";
import { cx } from "@/lib/cx";
import { KeyTag } from "./key-tag";

/**
 * A wheel lug nut: done = ink with a white witness mark (drawn in with INK), current = solid ink,
 * upcoming = an outline. Decorative; say the state in words next to it.
 */
export function LugNut({
  state,
  size = 16,
  className,
}: {
  state: "done" | "current" | "upcoming";
  size?: number;
  className?: string;
}) {
  return (
    <>
      {/* The witness mark writes itself in like a pen tick (INK); without JS it's simply there. */}
      <style href="day-witness-mark" precedence="default">{`
@layer properties, theme, base, components, utilities;
@layer components {
  html.js .witness-mark { stroke-dasharray: 1; stroke-dashoffset: 1; animation: ink-draw 300ms var(--ease-ink) 120ms forwards; }
  @media (prefers-reduced-motion: reduce) { html.js .witness-mark { stroke-dashoffset: 0; animation: none; } }
}`}</style>
      <svg className={cx("flex-none overflow-visible", className)} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M22 12 17 20.66H7L2 12l5-8.66h10Z"
          fill={state === "upcoming" ? "none" : "var(--ink)"}
          stroke={state === "upcoming" ? "var(--steel)" : "var(--ink)"}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle
          cx="12"
          cy="12"
          r="4.1"
          fill={state === "upcoming" ? "none" : "var(--graphite)"}
          stroke={state === "upcoming" ? "var(--steel)" : "none"}
          strokeWidth="1.4"
        />
        {state === "done" && (
          <path className="witness-mark" d="M3.2 16.4 21.4 7.2" pathLength={1} fill="none" stroke="var(--paper)" strokeWidth="2.4" strokeLinecap="round" />
        )}
      </svg>
    </>
  );
}

export function StatusBoard({ active, className, style }: { active: number; className?: string; style?: CSSProperties }) {
  return (
    <div className={cx("relative select-none", className)} style={style} aria-hidden="true">
      <ol className="grid grid-cols-7 border-b-[1.5px] border-ink">
        {DAY_COLUMNS.map((c, i) => {
          const state = i < active ? "done" : i === active ? "current" : "upcoming";
          return (
            <li
              key={c.id}
              data-state={state}
              className={cx(
                "flex min-h-[3.1em] flex-col items-center justify-end gap-[0.35em] border-l border-rule px-[0.4em] pb-[0.55em] text-center leading-[1.15] first:border-l-0",
                "text-[clamp(12.5px,1.05vw,15px)] [--wdth:92]",
                state === "current" ? "font-bold text-ink" : state === "done" ? "font-medium text-ink" : "font-medium text-graphite",
              )}
            >
              <LugNut state={state} size={15} />
              <span>{c.label}</span>
            </li>
          );
        })}
      </ol>

      {/* The tag zone: column rules continue down, a steel rail with a hook per column. */}
      <div className="relative grid h-[var(--tag-zone,7.4em)] grid-cols-7 text-[clamp(12.5px,1.05vw,15px)]">
        {DAY_COLUMNS.map((c, i) => (
          <div key={c.id} className={cx("border-l border-rule/60 first:border-l-0", i === active && "bg-paper-shade/80")} />
        ))}
        <div className="pointer-events-none absolute inset-x-[3%] top-[0.7em] h-[3px] rounded-full bg-steel shadow-[0_1px_0_rgb(255_255_255/0.6)]" />
        <div className="pointer-events-none absolute inset-x-0 top-[0.42em] grid grid-cols-7">
          {DAY_COLUMNS.map((c) => (
            <span key={c.id} className="mx-auto block size-[0.62em] rounded-full border-2 border-steel bg-paper" />
          ))}
        </div>
        <div
          className="pointer-events-none absolute left-0 top-[0.55em] w-[calc(100%/7)] transition-[translate] duration-[560ms] ease-slip motion-reduce:transition-none"
          style={{ translate: `${active * 100}% 0` }}
          data-tag-slot=""
        >
          <KeyTag className="mx-auto w-[min(3.9em,46%)]" />
        </div>
      </div>
    </div>
  );
}
