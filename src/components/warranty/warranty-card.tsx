"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The warranty card: card stock with a bevelled edge, a printed double rule and the pantograph.
 *
 *   full tier   tilts up to ±6° toward the pointer and flips over (CSS rotateY, 600 ms) on a click,
 *               a tap or Enter on its button
 *   touch tier  flips on a tap
 *   lite, no JS front and back side by side (the server markup), nothing moves
 *
 * The face you can't see is inert, so focus never lands on a hidden button, and flipping moves
 * focus to the button on the new face.
 */
import { useEffect, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { SHOP, WARRANTY } from "@/lib/facts";
import { useTier } from "@/lib/tier";

const TILT = 6;

const COPY = {
  label: "Warranty",
  flip: "Flip the card",
  flipBack: "Flip back",
  covered: "Covered",
  notCovered: "Not covered",
  claim: "How to claim",
  outOfTown: "Out of town",
} as const;

/** "Call or text {SHOP.phone.display}. We inspect it free." with the number as a tel: link. */
function ClaimLine() {
  const [before, after = ""] = WARRANTY.claim.split(SHOP.phone.display);
  return (
    <>
      {before}
      <a href={SHOP.phone.tel} className="whitespace-nowrap font-mono font-semibold text-ink underline decoration-[1.5px] underline-offset-[3px]">
        {SHOP.phone.display}
      </a>
      {after}
    </>
  );
}

function CardStock({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-[10px] bg-paper p-[clamp(26px,3vw,40px)]",
        // Card stock: a lit top edge, a shaded bottom edge, then the lifted shadow.
        "shadow-[inset_0_1px_0_rgb(255_255_255/0.95),inset_0_-1.5px_0_rgb(18_20_23/0.1),inset_1px_0_0_rgb(255_255_255/0.6),inset_-1px_0_0_rgb(18_20_23/0.06),0_1px_1px_rgb(18_20_23/0.08),0_12px_24px_-12px_rgb(18_20_23/0.3),0_40px_60px_-36px_rgb(18_20_23/0.38)]",
        // The printed double rule just inside the edge.
        "before:pointer-events-none before:absolute before:inset-[10px] before:rounded-[6px] before:border-[1.5px] before:border-ink/75 before:content-['']",
        "after:pointer-events-none after:absolute after:inset-[15px] after:rounded-[4px] after:border after:border-ink/25 after:content-['']",
        className,
      )}
    >
      <span className="pantograph" aria-hidden="true" />
      <div className="relative">{children}</div>
    </div>
  );
}

function Front({ action }: { action?: ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[15px] font-semibold text-graphite">{COPY.label}</p>
        <p className="text-[19px] font-[820] leading-none text-ink [--wdth:74]">{SHOP.shortName}</p>
      </div>
      <p
        className="my-auto pb-2 pt-10 text-[clamp(34px,3.6vw,52px)] font-[900] leading-[0.95] text-ink [--wdth:62]"
        // Pressed into card stock, lit from above: a soft highlight under each stroke, a hairline shade on top.
        style={{ textShadow: "0 1px 0 rgb(255 255 255 / 0.9), 0 -0.5px 0 rgb(18 20 23 / 0.18)" }}
      >
        {WARRANTY.embossed}
      </p>
      <p className="mt-4 max-w-[30ch] text-[17px] font-semibold leading-snug text-ink">{WARRANTY.card}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

function Back({ action }: { action?: ReactNode }) {
  const rows: Array<[string, ReactNode]> = [
    [COPY.covered, WARRANTY.covered],
    [COPY.notCovered, WARRANTY.notCovered],
    [COPY.claim, <ClaimLine key="claim" />],
    [COPY.outOfTown, WARRANTY.outOfTown],
  ];
  return (
    <div className="flex h-full flex-col">
      <dl className="flex flex-col">
        {rows.map(([term, body]) => (
          <div key={term} className="border-b border-dashed border-rule py-[0.7rem] first:pt-0 last:border-b-0">
            <dt className="text-[15px] font-bold leading-tight text-ink [--wdth:90]">{term}</dt>
            <dd className="mt-1 text-[15px] leading-[1.45] text-graphite">{body}</dd>
          </div>
        ))}
      </dl>
      {action && <div className="mt-auto pt-4">{action}</div>}
    </div>
  );
}

export function WarrantyCard({ className }: { className?: string }) {
  const tier = useTier();
  const [flipped, setFlipped] = useState(false);
  const tiltRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const frontButton = useRef<HTMLButtonElement>(null);
  const backButton = useRef<HTMLButtonElement>(null);
  const moved = useRef(false);

  // After a flip, keep focus on the visible face.
  useEffect(() => {
    if (!moved.current) return;
    (flipped ? backButton : frontButton).current?.focus({ preventScroll: true });
  }, [flipped]);

  if (tier === null || tier === "lite") {
    return (
      <div className={cx("grid gap-6 sm:grid-cols-2 lg:grid-cols-1", className)}>
        <CardStock>
          <Front />
        </CardStock>
        <CardStock>
          <Back />
        </CardStock>
      </div>
    );
  }

  const flip = (to: boolean, viaButton: boolean) => {
    moved.current = viaButton;
    setFlipped(to);
  };

  const onCardClick = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest("a, button")) return;
    flip(!flipped, false);
  };

  const onPointerEnter = () => {
    rectRef.current = tiltRef.current?.getBoundingClientRect() ?? null;
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = tiltRef.current;
    const r = rectRef.current;
    if (tier !== "full" || e.pointerType !== "mouse" || !el || !r) return;
    const x = ((e.clientX - r.left) / r.width) * 2 - 1;
    const y = ((e.clientY - r.top) / r.height) * 2 - 1;
    el.style.transform = `rotateX(${(-y * TILT).toFixed(2)}deg) rotateY(${(x * TILT).toFixed(2)}deg)`;
  };
  const onPointerLeave = () => {
    if (tiltRef.current) tiltRef.current.style.transform = "";
  };

  const button = (label: string, to: boolean, ref: typeof frontButton) => (
    <button ref={ref} type="button" className="btn btn-ink" data-size="sm" onClick={() => flip(to, true)}>
      {label}
    </button>
  );

  return (
    <div className={cx("[perspective:1100px]", className)}>
      <div
        ref={tiltRef}
        className="transition-transform duration-200 ease-out [transform-style:preserve-3d] motion-reduce:transition-none"
        onPointerEnter={onPointerEnter}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <div
          className={cx(
            "grid cursor-pointer transition-transform duration-[600ms] ease-slip [transform-style:preserve-3d]",
            flipped && "[transform:rotateY(180deg)]",
          )}
          onClick={onCardClick}
        >
          <div className="[grid-area:1/1] [backface-visibility:hidden] [-webkit-backface-visibility:hidden]" inert={flipped}>
            <CardStock className="h-full">
              <Front action={button(COPY.flip, true, frontButton)} />
            </CardStock>
          </div>
          <div
            className="[grid-area:1/1] [backface-visibility:hidden] [-webkit-backface-visibility:hidden] [transform:rotateY(180deg)]"
            inert={!flipped}
          >
            <CardStock className="h-full">
              <Back action={button(COPY.flipBack, false, backButton)} />
            </CardStock>
          </div>
        </div>
      </div>
    </div>
  );
}
