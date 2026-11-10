// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The corner of Cooper Mill Road and Tanner Street, drawn in ink like a hand-made map on the
 * location sheet. Every labelled feature can be pointed at, tabbed to or tapped, and a graphite
 * pencil loop draws itself around it (INK, the same loop as "Where we'd look first"). Pure SVG and
 * CSS, server-rendered: no script, no map tiles, no coordinates.
 *
 * Feature labels for the roads and the shop come from lib/facts; the rest are map labels.
 */
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { SHOP } from "@/lib/facts";

const STYLES = `
@layer properties, theme, base, components, utilities;
@layer components {
  .lmap text { font-family: var(--font-sans); fill: var(--graphite); }
  .lmap .lm-s { font-size: 17px; font-weight: 600; }
  .lmap .lm-b { font-size: 19px; font-weight: 700; fill: var(--ink); }
  .lmap .lm-shop { font-size: 21px; font-weight: 820; fill: var(--ink); font-variation-settings: "wdth" 76; }
  .lmap .lm-num { font-family: var(--font-mono); font-size: 13px; font-weight: 600; }
  @media (min-width: 1024px) {
    .lmap .lm-s { font-size: 13px; }
    .lmap .lm-b { font-size: 15px; }
    .lmap .lm-shop { font-size: 17px; }
    .lmap .lm-num { font-size: 11px; }
  }
  .lmap .lm-feat { cursor: pointer; outline: none; }
  .lmap .lm-hit { fill: transparent; pointer-events: all; }
  .lmap .lm-loop {
    fill: none; stroke: var(--graphite); stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round;
    opacity: 0; stroke-dasharray: 1; stroke-dashoffset: 1; pointer-events: none;
  }
  .lmap .lm-feat:is(:hover, :focus) .lm-loop { opacity: 1; animation: ink-draw 420ms var(--ease-ink) forwards; }
  .lmap .lm-feat:is(:hover, :focus) text { fill: var(--ink); }
  @media (prefers-reduced-motion: reduce) {
    .lmap .lm-feat:is(:hover, :focus) .lm-loop { animation: none; stroke-dashoffset: 0; }
  }
}`;

/** One and a bit turns around an ellipse with a slight wobble: a pencil circling something. */
function loopPath(cx: number, cy: number, rx: number, ry: number): string {
  const steps = 30;
  const start = -1.9;
  const sweep = Math.PI * 2 + 0.5;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = start + (sweep * i) / steps;
    const w = 1 + 0.04 * Math.sin(t * 3 + 0.7) + (i / steps) * 0.07;
    d += `${i ? "L" : "M"}${Math.round(cx + Math.cos(t) * rx * w)} ${Math.round(cy + Math.sin(t) * ry * w)}`;
  }
  return d;
}

type Box = readonly [number, number, number, number];

/**
 * A labelled, focusable feature with its pencil loop. `loop` = [cx, cy, rx, ry]. Small features
 * inside the shop pass `hit` = [x, y, w, h]: a transparent box covering the label and the marker,
 * as tall as the space between neighbours allows, so a fingertip lands on the right one.
 */
function Feature({ label, loop, hit, children }: { label: string; loop: Box; hit?: Box; children: ReactNode }) {
  const [cx, cy, rx, ry] = loop;
  return (
    <g className="lm-feat" tabIndex={0} role="img" aria-label={label}>
      {hit ? (
        <rect className="lm-hit" x={hit[0]} y={hit[1]} width={hit[2]} height={hit[3]} />
      ) : (
        <ellipse className="lm-hit" cx={cx} cy={cy} rx={rx} ry={ry} />
      )}
      {children}
      <path className="lm-loop" pathLength={1} d={loopPath(cx, cy, rx * 1.08, ry * 1.14)} />
    </g>
  );
}

const INK = "var(--ink)";
const GRAPHITE = "var(--graphite)";
const RULE = "var(--rule)";
const SHADE = "var(--paper-shade)";
const PAPER = "var(--paper)";

/* The creek's centre line; its banks are the same curve, shifted. */
const CREEK = "M0 414 C60 406 110 424 170 416 S280 406 340 416 S450 428 520 414 S590 408 600 412";

export function StreetMap({ className }: { className?: string }) {
  const spaces = [0, 1, 2, 3, 4, 5];
  return (
    <div className={cx("lmap relative", className)}>
      <style href="location-map" precedence="default">
        {STYLES}
      </style>
      <svg viewBox="0 0 600 440" className="block h-auto w-full" role="group" aria-label={`Street map: ${SHOP.road} and ${SHOP.cross}`}>
        <defs>
          <pattern id="lm-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="7" stroke={RULE} strokeWidth="2.2" />
          </pattern>
        </defs>

        {/* Neighbours, for context only. */}
        <g aria-hidden="true" stroke={GRAPHITE} strokeWidth="1.2" fill="url(#lm-hatch)">
          <rect x="30" y="196" width="94" height="104" />
          <rect x="530" y="196" width="70" height="114" />
          <rect x="530" y="18" width="70" height="94" />
          <rect x="30" y="20" width="96" height="70" />
        </g>

        {/* Mill Creek, under the Tanner Street bridge. */}
        <Feature label="Mill Creek" loop={[110, 412, 104, 22]}>
          <path d={CREEK} fill="none" stroke={SHADE} strokeWidth="18" />
          <path d={CREEK} transform="translate(0 -9)" fill="none" stroke={GRAPHITE} strokeWidth="1.3" />
          <path d={CREEK} transform="translate(0 9)" fill="none" stroke={GRAPHITE} strokeWidth="1.3" />
          <text className="lm-s" x="16" y="398">
            Mill Creek
          </text>
        </Feature>

        {/* Cooper Mill Road. */}
        <Feature label={SHOP.road} loop={[130, 152, 122, 30]}>
          <rect x="0" y="130" width="600" height="44" fill={PAPER} />
          <path d="M0 130H470M514 130H600M0 174H470M514 174H600" stroke={INK} strokeWidth="2" />
          {/* The centre line breaks around the road name. */}
          <path d="M226 152H462M522 152H600" stroke={GRAPHITE} strokeWidth="1.4" strokeDasharray="10 8" />
          <text className="lm-b" x="48" y="158">
            {SHOP.road}
          </text>
        </Feature>

        {/* Tanner Street, crossing the road and bridging the creek. */}
        <Feature label={SHOP.cross} loop={[492, 300, 32, 118]}>
          <rect x="470" y="0" width="44" height="440" fill={PAPER} />
          <path d="M470 0V130M470 174V440M514 0V130M514 174V440" stroke={INK} strokeWidth="2" />
          <path d="M492 0V122M492 182V262M492 400V440" stroke={GRAPHITE} strokeWidth="1.4" strokeDasharray="10 8" />
          <path d="M464 398V432M520 398V432" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
          <text className="lm-b" transform="translate(498 330) rotate(-90)" textAnchor="middle">
            {SHOP.cross}
          </text>
        </Feature>

        {/* Route 9 is off the map to the west. */}
        <Feature label="To Route 9" loop={[52, 134, 56, 30]}>
          <path d="M36 152H8M17 143 8 152l9 9" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <text className="lm-s" x="8" y="120">
            To Route 9
          </text>
        </Feature>

        {/* The old grain elevator, across the road. */}
        <Feature label="Grain elevator" loop={[264, 72, 122, 58]}>
          <circle cx="200" cy="66" r="32" fill={SHADE} stroke={INK} strokeWidth="2" />
          <circle cx="270" cy="66" r="32" fill={SHADE} stroke={INK} strokeWidth="2" />
          <circle cx="200" cy="66" r="9" fill="none" stroke={GRAPHITE} strokeWidth="1.2" />
          <circle cx="270" cy="66" r="9" fill="none" stroke={GRAPHITE} strokeWidth="1.2" />
          <rect x="316" y="30" width="56" height="74" fill={PAPER} stroke={INK} strokeWidth="2" />
          <path d="M316 44 270 34 200 34" fill="none" stroke={GRAPHITE} strokeWidth="1.3" />
          <text className="lm-s" x="264" y="124" textAnchor="middle">
            Grain elevator
          </text>
        </Feature>

        {/* The shop. */}
        <Feature label={SHOP.shortName} loop={[270, 278, 140, 98]}>
          <rect x="150" y="196" width="240" height="164" fill={PAPER} stroke={INK} strokeWidth="2.6" />
          <path d="M300 210V346" stroke={RULE} strokeWidth="1.2" strokeDasharray="5 5" />
          <text className="lm-shop" x="270" y="344" textAnchor="middle">
            {SHOP.shortName}
          </text>
        </Feature>

        {/* Parking 1–6 on the Tanner Street side. */}
        <Feature label="Parking 1–6" loop={[431, 282, 44, 104]}>
          <rect x="396" y="196" width="70" height="164" fill={PAPER} stroke={GRAPHITE} strokeWidth="1.2" strokeDasharray="4 4" />
          {spaces.slice(1).map((i) => (
            <path key={i} d={`M406 ${196 + i * 27.33}H466`} stroke={GRAPHITE} strokeWidth="1.2" />
          ))}
          {spaces.map((i) => (
            <text key={i} className="lm-num" x="436" y={196 + i * 27.33 + 18} textAnchor="middle">
              {i + 1}
            </text>
          ))}
          <text className="lm-s" x="466" y="382" textAnchor="end">
            Parking 1–6
          </text>
        </Feature>

        {/* The two bays face Cooper Mill Road. */}
        <Feature label="Bay 1" loop={[207, 190, 44, 18]} hit={[156, 156, 94, 50]}>
          <path d="M172 196H242" stroke={GRAPHITE} strokeWidth="6" />
          <path d="M172 190V202M242 190V202" stroke={INK} strokeWidth="1.6" />
          <text className="lm-s" x="207" y="190" textAnchor="middle">
            Bay 1
          </text>
        </Feature>
        <Feature label="Bay 2" loop={[293, 190, 44, 18]} hit={[250, 156, 94, 50]}>
          <path d="M258 196H328" stroke={GRAPHITE} strokeWidth="6" />
          <path d="M258 190V202M328 190V202" stroke={INK} strokeWidth="1.6" />
          <text className="lm-s" x="293" y="190" textAnchor="middle">
            Bay 2
          </text>
        </Feature>

        {/* On the parking side: the pickup boxes, the key slot, then the blue office door. */}
        <Feature label="Pickup boxes" loop={[392, 229, 20, 26]} hit={[262, 206, 148, 42]}>
          {[212, 224, 236].map((y) => (
            <rect key={y} x="390" y={y} width="9" height="10" fill={SHADE} stroke={INK} strokeWidth="1.4" />
          ))}
          <text className="lm-s" x="380" y="234" textAnchor="end">
            Pickup boxes
          </text>
        </Feature>
        <Feature label="Key drop" loop={[392, 263, 16, 13]} hit={[290, 248, 120, 30]}>
          <rect x="390" y="258" width="8" height="9" fill="var(--steel)" stroke={INK} strokeWidth="1.4" />
          <text className="lm-s" x="380" y="267" textAnchor="end">
            Key drop
          </text>
        </Feature>
        <Feature label="Office (blue door)" loop={[390, 292, 18, 24]} hit={[218, 278, 192, 40]}>
          <path d="M390 278V306" stroke="var(--blue)" strokeWidth="6" />
          <text className="lm-s" x="380" y="298" textAnchor="end">
            Office (blue door)
          </text>
        </Feature>
      </svg>
    </div>
  );
}
