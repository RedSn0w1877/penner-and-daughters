"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The desktop day chapter (full tier only; DayUpgrade lazy-loads this file after load + idle).
 *
 * One pinned stage, 380vh of scroll:
 *   0–60vh    NIGHT    the night-drop film fills the screen behind a night scrim; the drum clock
 *                      scrubs from 7:12 PM to 6:30 AM, a time-lapse driven by the scroll.
 *   60vh      DOOR     crossfade to the door-rise film (plays once, holds the hero frame); the clock
 *                      clicks over to opening time.
 *   60–108vh  DAWN     the page dawns behind the film: night → dawn → counter; the text turns ink.
 *   100–160vh DEVELOP  the film shrinks into the print slot on the day sheet (border, clip, tilt);
 *                      the clock docks top-left of the sheet.
 *   172–380vh DAY      seven steps: the key tag swings to its column, the print swaps media, the
 *                      phone gets the shop's texts, the clock rolls to each time.
 *
 * The pin is a CSS sticky stage inside a tall track; ScrollTrigger reports the progress and
 * apply() turns it into a handful of style writes (no tweens, no per-frame React renders). Discrete
 * moments (a new line, a new step) are React state that only changes when the moment changes.
 * At rest nothing runs: no tween, no rAF loop (GSAP's ticker sleeps), and clips play only while the
 * stage is on screen.
 */
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { BookButton, CallButton } from "@/components/ui/buttons";
import { FilmClip } from "@/components/ui/film-clip";
import { Sheet } from "@/components/ui/sheet";
import { TextSwap } from "@/components/ui/text-swap";
import { IMPRINTS, LABELS } from "@/data/copy";
import { DAY_COLUMNS, DAY_SHEET, DAY_STEPS, MEDIA_LABEL, NIGHT, NIGHT_REPLY, columnIndex, textsThrough } from "@/data/day";
import { cx } from "@/lib/cx";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { booking } from "@/lib/stores";
import { useInView } from "@/lib/use-media";
import { ClockFace, clockText, setClock } from "./day-clock";
import { DayPhone } from "./day-phone";
import { DayPrint } from "./day-print";
import { swingKeyTag } from "./key-tag";
import { StatusBoard } from "./status-board";

/* Scroll map, in vh of pinned scroll. */
const PIN_VH = 380;
const LINE_AT = 22;
const DOOR_AT = 60;
const DAWN = [60, 84, 108] as const;
const INK_AT = 96;
const DEVELOP = [100, 160] as const;
const STEPS_AT = 172;
const STEP_VH = (PIN_VH - STEPS_AT) / DAY_STEPS.length;
const PRINT_TILT = 1.4;
/**
 * The full-bleed films crop from the left (under the scrim) and the top, never from the right or the bottom, so the
 * burned-in "HVNF Studios · portfolio sample" mark in the bottom-right corner stays whole.
 */
const FULLBLEED = "absolute inset-0 aspect-auto h-full w-full [&>picture>img]:object-[100%_100%] [&>video]:object-[100%_100%]";

const RGB = {
  night: [13, 16, 19],
  dawn: [44, 58, 74],
  counter: [201, 205, 209],
} as const;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mixRgb = (a: readonly number[], b: readonly number[], t: number) => a.map((v, i) => Math.round(lerp(v, b[i], t)));

/** DAWN: the stage and the scrim go night → dawn → counter. */
function dawnRgb(vh: number): readonly number[] {
  if (vh <= DAWN[0]) return RGB.night;
  if (vh <= DAWN[1]) return mixRgb(RGB.night, RGB.dawn, (vh - DAWN[0]) / (DAWN[1] - DAWN[0]));
  if (vh <= DAWN[2]) return mixRgb(RGB.dawn, RGB.counter, (vh - DAWN[1]) / (DAWN[2] - DAWN[1]));
  return RGB.counter;
}

/* Text sits on the scrim's solid part (85%), which fades to nothing across the left 45%. */
const SCRIM_STYLE = {
  "--scrim": RGB.night.join(" "),
  backgroundImage:
    "linear-gradient(90deg, rgb(var(--scrim) / 0.85) 0%, rgb(var(--scrim) / 0.85) 68%, rgb(var(--scrim) / 0.42) 86%, rgb(var(--scrim) / 0) 100%)",
} as CSSProperties;

interface Moment {
  /** 0 "The night before." · 1 "Your car waits…" · 2 door up. */
  beat: 0 | 1 | 2;
  ink: boolean;
  /** The day sheet has developed enough to use (it's inert before). */
  dayOn: boolean;
  /** 0 = the developed bay; 1–7 = DAY_STEPS[step - 1]. */
  step: number;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** An element's layout box relative to `root`, ignoring transforms (offsets, not client rects). */
function layoutBox(el: HTMLElement, root: HTMLElement): Box {
  let x = 0;
  let y = 0;
  let n: Element | null = el;
  while (n instanceof HTMLElement && n !== root) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

export function DayChapter() {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const filmRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLDivElement>(null);
  const clockCaptionRef = useRef<HTMLParagraphElement>(null);
  const dayRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const [moment, setMoment] = useState<Moment>({ beat: 0, ink: false, dayOn: false, step: 0 });
  const momentRef = useRef(moment);
  const [forward, setForward] = useState(true);
  const [doorEnded, setDoorEnded] = useState(false);
  const [endedStep, setEndedStep] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const stageInView = useInView(stageRef);

  useGSAP(
    () => {
      const stage = stageRef.current;
      const track = trackRef.current;
      const bg = bgRef.current;
      const film = filmRef.current;
      const scrim = scrimRef.current;
      const label = labelRef.current;
      const copy = copyRef.current;
      const clock = clockRef.current;
      const day = dayRef.current;
      const dock = dockRef.current;
      const frame = frameRef.current;
      if (!stage || !track || !bg || !film || !scrim || !label || !copy || !clock || !day || !dock || !frame) return;
      const clockFace = clock.firstElementChild as HTMLElement;
      const ease = gsap.parseEase("power2.inOut");

      /** The discrete time the clock shows from the door on (null = scrubbing the night). */
      let clockTarget: number | null = null;
      let doorTimer: ReturnType<typeof setTimeout> | undefined;

      const measure = () => {
        const vw = stage.clientWidth;
        const vh = stage.clientHeight;
        const home = { x: clock.offsetLeft, y: clock.offsetTop, w: clock.offsetWidth, h: clock.offsetHeight };
        const docked = layoutBox(dock, stage);
        // The print tilts about its own center, so the frame's center turns with it.
        const box = layoutBox(frame, stage);
        const figure = frame.closest("figure");
        const fig = figure instanceof HTMLElement ? layoutBox(figure, stage) : box;
        const t = (PRINT_TILT * Math.PI) / 180;
        const fx = fig.x + fig.w / 2;
        const fy = fig.y + fig.h / 2;
        const dx = box.x + box.w / 2 - fx;
        const dy = box.y + box.h / 2 - fy;
        return {
          vw,
          vh,
          home,
          docked,
          dockScale: home.w > 0 ? docked.w / home.w : 1,
          frame: { cx: fx + Math.cos(t) * dx - Math.sin(t) * dy, cy: fy + Math.sin(t) * dx + Math.cos(t) * dy, w: box.w, h: box.h },
        };
      };

      let geo = measure();

      const apply = (progress: number) => {
        const g = geo;
        const vh = progress * PIN_VH;

        // NIGHT: the clock is a time-lapse of the night until the door.
        if (vh < DOOR_AT) {
          if (clockTarget !== null) {
            clockTarget = null;
            clearTimeout(doorTimer);
          }
          setClock(clockFace, lerp(NIGHT.dropAt, NIGHT.waitAt, vh / DOOR_AT), "scrub");
        }

        // DAWN: the page behind the film, and the scrim it bleeds through.
        const rgb = dawnRgb(vh).join(" ");
        bg.style.backgroundColor = `rgb(${rgb})`;
        scrim.style.setProperty("--scrim", rgb);

        // DEVELOP: the film becomes the print; the clock docks on the sheet.
        const d = ease(clamp01((vh - DEVELOP[0]) / (DEVELOP[1] - DEVELOP[0])));
        if (g.vw > 0 && g.frame.w > 0) {
          const cover = Math.max(g.frame.w / g.vw, g.frame.h / g.vh);
          const s = lerp(1, cover, d);
          const cx = lerp(g.vw / 2, g.frame.cx, d);
          const cy = lerp(g.vh / 2, g.frame.cy, d);
          const cropX = Math.max(0, (g.vw - g.frame.w / cover) / 2) * d;
          const cropY = Math.max(0, (g.vh - g.frame.h / cover) / 2) * d;
          film.style.transform = `translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px) rotate(${(PRINT_TILT * d).toFixed(3)}deg) scale(${s.toFixed(4)}) translate(${(-g.vw / 2).toFixed(2)}px, ${(-g.vh / 2).toFixed(2)}px)`;
          film.style.clipPath = d > 0 ? `inset(${cropY.toFixed(2)}px ${cropX.toFixed(2)}px)` : "";
        }
        // The clock docks in the second half, once the print is nearly in its slot (not across the film).
        const dc = ease(clamp01((d - 0.45) / 0.55));
        clock.style.transform = `translate(${((g.docked.x - g.home.x) * dc).toFixed(2)}px, ${((g.docked.y - g.home.y) * dc).toFixed(2)}px) scale(${lerp(1, g.dockScale, dc).toFixed(4)})`;
        if (clockCaptionRef.current) clockCaptionRef.current.style.opacity = (1 - clamp01(d / 0.45)).toFixed(3);
        const fade = (1 - clamp01(d / 0.5)).toFixed(3);
        scrim.style.opacity = fade;
        label.style.opacity = fade;
        copy.style.opacity = (1 - clamp01(d / 0.4)).toFixed(3);
        copy.style.transform = `translateY(${(-30 * clamp01(d / 0.6)).toFixed(2)}px)`;
        // The day sheet and the phone fade in only once the film has shrunk past ~60%, so the
        // shrinking print never lies across the column headers or the phone.
        day.style.opacity = clamp01((d - 0.62) / 0.33).toFixed(3);

        // Discrete moments: React only hears about changes.
        const step = vh < STEPS_AT ? 0 : Math.min(DAY_STEPS.length, 1 + Math.floor((vh - STEPS_AT) / STEP_VH));
        const next: Moment = { beat: vh < LINE_AT ? 0 : vh < DOOR_AT ? 1 : 2, ink: vh >= INK_AT, dayOn: d > 0.6, step };
        const prev = momentRef.current;
        if (next.beat !== prev.beat || next.ink !== prev.ink || next.dayOn !== prev.dayOn || next.step !== prev.step) {
          momentRef.current = next;
          setMoment(next);
          if (next.beat < 2 && prev.beat === 2) setDoorEnded(false);
          if (next.step !== prev.step) {
            setEndedStep(null);
            setForward(next.step > prev.step);
          }
        }

        // From the door on, the clock rolls between whole times: one minute before opening → opening, then each step.
        if (vh >= DOOR_AT) {
          const target = step >= 1 ? DAY_STEPS[step - 1].minutes : NIGHT.openAt;
          if (target !== clockTarget) {
            const fromNight = clockTarget === null;
            clockTarget = target;
            clearTimeout(doorTimer);
            if (fromNight && target === NIGHT.openAt) {
              setClock(clockFace, NIGHT.openAt - 1, "roll");
              doorTimer = setTimeout(() => setClock(clockFace, NIGHT.openAt, "roll"), 560);
            } else {
              setClock(clockFace, target, "roll");
            }
          }
        }
      };

      ScrollTrigger.create({
        trigger: track,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => apply(self.progress),
        onRefresh: (self) => {
          geo = measure();
          apply(self.progress);
        },
      });
      // The page just got taller (this chapter replaced the stacked day sheet): re-measure everything.
      ScrollTrigger.refresh();

      return () => clearTimeout(doorTimer);
    },
    { scope: trackRef },
  );

  // SWING: the key tag swings each time it moves to another column.
  const column = moment.step >= 1 ? columnIndex(DAY_STEPS[moment.step - 1].column) : 0;
  const lastColumn = useRef(column);
  useEffect(() => {
    const delta = column - lastColumn.current;
    lastColumn.current = column;
    if (delta) swingKeyTag(stageRef.current?.querySelector<HTMLElement>("[data-key-tag]") ?? null, delta);
  }, [column]);

  const live = stageInView && !paused;
  // The night-drop auto-reply leads the thread, so the phone is never blank in the first steps.
  const texts = [NIGHT_REPLY, ...textsThrough(moment.step)];
  const before = 1 + textsThrough(Math.max(0, moment.step - 1)).length;
  const arrived = moment.step > 0 && forward ? texts.length - before : 0;
  const beatLine = [NIGHT.dropLine, NIGHT.waitLine, NIGHT.doorLine][moment.beat];
  const stepLine = moment.step >= 1 ? DAY_STEPS[moment.step - 1].line : NIGHT.doorLine;

  return (
    <div ref={trackRef} className="relative" style={{ height: `${PIN_VH + 100}vh` }} data-no-slip="">
      <div ref={stageRef} className="group/stage sticky top-0 h-screen overflow-hidden" data-ink={moment.ink ? "true" : "false"}>
        <div ref={bgRef} className="absolute inset-0 bg-night" aria-hidden="true" />

        {/* DAY: the day sheet and the phone, under the film until it develops. */}
        <div
          ref={dayRef}
          inert={!moment.dayOn}
          className="absolute inset-x-0 bottom-[3vh] top-[calc(var(--header-h)_+_2.5vh)] z-[1] opacity-0"
        >
          <div className="mx-auto grid h-full w-[min(1400px,calc(100%_-_80px))] grid-cols-[minmax(0,1fr)_clamp(220px,21vw,300px)] gap-[clamp(24px,3vw,44px)]">
            <Sheet
              imprint={IMPRINTS.day}
              slip={false}
              className="h-full min-h-0 [&>.sheet-paper]:flex [&>.sheet-paper]:h-full [&>.sheet-paper]:flex-col"
              bodyClassName="flex min-h-0 flex-1 flex-col gap-[2.2vh] p-[clamp(20px,2.2vw,34px)]"
            >
              <div className="flex items-start justify-between gap-6" aria-hidden="true">
                <div className="min-w-0">
                  <p className="text-[17px] font-bold leading-tight [--wdth:88]">{DAY_SHEET.title}</p>
                  <p className="mono-measure mt-1 text-graphite">{DAY_SHEET.car}</p>
                  {/* The docked clock's place: an invisible twin at the docked size. */}
                  <div ref={dockRef} className="invisible mt-[1.6vh] w-max">
                    <ClockFace minutes={NIGHT.openAt} className="text-[clamp(60px,min(6.8vw,11vh),100px)]" />
                  </div>
                </div>
                <DayPrint
                  step={moment.step}
                  playing={live}
                  ended={endedStep}
                  onEnded={setEndedStep}
                  frameRef={frameRef}
                  className="w-[clamp(230px,min(25vw,44vh),400px)] flex-none"
                />
              </div>

              <StatusBoard active={column} />

              <p className="min-h-[2.7em] max-w-[54ch] text-[clamp(19px,1.6vw,25px)] font-semibold leading-[1.3] [--wdth:86]" aria-hidden="true">
                <TextSwap text={stepLine} />
              </p>

              <div className="mt-auto flex flex-wrap items-center gap-3">
                <BookButton label={DAY_SHEET.nightDrop} onClick={() => booking.prefill({ arrival: "nightdrop" })} />
                <CallButton />
              </div>
            </Sheet>

            <div className="flex min-h-0 items-center" aria-hidden="true">
              <DayPhone
                texts={texts}
                freshFrom={forward ? before : Infinity}
                badge={arrived}
                badgeKey={moment.step}
                className="h-[min(600px,100%)] w-full"
              />
            </div>
          </div>
        </div>

        {/* NIGHT → DOOR → DEVELOP: the film, full-bleed until it shrinks onto the print. */}
        <div
          ref={filmRef}
          className={cx(
            "pointer-events-none absolute left-0 top-0 z-[2] h-full w-full origin-top-left transition-opacity duration-300 will-change-transform",
            moment.step >= 1 && "opacity-0",
          )}
          aria-hidden="true"
        >
          <FilmClip
            id="night-drop"
            variant="fullbleed"
            controls={false}
            active={live && moment.beat < 2}
            className={FULLBLEED}
          />
          <div className={cx("absolute inset-0 transition-opacity duration-[400ms] ease-out", moment.beat === 2 ? "opacity-100" : "opacity-0")}>
            <FilmClip
              id="door-rise"
              variant="fullbleed"
              playOnce
              controls={false}
              active={live && moment.beat === 2 && moment.step === 0 && !doorEnded}
              onEnded={() => setDoorEnded(true)}
              className={FULLBLEED}
            />
          </div>
        </div>

        <div ref={scrimRef} className="pointer-events-none absolute inset-y-0 left-0 z-[3] w-[45%]" style={SCRIM_STYLE} aria-hidden="true" />
        <p
          ref={labelRef}
          className="pointer-events-none absolute bottom-[calc(4%_+_28px)] right-[max(40px,calc((100%_-_1400px)/2))] z-[3] rounded-[4px] bg-night/75 px-2 py-1 font-mono text-[12.5px] text-night-dim"
          aria-hidden="true"
        >
          {MEDIA_LABEL.footage}
        </p>

        {/* The night's words, on the solid part of the scrim. */}
        <div
          ref={copyRef}
          className="pointer-events-none absolute left-[max(40px,calc((100%_-_1400px)/2))] top-[calc(var(--header-h)_+_4vh)] z-[4] w-[min(31vw,560px)] text-night-ink transition-colors duration-[240ms] group-data-[ink=true]/stage:text-ink"
        >
          <h2 id="your-day-title" className="type-h2">
            {NIGHT.title}
          </h2>
          <p className="type-lead mt-[2.2vh] text-night-dim transition-colors duration-[240ms] group-data-[ink=true]/stage:text-graphite">
            {NIGHT.lead}
          </p>
          <div className="mt-[3.4vh]" aria-hidden="true">
            <p className="text-[clamp(26px,2.4vw,38px)] font-[780] leading-[1.06] [--wdth:78]">
              <TextSwap text={beatLine} />
            </p>
            <p
              className={cx(
                "mt-[1.4vh] text-[17px] leading-[1.5] text-night-dim transition-[opacity,color] duration-300 group-data-[ink=true]/stage:text-graphite",
                moment.beat === 2 && "opacity-0",
              )}
            >
              {NIGHT.dropNote}
            </p>
          </div>
        </div>

        <div
          ref={clockRef}
          className="pointer-events-none absolute bottom-[4.5vh] left-[max(40px,calc((100%_-_1400px)/2))] z-[5] origin-top-left will-change-transform"
          aria-hidden="true"
        >
          <ClockFace minutes={NIGHT.dropAt} className="text-[min(190px,19vh)]" />
          <p ref={clockCaptionRef} className="absolute left-0 top-full mt-2 whitespace-nowrap font-mono text-[12.5px] text-night-dim">
            {NIGHT.clockCaption}
          </p>
        </div>

        <div className="absolute right-[max(40px,calc((100%_-_1400px)/2))] top-[calc(var(--header-h)_+_14px)] z-[6] flex items-center gap-2">
          <button type="button" onClick={() => setPaused((p) => !p)} className="btn btn-paper min-h-[44px] px-3 text-[14px] shadow-paper">
            {paused ? <Play aria-hidden="true" size={16} /> : <Pause aria-hidden="true" size={16} />}
            <span>{paused ? LABELS.playVideo : LABELS.pauseVideo}</span>
          </button>
          <a href="#book" className="btn btn-paper min-h-[44px] px-3 text-[14px] shadow-paper">
            {LABELS.skipToBooking}
          </a>
        </div>

        {/* The whole day in reading order, for screen readers (the stage above is a picture of it). */}
        <div className="sr-only">
          <p>
            {clockText(NIGHT.dropAt)}. {NIGHT.dropLine} {NIGHT.dropNote}
          </p>
          <p>
            {clockText(NIGHT.waitAt)}. {NIGHT.waitLine}
          </p>
          <p>{NIGHT.doorLine}</p>
          <h3>{DAY_SHEET.title}</h3>
          <ol>
            {DAY_STEPS.map((s) => (
              <li key={s.id}>
                {s.time}, {DAY_COLUMNS[columnIndex(s.column)].label}: {s.line}
                {s.texts.map((t, i) => (
                  <span key={i}>
                    {" "}
                    {t.from === "you" ? "You" : DAY_SHEET.thread}, {t.time}: {t.body}
                    {t.action ? ` ${t.action}` : ""}
                  </span>
                ))}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
