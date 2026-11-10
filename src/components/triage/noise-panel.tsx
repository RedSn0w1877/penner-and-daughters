"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { Square, Volume2 } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { LineCar } from "@/components/ui/line-car";
import { LABELS } from "@/data/copy";
import { SYMPTOM_BY_ID, TABS, type Symptom, type SymptomId } from "@/data/symptoms";
import {
  SOUND_CAPTIONS,
  SOUND_DURATION,
  blockedCaption,
  isAvailable,
  play,
  playing as currentSound,
  setHumSpeed,
  stop,
  type SoundId,
} from "@/lib/audio";
import { cx } from "@/lib/cx";
import { useSymptom } from "@/lib/stores";
import { InkCheck, pick } from "./other-panel";
import { SpeedDial } from "./speed-dial";
import { SteeringWheel } from "./steering-wheel";
import type { PanelProps } from "./triage-tool";

export const NOISE_COPY = { bump: "Hit the bump" } as const;

const NOISE = TABS.find((t) => t.id === "noise")!;
const ROWS: readonly Symptom[] = NOISE.groups[0].symptoms.map((id) => SYMPTOM_BY_ID[id]);

/* ---------------------------------------------------------------------------------------------
 * Ink waveforms: one small, honest drawing of each sound's shape (96 × 28), computed once.
 * ------------------------------------------------------------------------------------------- */

const W = 96;
const MID = 14;
function trace(fn: (t: number) => number, samples = 180): string {
  let d = "";
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    d += `${i ? "L" : "M"}${(t * W).toFixed(2)} ${(MID - fn(t) * 11.5).toFixed(2)}`;
  }
  return d;
}
const TAU = Math.PI * 2;
const burst = (t: number, at: number, width: number) => {
  const u = (t - at) / width;
  return u < 0 || u > 1 ? 0 : Math.sin(Math.PI * u);
};

const WAVES: Record<SoundId, string> = {
  // Two close, high tones with a 6 Hz waver.
  squeal: trace((t) => Math.sin(TAU * 21 * t) * (0.62 + 0.24 * Math.sin(TAU * 3 * t))),
  // A rough low band that wobbles.
  grind: trace(
    (t) =>
      (0.5 * Math.sin(TAU * 29 * t) + 0.33 * Math.sin(TAU * 47 * t + 1.3) + 0.22 * Math.sin(TAU * 71 * t + 0.4)) *
      (0.55 + 0.38 * Math.sin(TAU * 4.5 * t)),
    240,
  ),
  // Click, click, click.
  click: trace((t) => [0.16, 0.5, 0.84].reduce((y, at) => y + Math.sin(((t - at) / 0.028) * Math.PI * 3) * burst(t, at, 0.028) * 1.1, 0), 300),
  // A low hum that swells as the speed rises.
  hum: trace((t) => Math.sin(TAU * 2.6 * t) * (0.22 + 0.7 * t)),
  // One dull knock that rings out.
  clunk: trace((t) => (t < 0.14 ? 0 : Math.sin(TAU * 8 * (t - 0.14)) * Math.exp(-(t - 0.14) * 7.5) * 1.05), 220),
  // Short rising chirps.
  chirp: trace(
    (t) => [0.08, 0.36, 0.6, 0.8].reduce((y, at, i) => y + Math.sin(TAU * (26 + 14 * ((t - at) / 0.11)) * t) * burst(t, at, 0.11) * (0.95 - i * 0.14), 0),
    320,
  ),
};

function Wave({ sound, live }: { sound: SoundId; live: boolean }) {
  return (
    <span aria-hidden="true" className="relative block h-7 w-[84px] shrink-0 overflow-hidden">
      <svg viewBox={`0 0 ${W} 28`} preserveAspectRatio="none" className="absolute inset-0 size-full">
        <path
          d={WAVES[sound]}
          fill="none"
          stroke={live ? "var(--blue)" : "var(--ink)"}
          strokeWidth="1.25"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {live && (
        // The playhead crosses the drawing over the sound's own length.
        <span
          className="absolute inset-0 animate-[pd-sweep_var(--sound-s)_linear_both]"
          style={{ "--sound-s": `${SOUND_DURATION[sound]}s` } as CSSProperties}
        >
          <span className="absolute top-0 right-0 h-full w-[2px] bg-blue" />
        </span>
      )}
    </span>
  );
}

/** The 2px "Hit the bump" bob, on every line-art car in the concern sheet that's marked [data-bob]. */
function bob() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.querySelectorAll<HTMLElement>("#whats-wrong [data-bob]").forEach((el) =>
    el.animate?.(
      [
        { transform: "translateY(0)" },
        { transform: "translateY(-2px)", offset: 0.3 },
        { transform: "translateY(1px)", offset: 0.62 },
        { transform: "translateY(0)" },
      ],
      { duration: 460, easing: "ease-out" },
    ),
  );
}

type Caption = { text: string; kind: "playing" | "blocked" | "wheel" };

/**
 * "A noise": six sound keys. Each line is a box to tick (the pick) and a sound key (a small ink
 * waveform and "Hear it"). Sound plays only from a tap, one at a time, at most 2–3 s, with a live
 * caption and a Stop button; where audio can't play, the caption says what it would sound like.
 * Three keys open a helper: the steering wheel (click), the speed dial (hum) and the bump (clunk).
 */
export function NoisePanel({ active, tier }: PanelProps) {
  const { id: chosen } = useSymptom();
  const [open, setOpen] = useState<SymptomId | null>(null);
  const [live, setLive] = useState<SoundId | null>(null);
  const [caption, setCaption] = useState<Caption | null>(null);
  const [mph, setMph] = useState(45);
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Leaving the tab (or the page) stops the sound.
  useEffect(() => {
    if (!active) stop();
  }, [active]);
  useEffect(
    () => () => {
      clearTimeout(wheelTimer.current);
      stop();
    },
    [],
  );

  // Each play gets a token: a new play() ends the previous one (firing its onEnd), and only the
  // latest play's callbacks may change what the panel shows.
  const playToken = useRef(0);
  const start = (sound: SoundId, speed = mph) => {
    const token = ++playToken.current;
    setLive(sound);
    setCaption({ text: SOUND_CAPTIONS[sound], kind: "playing" });
    play(sound, {
      mph: speed,
      onEnd: () => {
        if (playToken.current !== token) return;
        setLive(null);
        setCaption((c) => (c?.kind === "playing" ? null : c));
      },
      onBlocked: (message) => {
        if (playToken.current !== token) return;
        setLive(null);
        setCaption({ text: message, kind: "blocked" });
      },
    });
  };

  const hear = (s: Symptom) => {
    if (!s.sound) return;
    setOpen(s.id);
    start(s.sound);
  };

  const onTurn = () => {
    if (currentSound()) stop();
    clearTimeout(wheelTimer.current);
    setCaption(isAvailable() ? { text: SOUND_CAPTIONS.click, kind: "wheel" } : { text: blockedCaption("click"), kind: "blocked" });
    wheelTimer.current = setTimeout(() => setCaption((c) => (c?.kind === "wheel" ? null : c)), 1400);
  };

  const onSpeed = (next: number, gesture: boolean) => {
    setMph(next);
    if (currentSound() === "hum") setHumSpeed(next);
    else if (gesture) start("hum", next);
  };

  const hitBump = () => {
    start("clunk");
    bob();
  };

  const helper = (s: Symptom) => {
    if (s.interactive === "wheel") return <SteeringWheel onTurn={onTurn} />;
    if (s.interactive === "speed") return <SpeedDial mph={mph} onChange={onSpeed} />;
    if (s.interactive === "bump")
      return (
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <div className="w-[190px]">
            <div data-bob>
              <LineCar view="side" />
            </div>
            <svg viewBox="0 0 190 12" className="-mt-1 block w-full" aria-hidden="true">
              <path d="M0 8 H118 q9 -8 18 0 H190" fill="none" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <button type="button" onClick={hitBump} className="btn btn-paper border-[1.5px] border-ink" data-size="md">
            {NOISE_COPY.bump}
          </button>
        </div>
      );
    return null;
  };

  return (
    <div>
      {/* While there's a caption it rides under the header, so Stop is always in reach. */}
      <div
        className={cx(
          "flex min-h-[52px] flex-wrap items-center gap-x-4 gap-y-2 rounded-[2px] bg-paper-shade px-3.5 py-2",
          caption && "sticky top-[calc(var(--header-h)+8px)] z-10 shadow-paper",
        )}
      >
        <Volume2 aria-hidden="true" size={18} strokeWidth={2.2} className={cx("shrink-0", live ? "text-blue" : "text-steel")} />
        {!caption && <p className="min-w-0 flex-1 text-[16px] leading-[1.4] text-graphite">{NOISE.intro}</p>}
        <p role="status" className={caption ? "min-w-0 flex-1 text-[16px] leading-[1.4] font-semibold text-ink" : "sr-only"}>
          {caption?.text ?? ""}
        </p>
        {live && (
          <button type="button" onClick={() => stop()} className="btn btn-ink ml-auto" data-size="sm">
            <Square aria-hidden="true" size={13} fill="currentColor" strokeWidth={0} />
            {LABELS.stop}
          </button>
        )}
      </div>

      <ul className="mt-4 border-t border-rule">
        {ROWS.map((s) => {
          const isChosen = chosen === s.id;
          const showHelper = Boolean(s.interactive) && (open === s.id || isChosen);
          return (
            <li key={s.id} className="border-b border-rule">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
                <button
                  type="button"
                  aria-pressed={isChosen}
                  onClick={() => pick(s.id)}
                  className="flex min-h-[48px] min-w-[min(100%,14rem)] flex-1 items-center gap-3.5 text-left"
                >
                  <InkCheck checked={isChosen} />
                  <span className={cx("flex-1 text-[17px] leading-[1.35]", isChosen ? "font-bold" : "font-semibold")}>{s.label}</span>
                </button>
                <div className="ml-8 flex items-center gap-3 sm:ml-auto">
                  <Wave sound={s.sound!} live={live === s.sound} />
                  <button
                    type="button"
                    onClick={() => hear(s)}
                    aria-label={`${LABELS.hearIt}: ${s.label}`}
                    className={cx("btn border-[1.5px] px-3.5", live === s.sound ? "btn-blue border-blue" : "btn-paper border-ink")}
                    data-size="sm"
                  >
                    <Volume2 aria-hidden="true" size={17} strokeWidth={2.2} />
                    <span className="text-[16px]">{LABELS.hearIt}</span>
                  </button>
                </div>
              </div>
              {showHelper && (
                <div className={cx("pt-1 pb-5 pl-8", tier !== "lite" && "animate-[pd-reveal_240ms_var(--ease-slip)_both]")}>{helper(s)}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
