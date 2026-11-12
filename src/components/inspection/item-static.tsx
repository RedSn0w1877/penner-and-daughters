// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Pure (hook-free) pieces of the inspection, shared by the server-rendered no-JS markup and the
 * client tiers: the section's few keyframes, callout numbers, the HTML parts list that mirrors
 * every diagram, the static item facts, the lite still and the Previous / Next links.
 */
import type { CSSProperties, ReactNode } from "react";
import { Money } from "@/components/ui/money";
import { Stamp } from "@/components/ui/stamp";
import { LABELS } from "@/data/copy";
import { ITEMS, RATING_TONE, type Callout, type InspectionItem, type Tone } from "@/data/inspection";
import { FRAMES } from "@/data/media";
import { cx } from "@/lib/cx";

/**
 * Keyframes and the leader-line ink for this section (hoisted once into <head> by React).
 * In @layer components so Tailwind utilities still win; global reduced-motion rules apply.
 */
export const INSPECTION_CSS = `
@keyframes pd-msg-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes pd-badge-in{from{opacity:0;transform:translateY(-6px) scale(.7)}70%{opacity:1;transform:translateY(0) scale(1.06)}to{opacity:1;transform:none}}
@keyframes pd-digit{from{opacity:0;transform:translateY(.55em)}to{opacity:1;transform:none}}
@keyframes pd-row-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes pd-modal-in{from{opacity:0;transform:scale(.965)}to{opacity:1;transform:none}}
@keyframes pd-fade-in{from{opacity:0}to{opacity:1}}
@layer components{
.pd-leader{fill:none;stroke:var(--ink);stroke-width:1.25;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;}
.pd-pencil path{fill:none;stroke:var(--graphite);stroke-width:1.6;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;animation:ink-draw 320ms var(--ease-ink) 120ms forwards}
.pd-scroll-lock{overscroll-behavior:contain}
}
`;

export function InspectionStyles() {
  return (
    <style href="pd-inspection-v1" precedence="default">
      {INSPECTION_CSS}
    </style>
  );
}

const DOT_TONE: Record<Tone | "ink", string> = {
  soon: "bg-soon-fill text-ink",
  stop: "bg-stop text-white",
  ok: "bg-ok text-white",
  ink: "bg-ink text-paper",
};

/** The numbered circle used on dots, in the parts list and on the walk-around. */
export function CalloutNumber({
  n,
  tone = "ink",
  size = 22,
  className,
  style,
}: {
  n: number | string;
  tone?: Tone | "ink";
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx("inline-grid flex-none place-items-center rounded-full font-mono font-bold leading-none", DOT_TONE[tone], className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.56), ...style }}
    >
      {n}
    </span>
  );
}

export const calloutTone = (item: InspectionItem, c: Callout): Tone | "ink" => (c.finding ? RATING_TONE[item.rating] : "ink");

/** The HTML parts list that mirrors a diagram's callouts (screen readers always get it). */
export function PartsList({
  item,
  srOnly = false,
  columns = 1,
  className,
}: {
  item: InspectionItem;
  srOnly?: boolean;
  /** 2: pairs flow in two columns (the narrow desktop stage). */
  columns?: 1 | 2;
  className?: string;
}) {
  return (
    <dl
      className={cx(
        srOnly
          ? "sr-only"
          : cx("grid items-baseline gap-x-3", columns === 2 ? "grid-cols-[auto_1fr_auto_1fr] gap-y-1.5" : "grid-cols-[auto_1fr] gap-y-2.5"),
        className,
      )}
    >
      {item.callouts.map((c) => (
        <div key={c.n} className="contents">
          <dt className="flex items-center gap-2 text-[15px] font-semibold leading-snug text-ink">
            <CalloutNumber n={c.n} tone={calloutTone(item, c)} size={20} />
            <span>
              <span className="sr-only">{c.n}. </span>
              {c.label}
            </span>
          </dt>
          <dd className="font-mono text-[14px] leading-snug text-graphite">{c.text}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Diagram title and subtitle. */
export function ItemHeading({ item, as: Tag = "h3", className }: { item: InspectionItem; as?: "h3" | "h4" | "p"; className?: string }) {
  return (
    <div className={className}>
      <Tag className="text-[length:var(--fs-h3)] font-[800] leading-tight text-ink [--wdth:76]">{item.title}</Tag>
      <p className="mt-1.5 max-w-[56ch] text-[16px] leading-snug text-graphite">{item.subtitle}</p>
    </div>
  );
}

/** Stamp, name, measurement and the exact line price, as printed on the inspection sheet. */
export function ItemFacts({ item, children, className }: { item: InspectionItem; children?: ReactNode; className?: string }) {
  return (
    <div className={cx("flex flex-wrap items-start gap-x-5 gap-y-3", className)}>
      <Stamp level={item.rating} seed={item.id} size="sm" className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="type-h3 text-ink">{item.name}</p>
        <p className="mono-measure mt-1 text-graphite [text-wrap:balance]">{item.measurement}</p>
      </div>
      <Money value={item.price} className="mono-price text-ink sm:text-[19px]" />
      {children}
    </div>
  );
}

/** The exploded still (lite and no-JS), framed on the sheet. */
export function ItemStill({ item, overlay, src }: { item: InspectionItem; overlay?: ReactNode; src?: string }) {
  const f = FRAMES[item.part];
  return (
    <div className="relative overflow-hidden rounded-[2px] border border-rule bg-paper" style={{ aspectRatio: `${f.stillWidth} / ${f.stillHeight}` }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static export: plain <img> through withBase() */}
      <img
        src={src ?? f.still}
        alt={`${item.title}. ${item.subtitle}`}
        width={f.stillWidth}
        height={f.stillHeight}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 size-full object-contain"
      />
      {overlay}
    </div>
  );
}

/** "Previous" / "Next" between items (plain hash links: they work without JS). */
export function PrevNext({ item, className }: { item: InspectionItem; className?: string }) {
  const prev = ITEMS[item.n - 2];
  const next = ITEMS[item.n];
  return (
    <nav aria-label={item.name} className={cx("flex items-center justify-between gap-4", className)}>
      {prev ? (
        <a href={`#${prev.domId}`} className="text-link inline-flex min-h-11 items-center">
          {LABELS.previous}
        </a>
      ) : (
        <span />
      )}
      {next ? (
        <a href={`#${next.domId}`} className="text-link inline-flex min-h-11 items-center">
          {LABELS.next}
        </a>
      ) : (
        <span />
      )}
    </nav>
  );
}
