// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The day chapter's drum clock: night-ink digits on ink tiles, so it reads on the night film, on
 * the dawn and on paper. Every digit is a drum (ROLL), like the odometer on the estimate.
 *
 * Server-safe on purpose (no hooks): the stacked day sheet renders it as a static clock, and the
 * desktop chapter drives the same DOM with setClock():
 *   - "scrub": drums sit at fractional positions, so scrolling through the night turns the clock
 *     like a time-lapse (the ones drum spins, and carries into the tens on the last minute).
 *   - "roll":  drums turn to whole values with the ROLL ease, 40 ms apart from right to left.
 */
import type { CSSProperties } from "react";
import { cx } from "@/lib/cx";

const HOURS = ["12", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const TENS = ["0", "1", "2", "3", "4", "5", "0"];
const ONES = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const MERIDIEM = ["AM", "PM", "AM"];

/** Height of one drum cell, in the drum's own em. */
const CELL = 1.08;

type DrumId = "hour" | "tens" | "ones" | "meridiem";

export interface DrumPositions {
  hour: number;
  tens: number;
  ones: number;
  meridiem: number;
}

/**
 * Drum positions for a time given in minutes after midnight (values past 1440 are the next day).
 * `continuous` keeps the fractions, with odometer carries: the tens drum only turns during the
 * last minute of each ten, the hour during the last minute of the hour.
 */
export function clockPositions(minutes: number, continuous = false): DrumPositions {
  const day = ((minutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(day / 60);
  const m = day - h24 * 60;
  let ones = m % 10;
  let tens = Math.floor(m / 10);
  let hour = h24 % 12;
  let meridiem = h24 >= 12 ? 1 : 0;
  if (continuous) {
    if (ones >= 9) tens += ones - 9;
    if (m >= 59) {
      hour += m - 59;
      if (h24 === 11 || h24 === 23) meridiem += m - 59;
    }
  } else {
    ones = Math.floor(ones);
  }
  return { hour, tens, ones, meridiem };
}

/** "7:12 PM" for minutes after midnight. */
export function clockText(minutes: number): string {
  const day = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h24 = Math.floor(day / 60);
  const m = day % 60;
  return `${h24 % 12 === 0 ? 12 : h24 % 12}:${String(m).padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`;
}

const drumTransform = (pos: number) => `translateY(${(-pos * CELL).toFixed(4)}em)`;

/* ROLL stagger, right to left: the ones drum (and AM/PM) first, then tens, then the hour. */
const DELAY: Record<DrumId, string> = { ones: "0ms", meridiem: "0ms", tens: "40ms", hour: "80ms" };

function Drum({
  id,
  cells,
  pos,
  align = "center",
  className,
}: {
  id: DrumId;
  cells: readonly string[];
  pos: number;
  /** The hour drum is two digits wide; single-digit hours sit against the colon. */
  align?: "center" | "right";
  className?: string;
}) {
  return (
    <span
      className={cx(
        "relative inline-block h-[1.08em] overflow-hidden rounded-[0.07em] bg-ink px-[0.07em] text-night-ink",
        // The drum's curve: darker at the top and bottom of the window, like a real odometer.
        "after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(180deg,rgb(0_0_0/0.5),transparent_30%,transparent_70%,rgb(0_0_0/0.5))] after:content-['']",
        "shadow-[inset_0_0_0_0.02em_rgb(255_255_255/0.08)]",
        className,
      )}
    >
      <span
        data-drum={id}
        className="block transition-transform duration-[420ms] ease-roll group-data-[mode=scrub]/dclock:transition-none"
        style={{ transform: drumTransform(pos), transitionDelay: DELAY[id] }}
      >
        {cells.map((c, i) => (
          <span key={i} className={cx("block h-[1.08em] leading-[1.08em]", align === "right" ? "text-right" : "text-center")}>
            {c}
          </span>
        ))}
      </span>
    </span>
  );
}

/**
 * The clock face. Size it with a font-size class (the tiles are em-based). `label` is what screen
 * readers get (the drums are hidden from them); it defaults to the time.
 */
export function ClockFace({
  minutes,
  label,
  className,
  style,
}: {
  minutes: number;
  label?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const p = clockPositions(minutes);
  return (
    <span className={cx("group/dclock inline-block align-top", className)} data-mode="roll" style={style}>
      <span className="sr-only" data-clock-label="">
        {label ?? clockText(minutes)}
      </span>
      <span aria-hidden="true" className="flex items-start gap-[0.05em] font-mono font-bold leading-none tabular-nums">
        <Drum id="hour" cells={HOURS} pos={p.hour} align="right" />
        <span className="flex h-[1.08em] w-[0.34em] justify-center overflow-hidden rounded-[0.07em] bg-ink leading-[1.02em] text-night-ink">
          :
        </span>
        <Drum id="tens" cells={TENS} pos={p.tens} />
        <Drum id="ones" cells={ONES} pos={p.ones} />
        <Drum id="meridiem" cells={MERIDIEM} pos={p.meridiem} className="ml-[0.04em] text-[0.3em]" />
      </span>
    </span>
  );
}

/* ---------------------------------------------------------------------------------------------
 * Imperative control (desktop chapter). No React state: the chapter calls this from its scroll
 * handler, so a scrubbed clock costs four style writes per frame and no re-render.
 * ------------------------------------------------------------------------------------------- */

const DRUMS: readonly DrumId[] = ["hour", "tens", "ones", "meridiem"];
/** Each strip repeats its first cell at the end, so a one-step wrap can keep turning forward. */
const END_CELL: Record<DrumId, number> = { hour: HOURS.length - 1, tens: TENS.length - 1, ones: ONES.length - 1, meridiem: MERIDIEM.length - 1 };

interface DrumState {
  els: Record<DrumId, HTMLElement | null>;
  label: HTMLElement | null;
  last: DrumPositions | null;
  wrapped: DrumId[];
  timer?: ReturnType<typeof setTimeout>;
}

const drumCache = new WeakMap<HTMLElement, DrumState>();

function drumsOf(root: HTMLElement): DrumState {
  let d = drumCache.get(root);
  if (!d) {
    const q = (id: DrumId) => root.querySelector<HTMLElement>(`[data-drum="${id}"]`);
    d = {
      els: { hour: q("hour"), tens: q("tens"), ones: q("ones"), meridiem: q("meridiem") },
      label: root.querySelector<HTMLElement>("[data-clock-label]"),
      last: null,
      wrapped: [],
    };
    drumCache.set(root, d);
  }
  return d;
}

/** After a forward wrap lands on the end cell, swap it for the identical first cell, unseen. */
function settleWraps(d: DrumState) {
  clearTimeout(d.timer);
  d.wrapped.forEach((id) => {
    const el = d.els[id];
    if (!el) return;
    el.style.transitionProperty = "none";
    el.style.transform = drumTransform(0);
    void el.offsetWidth;
    el.style.transitionProperty = "";
  });
  d.wrapped = [];
}

/**
 * Point a ClockFace's drums at `minutes`. "scrub" moves them instantly to fractional positions;
 * "roll" turns them to whole values with the ROLL transition and updates the spoken label. A roll
 * that wraps by one (9 → 0, 5 → 0, 11 → 12, PM → AM) keeps turning forward instead of spinning back.
 */
export function setClock(root: HTMLElement, minutes: number, mode: "scrub" | "roll"): void {
  const d = drumsOf(root);
  if (d.wrapped.length) settleWraps(d);
  const p = clockPositions(minutes, mode === "scrub");
  const shown = { ...p };
  if (mode === "roll" && d.last) {
    for (const id of DRUMS) {
      if (p[id] === 0 && Math.round(d.last[id]) === END_CELL[id] - 1) {
        shown[id] = END_CELL[id];
        d.wrapped.push(id);
      }
    }
  }
  if (root.dataset.mode !== mode) root.dataset.mode = mode;
  for (const id of DRUMS) {
    const el = d.els[id];
    if (el) el.style.transform = drumTransform(shown[id]);
  }
  d.last = p;
  if (d.wrapped.length) d.timer = setTimeout(() => settleWraps(d), 600);
  if (mode === "roll" && d.label) d.label.textContent = clockText(minutes);
}
