"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { useEffect, useRef, useState } from "react";
import { getLenis, useScrollTo } from "@/components/providers/smooth-scroll";
import { HERO_PHRASES } from "@/data/symptom-basics";
import { cx } from "@/lib/cx";
import { symptom } from "@/lib/stores";
import { useReducedMotion, useTier } from "@/lib/tier";
import { useInView, useLoadIdle, usePageVisible } from "@/lib/use-media";

/* TYPE (spec §8): 32 ms a character, hold 2.2 s, erase 14 ms a character. */
const TYPE_MS = 32;
const HOLD_MS = 2200;
const ERASE_MS = 14;
/** Pause between erasing one phrase and typing the next. */
const GAP_MS = 180;
/**
 * Phrase 1 is on the line from the start (server HTML). Then two full cycles (2, 3, 4, 1, 2, 3, 4, 1),
 * and it rests on phrase 1: `step` counts phrases typed after the first, and step 8 is the last.
 */
const LAST_STEP = HERO_PHRASES.length * 2;
/** The flight into the concern box (manual FLIP). */
const FLIGHT_MS = 700;

type Phase = "hold" | "erase" | "type" | "rest";
interface Machine {
  step: number;
  chars: number;
  phase: Phase;
}

const phraseAt = (step: number) => HERO_PHRASES[step % HERO_PHRASES.length];

/**
 * On the full tier Lenis scrolls on GSAP's ticker, which lib/gsap parks 2 s after the last wheel,
 * key or pointer input. A click that arrives without one (a screen reader's activation, a scripted
 * click) would start a scroll that never moves, so count it as input first.
 */
export function wakeScroller() {
  if (getLenis()) window.dispatchEvent(new KeyboardEvent("keydown", { key: "Unidentified" }));
}
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * The phrase lifts off the repair order as a paper slip and flies along a shallow arc into the
 * concern box, following it while the page scrolls there. The box keeps its own text hidden
 * ([data-flight]) until the slip lands, then the two cross-fade.
 */
function flyToConcern(source: HTMLElement, text: string): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const box = document.querySelector<HTMLElement>("[data-concern]");
    if (!box) {
      resolve(null);
      return;
    }
    box.dataset.flight = "true";
    const from = source.getBoundingClientRect();
    const font = getComputedStyle(source);
    const PAD_X = 10;
    const PAD_Y = 6;

    const ghost = document.createElement("div");
    ghost.setAttribute("aria-hidden", "true");
    ghost.textContent = `“${text}”`;
    Object.assign(ghost.style, {
      position: "fixed",
      left: "0",
      top: "0",
      zIndex: "45",
      margin: "0",
      padding: `${PAD_Y - 1}px ${PAD_X - 1}px`,
      pointerEvents: "none",
      fontFamily: font.fontFamily,
      fontSize: font.fontSize,
      fontWeight: font.fontWeight,
      lineHeight: font.lineHeight,
      color: "var(--ink)",
      whiteSpace: "nowrap",
      maxWidth: "calc(100vw - 24px)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      background: "var(--paper)",
      border: "1px solid var(--rule)",
      borderRadius: "2px",
      boxShadow: "var(--shadow-lift)",
      transformOrigin: "0 0",
      willChange: "transform",
    } satisfies Partial<CSSStyleDeclaration>);
    document.body.appendChild(ghost);

    const x0 = from.left - PAD_X;
    const y0 = from.top - PAD_Y;
    const t0 = performance.now();
    let lastTop = Number.NaN;
    let still = 0;

    const land = () => {
      delete box.dataset.flight;
      const fade = ghost.animate?.([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: "ease-out", fill: "forwards" });
      if (fade) fade.finished.catch(() => {}).finally(() => ghost.remove());
      // `finished` waits for a rendered frame; on a starved main thread don't leave the slip behind.
      setTimeout(() => ghost.remove(), fade ? 320 : 0);
      resolve(box);
    };

    const frame = (now: number) => {
      const target = box.querySelector<HTMLElement>("[data-concern-value]") ?? box;
      const r = target.getBoundingClientRect();
      const rawTop = r.top - PAD_Y;
      // While the page is still scrolling, aim at the box's edge of the viewport, never off-screen.
      const tx = r.left - PAD_X;
      const ty = Math.min(Math.max(rawTop, 8), window.innerHeight - 72);
      const p = Math.min(1, (now - t0) / FLIGHT_MS);
      const e = easeInOut(p);
      const lift = Math.sin(Math.PI * p);
      const x = x0 + (tx - x0) * e;
      const y = y0 + (ty - y0) * e - lift * 56;
      ghost.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(-2.2 * lift).toFixed(2)}deg)`;
      if (p < 1) {
        requestAnimationFrame(frame);
        return;
      }
      // On time, or still riding along until the scroll brings the box fully on screen and stops.
      still = Math.abs(rawTop - lastTop) < 0.5 ? still + 1 : 0;
      lastTop = rawTop;
      if ((rawTop === ty && still >= 2) || now - t0 > FLIGHT_MS + 1600) land();
      else requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}

/**
 * "Customer states" on the repair order: a fill-in line where the customer's words type
 * themselves in (two cycles through the four phrases, then it rests on the first). It types only
 * after load + idle, only while on screen, and never on the lite tier or with reduced motion,
 * where phrase 1 simply sits on the line (as it does in the server HTML).
 *
 * The line is a button: it looks the phrase up in the symptom guide, flies the words into the
 * concern box and scrolls there.
 */
export function CustomerStates({ className }: { className?: string }) {
  const tier = useTier();
  const reduced = useReducedMotion();
  const loadIdle = useLoadIdle();
  const visible = usePageVisible();
  const scrollTo = useScrollTo();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(buttonRef);

  const machine = useRef<Machine>({ step: 0, chars: HERO_PHRASES[0].phrase.length, phase: "hold" });
  const [index, setIndex] = useState(0);
  const [chars, setChars] = useState(HERO_PHRASES[0].phrase.length);
  const [phase, setPhase] = useState<Phase>("hold");
  const [done, setDone] = useState(false);

  const animated = (tier === "full" || tier === "touch") && !reduced;
  const running = animated && loadIdle && inView && visible && !done;

  useEffect(() => {
    if (!running) return;
    let timer: ReturnType<typeof setTimeout>;
    const m = machine.current;

    const tick = () => {
      const length = phraseAt(m.step).phrase.length;
      if (m.phase === "hold") {
        m.phase = "erase";
        setPhase("erase");
        timer = setTimeout(tick, ERASE_MS);
      } else if (m.phase === "erase") {
        m.chars = Math.max(0, m.chars - 1);
        setChars(m.chars);
        if (m.chars === 0) {
          m.step += 1;
          m.phase = "type";
          setIndex(m.step % HERO_PHRASES.length);
          setPhase("type");
          timer = setTimeout(tick, GAP_MS);
        } else {
          timer = setTimeout(tick, ERASE_MS);
        }
      } else if (m.phase === "type") {
        m.chars = Math.min(length, m.chars + 1);
        setChars(m.chars);
        if (m.chars < length) {
          timer = setTimeout(tick, TYPE_MS);
        } else if (m.step >= LAST_STEP) {
          m.phase = "rest";
          setPhase("rest");
          setDone(true);
        } else {
          m.phase = "hold";
          setPhase("hold");
          timer = setTimeout(tick, HOLD_MS);
        }
      }
    };

    // Resume where it paused (a hold restarts its full 2.2 s, so a returning reader can read it).
    timer = setTimeout(tick, m.phase === "hold" ? HOLD_MS : m.phase === "erase" ? ERASE_MS : TYPE_MS);
    return () => clearTimeout(timer);
  }, [running]);

  const current = HERO_PHRASES[index];
  const complete = chars >= current.phrase.length;
  const showCaret = animated && loadIdle && !done;

  const lookUp = () => {
    const i = index;
    const { phrase, symptom: id } = HERO_PHRASES[i];
    // Stop typing and leave the whole phrase on the line.
    machine.current = { step: LAST_STEP, chars: phrase.length, phase: "rest" };
    setChars(phrase.length);
    setPhase("rest");
    setDone(true);

    symptom.set(id, "hero", phrase);
    const source = valueRef.current;
    wakeScroller();
    scrollTo("#whats-wrong");

    const focusBox = (box: HTMLElement | null) => (box ?? document.querySelector<HTMLElement>("[data-concern]"))?.focus({ preventScroll: true });
    if (!source || !animated) {
      requestAnimationFrame(() => focusBox(null));
      return;
    }
    // Wait one frame so the concern box has rendered the phrase it's about to receive.
    requestAnimationFrame(() => void flyToConcern(source, phrase).then(focusBox));
  };

  return (
    <div className={className}>
      <button
        ref={buttonRef}
        type="button"
        onClick={lookUp}
        aria-label={`Look up: ${current.phrase}`}
        className="group block w-full cursor-pointer rounded-[2px] text-left"
      >
        {/* Label above the line at every width, so the longest phrase fits one line from 640px up
            (two lines are reserved below that): typing never changes the sheet's height. */}
        <span className="type-label flex items-baseline justify-between gap-3">
          <span>Customer states</span>
          <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-graphite transition-colors group-hover:text-blue">
            Look up
            <ArrowDown />
          </span>
        </span>
        <span className="relative mt-1.5 flex min-w-0 items-end border-b-[1.5px] border-ink pb-1.5 transition-colors group-hover:border-blue">
          <span
            ref={valueRef}
            aria-hidden="true"
            className="block min-h-[2lh] min-w-0 flex-1 font-mono text-[15px] leading-[1.45] text-ink sm:min-h-[1lh] xl:text-[16px]"
          >
            {"“"}
            {current.phrase.slice(0, chars)}
            {complete && "”"}
            {showCaret && (
              <span
                className={cx(
                  "ml-px inline-block h-[1.05em] w-[2px] translate-y-[0.16em] bg-blue",
                  phase === "hold" && "animate-[pd-caret_1.1s_steps(1)_2]",
                )}
              />
            )}
          </span>
        </span>
      </button>
      <style href="pd-hero-caret" precedence="pd">{`@keyframes pd-caret{0%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  );
}

function ArrowDown() {
  return (
    <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 1.5v8.5M2.5 6.6 6 10l3.5-3.4" />
    </svg>
  );
}
