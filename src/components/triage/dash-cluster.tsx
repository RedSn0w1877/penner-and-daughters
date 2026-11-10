"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { DASH_LIGHTS, SYMPTOM_BY_ID, TABS, type DashLight, type DashLightId } from "@/data/symptoms";
import { cx } from "@/lib/cx";
import { useSymptom } from "@/lib/stores";
import { useReducedMotion } from "@/lib/tier";
import { useInView } from "@/lib/use-media";
import { pick } from "./other-panel";
import type { PanelProps } from "./triage-tool";

export const DASH_COPY = {
  bulbCheck: "Bulb check: every light on for a moment, like when you turn the key.",
} as const;

const LIGHT = TABS.find((t) => t.id === "light")!;
/* The lamps' own colors: --soon-fill amber, and the warning red (lifted a step so it reads on the dark lens). */
const LAMP_COLOR = { amber: "#F4B43A", red: "#E2402F" } as const;
const BULB_MS = 900;

/** The bulb check happens once per visit, the first time the cluster is seen. */
let bulbChecked = false;

/* In-house ISO-style lamp symbols on a 48 × 48 grid, drawn as ink strokes. */
const SYMBOLS: Record<DashLightId, ReactNode> = {
  cel: (
    <>
      <path d="M8 21h4v-4h6v-3h10v3h4l4 4h3v-3h3v14h-3v-3h-3l-4 5H16l-4-4H8z" />
      <path d="M4 19v12" />
    </>
  ),
  oil: (
    <>
      <path d="M5 20h6v9H5z" />
      <path d="M11 22h4l3-4h7l3 4h3l10-5 1.6 2.2L31 31H11z" />
      <path d="M21 18v-3M18 15h6" />
      <path d="M42.5 26c1.5 2.4 1.5 3.9 0 5-1.5-1.1-1.5-2.6 0-5z" />
    </>
  ),
  battery: (
    <>
      <rect x="7" y="15" width="34" height="22" rx="2.5" />
      <path d="M12 15v-4h6v4M30 15v-4h6v4" />
      <path d="M12 26h6M15 23v6M30 26h6" />
    </>
  ),
  temp: (
    <>
      <path d="M24 7v19" />
      <circle cx="24" cy="30" r="4.2" />
      <path d="M24 11h5M24 16h5M24 21h5" />
      <path d="M7 38c3-2.4 6-2.4 9 0s6 2.4 9 0 6-2.4 9 0 4.5 1.8 7 0" />
    </>
  ),
  brake: (
    <>
      <circle cx="24" cy="24" r="11" />
      <path d="M24 17.5v8.5" />
      <circle cx="24" cy="30.4" r="0.6" />
      <path d="M10 13.5a15.5 15.5 0 0 0 0 21M38 13.5a15.5 15.5 0 0 1 0 21" />
    </>
  ),
  tpms: (
    <>
      <path d="M13 11c-5.6 6.4-5.6 17.6 0 24l1.6 2h18.8l1.6-2c5.6-6.4 5.6-17.6 0-24" />
      <path d="M17 37v3.5M22 37v3.5M26 37v3.5M31 37v3.5" />
      <path d="M24 16.5v9" />
      <circle cx="24" cy="30" r="0.6" />
    </>
  ),
};

/** Four short rays: the "flashing" mark (it also says it when motion is reduced). */
const RAYS = <path d="M5 9 2 6M43 9l3-3M5 39l-3 3M43 39l3 3" />;

/** A decorative ink gauge on each side of the cluster (desktop). */
function Gauge({ label }: { label: string }) {
  const ticks = Array.from({ length: 11 }, (_, i) => {
    const deg = 215 - i * 25;
    const rad = (deg * Math.PI) / 180;
    const r1 = i % 2 ? 50 : 46;
    return `M${(60 + 56 * Math.cos(rad)).toFixed(1)} ${(60 - 56 * Math.sin(rad)).toFixed(1)}L${(60 + r1 * Math.cos(rad)).toFixed(1)} ${(60 - r1 * Math.sin(rad)).toFixed(1)}`;
  }).join("");
  return (
    <svg viewBox="0 0 120 120" className="w-full max-w-[150px]" aria-hidden="true">
      <circle cx="60" cy="60" r="58" fill="none" stroke="var(--ink)" strokeWidth="1.6" />
      <path d={ticks} stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M60 60 30.5 82.5" stroke="var(--graphite)" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="60" cy="60" r="4.5" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.8" />
      <text x="60" y="92" textAnchor="middle" fill="var(--graphite)" style={{ fontFamily: "var(--font-mono)", fontSize: 9 }}>
        {label}
      </text>
    </svg>
  );
}

function Lamp({
  lamp,
  lit,
  selected,
  flashing,
  playState,
  onPick,
}: {
  lamp: DashLight;
  lit: boolean;
  selected: boolean;
  flashing: "loop" | "settle" | null;
  playState: "running" | "paused";
  onPick: () => void;
}) {
  const color = LAMP_COLOR[lamp.color];
  return (
    <button
      type="button"
      aria-label={lamp.name}
      aria-pressed={selected}
      onClick={onPick}
      className={cx(
        "relative grid h-[72px] place-items-center rounded-[14px] border-[1.5px] transition-[border-color,background-color] duration-200",
        selected ? "border-ink bg-paper" : "border-transparent hover:border-rule",
      )}
    >
      <svg viewBox="0 0 48 48" className="size-12 overflow-visible" aria-hidden="true">
        {/* Lit, the lamp's lens goes dark and the symbol glows in its real color (amber reads on ink, not on paper). */}
        {lit && <rect x="-3" y="-3" width="54" height="54" rx="12" fill="var(--ink)" />}
        <g
          className={cx(
            flashing === "loop" && "animate-[pd-flash_667ms_linear_infinite]",
            flashing === "settle" && "animate-[pd-flash_667ms_linear_3]",
          )}
          style={{ animationPlayState: playState }}
        >
          {lit && <circle cx="24" cy="24" r="24" fill={`url(#pd-halo-${lamp.color})`} />}
          <g fill="none" stroke={lit ? color : "var(--graphite)"} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            {SYMBOLS[lamp.id]}
            {selected && flashing && RAYS}
          </g>
        </g>
      </svg>
    </button>
  );
}

/** Steady / flashing, as a two-way radio group (arrow keys move between them). */
function ModeToggle({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: ReadonlyArray<{ id: "steady" | "flashing"; label: string }>;
  value: "steady" | "flashing";
  onChange: (mode: "steady" | "flashing") => void;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    const next = options[(options.findIndex((o) => o.id === value) + 1) % options.length];
    onChange(next.id);
    refs.current[options.indexOf(next)]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={name} onKeyDown={onKeyDown} className="inline-flex rounded-[6px] bg-paper-shade p-1">
      {options.map((o, i) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.id)}
            className={cx(
              "min-h-[40px] rounded-[5px] px-3.5 text-[15px] font-semibold transition-[background-color,color,box-shadow] duration-200",
              on ? "bg-paper text-ink shadow-[0_1px_2px_rgb(18_20_23/0.16),0_0_0_1px_var(--rule)]" : "text-graphite hover:text-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * "A light on the dash": an ink instrument cluster with six ISO-style lamps. The first time it's
 * seen, every lamp lights for 900 ms (the bulb check you get when you turn the key). Tap the one
 * you're seeing and it lights in its real color. The check-engine and tire-pressure lamps have a
 * Steady / Flashing switch; flashing runs at 1.5 Hz (well under three flashes a second) and
 * pauses off-screen.
 */
export function DashCluster({ active, tier }: PanelProps) {
  const state = useSymptom();
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.3 });
  const [bulb, setBulb] = useState(false);

  const current = state.id ? SYMPTOM_BY_ID[state.id] : null;
  const litId = current?.light?.id ?? null;
  const mode = current?.light?.mode ?? "steady";
  const selectedLamp = DASH_LIGHTS.find((l) => l.id === litId) ?? null;

  useEffect(() => {
    if (!active || !inView || bulbChecked || tier === "lite" || reduced) return;
    bulbChecked = true;
    const on = setTimeout(() => setBulb(true), 160);
    const off = setTimeout(() => setBulb(false), 160 + BULB_MS);
    return () => {
      clearTimeout(on);
      clearTimeout(off);
      setBulb(false);
    };
  }, [active, inView, tier, reduced]);

  const choose = (lamp: DashLight, next: "steady" | "flashing" = "steady") =>
    pick(next === "flashing" && lamp.flashing ? lamp.flashing : lamp.steady);

  return (
    <div>
      <p className="text-[16px] leading-[1.4] text-graphite">{LIGHT.intro}</p>
      <p role="status" className="sr-only">
        {bulb ? DASH_COPY.bulbCheck : ""}
      </p>

      {/* Soft halos for a lit lamp: a small radial wash in the lamp's own color, no blur. */}
      <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
        <defs>
          {(["amber", "red"] as const).map((c) => (
            <radialGradient key={c} id={`pd-halo-${c}`}>
              <stop offset="0" stopColor={LAMP_COLOR[c]} stopOpacity="0.42" />
              <stop offset="0.55" stopColor={LAMP_COLOR[c]} stopOpacity="0.16" />
              <stop offset="1" stopColor={LAMP_COLOR[c]} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>
      </svg>

      <div ref={ref} className="mt-4 rounded-[30px] border-[1.5px] border-ink bg-paper px-3 py-4 sm:px-5 sm:py-5">
        <div className="grid items-center gap-3 sm:grid-cols-[1fr_minmax(0,15.5rem)_1fr] sm:gap-4">
          <div className="hidden justify-center sm:flex">
            <Gauge label="mph" />
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {DASH_LIGHTS.map((lamp) => {
              const selected = lamp.id === litId;
              const flashing = selected && mode === "flashing" ? (lamp.id === "tpms" ? "settle" : "loop") : null;
              return (
                <Lamp
                  key={lamp.id}
                  lamp={lamp}
                  lit={selected || bulb}
                  selected={selected}
                  flashing={flashing}
                  playState={inView ? "running" : "paused"}
                  onPick={() => choose(lamp)}
                />
              );
            })}
          </div>
          <div className="hidden justify-center sm:flex">
            <Gauge label="rpm × 1000" />
          </div>
        </div>
      </div>

      <div className="mt-4 flex min-h-[48px] flex-wrap items-center gap-x-4 gap-y-2">
        {selectedLamp ? (
          <>
            <span className="text-[16px] font-semibold text-ink">{selectedLamp.name}</span>
            {selectedLamp.toggle && (
              <ModeToggle
                name={selectedLamp.name}
                value={mode}
                options={[
                  { id: "steady", label: selectedLamp.toggle.steady },
                  { id: "flashing", label: selectedLamp.toggle.flashing },
                ]}
                onChange={(next) => choose(selectedLamp, next)}
              />
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
