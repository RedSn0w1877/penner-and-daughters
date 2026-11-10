"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Liquid as LiquidType } from "liquid-gooey";
import { LineCar, useCarZones } from "@/components/ui/line-car";
import { SYMPTOM_BY_ID, TABS, type Ellipse, type Symptom } from "@/data/symptoms";
import { useSymptom } from "@/lib/stores";
import type { Tier } from "@/lib/tier";
import { GroupHeading, OptionRow } from "./other-panel";
import type { PanelProps } from "./triage-tool";

const LEAK = TABS.find((t) => t.id === "leak")!;
const [PUDDLES, SMELLS, SMOKE] = LEAK.groups;

/* ---------------------------------------------------------------------------------------------
 * liquid-gooey loads only on the full tier, when the leak tab opens (it's not in any other chunk).
 * ------------------------------------------------------------------------------------------- */

let gooey: typeof LiquidType | null = null;
let gooeyLoading: Promise<void> | null = null;
const gooeyListeners = new Set<() => void>();
export function loadGooey() {
  gooeyLoading ??= import("liquid-gooey")
    .then((m) => {
      gooey = m.Liquid;
      gooeyListeners.forEach((l) => l());
    })
    .catch(() => {
      gooeyLoading = null;
    });
}
function useGooey() {
  return useSyncExternalStore(
    (l) => {
      gooeyListeners.add(l);
      return () => {
        gooeyListeners.delete(l);
      };
    },
    () => gooey,
    () => null,
  );
}

/* ---------------------------------------------------------------------------------------------
 * Shapes
 * ------------------------------------------------------------------------------------------- */

/** A fluid drop, filled with the puddle's color(s): coolant shows its four possible colors in bands. */
function Drop({ s }: { s: Symptom }) {
  const colors = s.swatch ?? [];
  const id = `pd-drop-${s.id}`;
  return (
    <svg viewBox="0 0 24 24" className="size-7 shrink-0" aria-hidden="true">
      {colors.length > 1 && (
        <defs>
          <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
            {colors.flatMap((c, i) => [
              <stop key={`${i}a`} offset={i / colors.length} stopColor={c} />,
              <stop key={`${i}b`} offset={(i + 1) / colors.length} stopColor={c} />,
            ])}
          </linearGradient>
        </defs>
      )}
      <path
        d="M12 2.6c4.1 5.3 6.6 8.9 6.6 12.3a6.6 6.6 0 0 1-13.2 0c0-3.4 2.5-7 6.6-12.3z"
        fill={colors.length > 1 ? `url(#${id})` : colors[0]}
        stroke="var(--ink)"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A seeded, organic puddle outline around (cx, cy), in the drawing's own units. */
function puddlePath(cx: number, cy: number, rx: number, ry: number, seed: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 0x01000193) >>> 0;
  const rand = () => {
    h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
    return h / 4294967296;
  };
  const n = 11;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k = 0.82 + rand() * 0.32;
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k] as const;
  });
  const mid = (p: readonly [number, number], q: readonly [number, number]) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2] as const;
  const start = mid(pts[n - 1], pts[0]);
  let d = `M${start[0].toFixed(1)} ${start[1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % n]);
    d += `Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
  }
  return `${d}Z`;
}

/** Puddle radii (normalized) from the zone's ellipse: a little wider than where it drips from. */
const puddleSize = (e: Ellipse) => ({ rx: Math.max(e.rx, 0.07) * 1.3, ry: Math.max(e.ry, 0.12) * 1.2 });

/* ---------------------------------------------------------------------------------------------
 * The puddle under the top-view car
 * ------------------------------------------------------------------------------------------- */

/** Touch and lite: an SVG pool that spreads in (touch) or simply sits there (lite). */
function SvgPuddle({ s, e, view, animate }: { s: Symptom; e: Ellipse; view: readonly [number, number]; animate: boolean }) {
  const [w, h] = view;
  const { rx, ry } = puddleSize(e);
  const color = s.swatch![0];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
      <path
        d={puddlePath(e.cx * w, e.cy * h, rx * w, ry * h, s.id)}
        fill={color}
        fillOpacity="0.88"
        stroke="var(--ink)"
        strokeOpacity="0.35"
        strokeWidth={w / 400}
        style={{ transformOrigin: `${e.cx * w}px ${e.cy * h}px` }}
        className={animate ? "animate-[pd-puddle_900ms_var(--ease-slip)_both]" : undefined}
      />
    </svg>
  );
}

/**
 * Full tier: the fluid drips from its zone, four drops land one after another and the goo pulls
 * them into one spreading puddle (liquid-gooey's morph merge), all inside 2 seconds. The library
 * animates with requestAnimationFrame only while something moves, then stops.
 */
function GooeyPuddle({ s, e, Liquid }: { s: Symptom; e: Ellipse; Liquid: typeof LiquidType }) {
  const [landed, setLanded] = useState(false);
  const { rx, ry } = puddleSize(e);
  const color = s.swatch![0];

  useEffect(() => {
    // Mount at the starting pose, then let every item animate to where it lands (40 ms is a couple
    // of frames: long enough for the starting pose to be painted).
    const kick = setTimeout(() => setLanded(true), 40);
    return () => clearTimeout(kick);
  }, []);

  const pct = (n: number) => `${(n * 100).toFixed(2)}%`;
  // Where the drops land, as fractions of the puddle's radii (they end up inside its edge, so the goo joins them).
  const drops = [
    { x: -0.62, y: -0.42, r: 0.034 },
    { x: 0.58, y: -0.5, r: 0.028 },
    { x: -0.3, y: 0.62, r: 0.031 },
    { x: 0.7, y: 0.36, r: 0.026 },
  ];

  return (
    <Liquid
      blur={9}
      contrast={22}
      fill={color}
      shadow="inset 0 0 0 1.5px rgb(18 20 23 / 0.28)"
      aria-hidden="true"
      style={{ position: "absolute", inset: 0 }}
    >
      <Liquid.Item
        scale={landed ? 1 : 0.12}
        transition={{ duration: 1500, ease: "cubic-bezier(.2,.7,.1,1)" }}
        delay={240}
        style={{ position: "absolute", left: pct(e.cx - rx), top: pct(e.cy - ry), width: pct(rx * 2), height: pct(ry * 2) }}
      >
        <div className="size-full rounded-[50%]" />
      </Liquid.Item>
      {drops.map((d, i) => (
        <Liquid.Item
          key={i}
          y={landed ? 0 : -18}
          scale={landed ? 1 : 0}
          transition="bouncy"
          delay={i * 230}
          style={{
            position: "absolute",
            left: pct(e.cx + d.x * rx - d.r),
            top: pct(e.cy + d.y * ry - d.r * 2.2),
            width: pct(d.r * 2),
            aspectRatio: "1",
          }}
        >
          <div className="size-full rounded-full" />
        </Liquid.Item>
      ))}
    </Liquid>
  );
}

function PuddleCar({ s, tier }: { s: Symptom | null; tier: Tier }) {
  const zones = useCarZones();
  const Liquid = useGooey();
  const view = zones.viewBox.top;
  const e = s ? zones.zones[s.zone].top : null;
  return (
    <div className="relative">
      {s && e && (tier === "full" && Liquid ? <GooeyPuddle key={s.id} s={s} e={e} Liquid={Liquid} /> : <SvgPuddle key={s.id} s={s} e={e} view={view} animate={tier !== "lite"} />)}
      <LineCar view="top" className="relative" />
    </div>
  );
}

/**
 * "A leak or smell": what color the puddle is (each choice drips from where it comes from, under
 * the top-view car), what it smells like, and smoke from the tailpipe.
 */
export function LeakPanel({ tier, active }: PanelProps) {
  const { id } = useSymptom();
  const current = id ? SYMPTOM_BY_ID[id] : null;
  const puddle = current?.swatch ? current : null;

  // The goo loads only when the leak tab first opens (or its tab is pointed at or focused, see
  // triage-tool), never at idle on every visit: the full tier only.
  useEffect(() => {
    if (tier === "full" && active) loadGooey();
  }, [tier, active]);

  return (
    <div className="grid gap-9">
      <div>
        <GroupHeading>{PUDDLES.question}</GroupHeading>
        <div className="mt-3 grid gap-x-8 gap-y-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:items-center">
          <div className="md:order-2">
            <PuddleCar s={puddle} tier={tier} />
          </div>
          <ul className="border-t border-rule md:order-1">
            {PUDDLES.symptoms.map((sid) => (
              <OptionRow key={sid} id={sid} lead={<Drop s={SYMPTOM_BY_ID[sid]} />} />
            ))}
          </ul>
        </div>
      </div>
      {[SMELLS, SMOKE].map((group) => (
        <div key={group.id}>
          <GroupHeading>{group.question}</GroupHeading>
          <ul className="mt-2.5 border-t border-rule">
            {group.symptoms.map((sid) => (
              <OptionRow key={sid} id={sid} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
