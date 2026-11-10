"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The review: what you filled in, as a filled-in form; the price line (your estimate's total,
 * the diagnosis fee, or the job's typical range); the two promises; then "Confirm booking",
 * which swaps to "Booking…" and "Booked" while the lug nuts go on. Nothing is sent anywhere.
 */
import { ViewTransition, type ReactNode } from "react";
import { ESTIMATE_TOTAL_TRANSITION, MoneyText } from "@/components/estimate/range-bar";
import { Odometer } from "@/components/ui/odometer";
import { PenTick } from "@/components/ui/pen-tick";
import { TextSwap } from "@/components/ui/text-swap";
import { LABELS } from "@/data/copy";
import { WARRANTY } from "@/lib/facts";
import { LugNutLoader } from "./lug-nut-loader";

export const REVIEW_COPY = {
  approveFirst: "Nothing gets done until you approve it.",
  warranty: `${WARRANTY.short}.`,
  confirm: "Confirm booking",
  booking: "Booking…",
  booked: "Booked",
} as const;

/** Runs of figures in a line of words: "Nov 3", "8:30", "555 000 1234", "2015". */
const FIGURES = /(\$?\d[\d:.,]*(?:[ -]\d[\d:.,]*)*)/;

/**
 * A line of words with its figures in the mono face (figures are always mono on this site; words
 * never are). Anything that isn't a plain string passes through untouched.
 */
export function Figures({ children }: { children: ReactNode }) {
  if (typeof children !== "string") return <>{children}</>;
  const parts = children.split(FIGURES);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="font-mono tabular-nums">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

export interface ReviewRow {
  label: string;
  value: ReactNode;
  note?: string;
}

export type PriceLine =
  | { kind: "total"; label: string; value: string; named: boolean }
  | { kind: "text"; label?: string; text: string };

export type ConfirmPhase = "form" | "booking" | "sealed" | "booked";

function PriceLineView({ price }: { price: PriceLine }) {
  if (price.kind === "total") {
    const figure = (
      <span className="bk-price-fig">
        <Odometer value={price.value} />
      </span>
    );
    return (
      <div className="bk-price">
        <span className="bk-price-label">{price.label}</span>
        {price.named ? (
          <ViewTransition name={ESTIMATE_TOTAL_TRANSITION} share="auto" default="none">
            {figure}
          </ViewTransition>
        ) : (
          figure
        )}
      </div>
    );
  }
  return (
    <p className="bk-price">
      {price.label && <span className="bk-price-label">{price.label}</span>}
      <span>
        <MoneyText text={price.text} />
      </span>
    </p>
  );
}

export function Review({
  rows,
  price,
  phase,
  onConfirm,
  onBack,
}: {
  rows: readonly ReviewRow[];
  price: PriceLine | null;
  phase: ConfirmPhase;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const busy = phase !== "form";
  const status = phase === "booking" ? REVIEW_COPY.booking : busy ? REVIEW_COPY.booked : "";
  return (
    <>
      <dl className="bk-summary" tabIndex={-1} data-step-title="">
        {rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>
              <Figures>{row.value}</Figures>
              {row.note && <small>{row.note}</small>}
            </dd>
          </div>
        ))}
      </dl>
      {price && <PriceLineView price={price} />}
      <ul className="bk-promises">
        <li>
          <PenTick size={20} />
          {REVIEW_COPY.approveFirst}
        </li>
        <li>
          <PenTick size={20} delay={160} />
          {REVIEW_COPY.warranty}
        </li>
      </ul>
      <div className="bk-confirm">
        {!busy && (
          <button type="button" className="btn btn-paper bk-back" data-size="lg" onClick={onBack}>
            {LABELS.back}
          </button>
        )}
        <button
          type="button"
          className="btn btn-blue"
          data-size="lg"
          aria-disabled={busy ? true : undefined}
          onClick={busy ? undefined : onConfirm}
        >
          <TextSwap text={status || REVIEW_COPY.confirm} />
        </button>
        <LugNutLoader run={busy} />
        <p className="sr-only" aria-live="polite">
          {status}
        </p>
      </div>
    </>
  );
}
