// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The only progress indicator on the site, and it's determinate: a wheel hub whose five lug nuts
 * are torqued in a star, 1-3-5-2-4, the way Cass does it. Each nut turns 60° and seats 1px, then
 * gets a white paint-pen witness mark (INK); a pencil star traces the order. About 1.1 s from the
 * first nut to the last mark. Pure CSS once data-run flips; reduced motion shows it finished.
 */
import type { CSSProperties } from "react";

/** Positions are numbered clockwise from the top; the star order skips one each time. */
const ORDER = [0, 2, 4, 1, 3] as const;
const NUT_RADIUS = 30;
const LABEL_RADIUS = 56;
const r2 = (n: number) => Math.round(n * 100) / 100;

/** A hex nut, 9.5 across the corners. */
const HEX = Array.from({ length: 6 }, (_, i) => {
  const a = (i * Math.PI) / 3;
  return `${r2(9.5 * Math.cos(a))},${r2(9.5 * Math.sin(a))}`;
}).join(" ");

const NUTS = Array.from({ length: 5 }, (_, pos) => {
  const a = (pos * 72 * Math.PI) / 180;
  const ux = Math.sin(a);
  const uy = -Math.cos(a);
  return {
    pos,
    x: r2(NUT_RADIUS * ux),
    y: r2(NUT_RADIUS * uy),
    ux: r2(ux),
    uy: r2(uy),
    order: ORDER.indexOf(pos as (typeof ORDER)[number]),
  };
});

/** The pencil star: from each nut to the next in the order, then closing back to the first. */
const STAR = ORDER.map((pos, i) => {
  const from = NUTS[ORDER[(i + ORDER.length - 1) % ORDER.length]];
  const to = NUTS[pos];
  // The closing line (back to nut 1) is drawn last, as the fifth mark goes on.
  return { key: pos, d: `M${from.x} ${from.y}L${to.x} ${to.y}`, i: i === 0 ? 4.6 : i };
});

export function LugNutLoader({ run }: { run: boolean }) {
  return (
    <svg
      className="lug"
      viewBox="-70 -70 140 140"
      data-run={run ? "true" : "false"}
      aria-hidden="true"
      focusable="false"
    >
      <circle className="lug-rim" r="64" />
      <circle className="lug-hub" r="47" />
      <g className="lug-star">
        {STAR.map((s) => (
          <path key={s.key} pathLength={1} d={s.d} style={{ "--i": s.i } as CSSProperties} />
        ))}
      </g>
      {NUTS.map((n) => (
        <g
          key={n.pos}
          transform={`translate(${n.x} ${n.y})`}
          style={{ "--i": n.order, "--dx": `${-n.ux}px`, "--dy": `${-n.uy}px` } as CSSProperties}
        >
          <g className="lug-nut-body">
            <polygon points={HEX} />
            <circle className="lug-stud" r="3.4" />
          </g>
          {/* The witness mark runs across the nut and out onto the hub. */}
          <path
            className="lug-mark"
            pathLength={1}
            d={`M${r2(-4 * n.ux)} ${r2(-4 * n.uy)}L${r2(15 * n.ux)} ${r2(15 * n.uy)}`}
          />
        </g>
      ))}
      <circle className="lug-bore" r="13" />
      {NUTS.map((n) => (
        <text
          key={n.pos}
          className="lug-num"
          x={r2(LABEL_RADIUS * n.ux)}
          y={r2(LABEL_RADIUS * n.uy)}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {n.pos + 1}
        </text>
      ))}
    </svg>
  );
}
