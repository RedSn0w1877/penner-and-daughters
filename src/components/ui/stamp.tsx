// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import type { CSSProperties } from "react";
import { VERDICTS, type Verdict } from "@/data/symptom-basics";
import { cx } from "@/lib/cx";

/** Symptom verdicts, inspection results, and the customer's own "APPROVED BY YOU". */
export type StampLevel = Verdict | "fix-now" | "soon" | "good" | "approved";

type Shape = "octagon" | "triangle" | "circle" | "tick";
type Tone = "stop" | "soon" | "ok" | "you";

const FINDINGS: Record<"fix-now" | "soon" | "good" | "approved", { word: string; shape: Shape; tone: Tone }> = {
  "fix-now": { word: "FIX NOW", shape: "octagon", tone: "stop" },
  soon: { word: "SOON", shape: "triangle", tone: "soon" },
  good: { word: "GOOD", shape: "circle", tone: "ok" },
  approved: { word: "APPROVED BY YOU", shape: "tick", tone: "you" },
};

export function stampDef(level: StampLevel): { word: string; shape: Shape; tone: Tone } {
  return level in FINDINGS ? FINDINGS[level as keyof typeof FINDINGS] : VERDICTS[level as Verdict];
}

/** A stable rotation in [−3°, 3°] from a seed, so a stamp lands the same way every render. */
export function stampRotation(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 0x01000193) >>> 0;
  return Math.round(((h % 601) / 100 - 3) * 10) / 10;
}

const SIZES = { sm: 13, md: 15, lg: 20 } as const;

function StampShape({ shape }: { shape: Shape }) {
  switch (shape) {
    case "octagon":
      return (
        <svg className="stamp-shape" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M6.2 1h7.6L19 6.2v7.6L13.8 19H6.2L1 13.8V6.2Z" fill="currentColor" />
          <rect x="5" y="8.7" width="10" height="2.6" rx="0.6" fill="#fff" />
        </svg>
      );
    case "triangle":
      return (
        <svg className="stamp-shape" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 1.8 19 18H1Z" fill="var(--soon-fill)" stroke="var(--ink)" strokeWidth="1.3" strokeLinejoin="round" />
          <rect x="9.05" y="7" width="1.9" height="6" rx="0.95" fill="var(--ink)" />
          <circle cx="10" cy="15.3" r="1.1" fill="var(--ink)" />
        </svg>
      );
    case "circle":
      return (
        <svg className="stamp-shape" viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="8.4" fill="currentColor" />
        </svg>
      );
    default:
      return (
        <svg className="stamp-shape" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M3.4 10.6 8 15.2 16.8 4.8" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

/**
 * A rubber stamp: shape + word + color, never color alone.
 *   red octagon   STOP DRIVING · TODAY · FIX NOW
 *   amber triangle THIS WEEK · WITHIN 2 WEEKS · SOON
 *   green circle   WHEN CONVENIENT · THAT'S NORMAL · GOOD
 *   blue tick      APPROVED BY YOU (the customer's own mark)
 * `animate` plays STAMP (press, then the ink spreads) when it mounts or turns on.
 */
export function Stamp({
  level,
  animate = false,
  seed,
  size = "md",
  label,
  className,
}: {
  level: StampLevel;
  animate?: boolean;
  /** Seeds the ±3° rotation; defaults to the level. Pass a symptom or item id for variety. */
  seed?: string;
  size?: keyof typeof SIZES | number;
  /** Override the word (keep it the same meaning). */
  label?: string;
  className?: string;
}) {
  const def = stampDef(level);
  const px = typeof size === "number" ? size : SIZES[size];
  const style = { "--stamp-rot": `${stampRotation(seed ?? level)}deg`, "--stamp-size": `${px}px` } as CSSProperties;
  return (
    <span className={cx("stamp", className)} data-tone={def.tone} data-animate={animate ? "true" : undefined} style={style}>
      <StampShape shape={def.shape} />
      <span>{label ?? def.word}</span>
    </span>
  );
}
