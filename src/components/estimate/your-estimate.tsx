"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * "Your estimate": a white top sheet over a canary copy (see carbon-peel.tsx), fed by the
 * estimate store. Lines come from the inspection's Approve buttons and the price list's Add
 * buttons; they slide in and out (motion/react, height + opacity), totals roll on odometer drums.
 *
 * Loaded lazily by the estimate drawer after load + idle (or as soon as a line exists), so none of
 * this, motion included, is in the first-load JavaScript. It also owns the printed estimate: a
 * black-and-white, one-page document portalled to <body>, which the print stylesheet shows alone.
 */
import { Printer } from "lucide-react";
import { AnimatePresence, LazyMotion, MotionConfig } from "motion/react";
import * as m from "motion/react-m";
import { ViewTransition, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useScrollTo } from "@/components/providers/smooth-scroll";
import { Odometer } from "@/components/ui/odometer";
import { Sheet } from "@/components/ui/sheet";
import { Stamp } from "@/components/ui/stamp";
import { IMPRINTS } from "@/data/copy";
import { ESTIMATE_COPY } from "@/data/services";
import { COPY, SHOP, WARRANTY } from "@/lib/facts";
import { BIG_BILL, SPLIT_PAY_OVER, laborText, money, moneyRange } from "@/lib/pricing";
import { booking, estimate, useEstimateDeferred, type EstimateLine as Line, type EstimateSnapshot } from "@/lib/stores";
import { useReducedMotion } from "@/lib/tier";
import { CarbonPeel, usePeel, type PeelState } from "./carbon-peel";
import type { EstimateCopy } from "./estimate-drawer";
import { EstimateLine } from "./estimate-line";
import { ESTIMATE_TOTAL_TRANSITION, MoneyText } from "./range-bar";

/** The animation features arrive in their own small chunk (domAnimation only: no layout or drag). */
const loadFeatures = () => import("./motion-features").then((r) => r.default);

const EASE_SLIP = [0.2, 0.7, 0.1, 1] as const;

export function YourEstimate({
  copy,
  onBook,
  still = false,
}: {
  copy: EstimateCopy;
  onBook?: () => void;
  /** The sheet is out of sight (the phone drawer folded or hidden): lines appear without sliding in. */
  still?: boolean;
}) {
  // Follows the store in a transition: the tapped Add or Approve paints first, then the sheet.
  const est = useEstimateDeferred();
  const reduced = useReducedMotion();
  const stackRef = useRef<HTMLDivElement>(null);
  const peel = usePeel(est.allApproved, stackRef, reduced);
  const scrollTo = useScrollTo();

  const bookWithEstimate = () => {
    onBook?.();
    booking.prefill({ estimate: true });
    scrollTo("#book");
  };

  const props = { est, copy, peel, reduced, still, onBook: bookWithEstimate };
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">
        <CarbonPeel
          ref={stackRef}
          state={peel}
          top={<EstimateSheet variant="top" {...props} />}
          copy={<EstimateSheet variant="carbon" {...props} />}
        />
      </MotionConfig>
      {est.count > 0 && createPortal(<PrintedEstimate est={est} />, document.body)}
    </LazyMotion>
  );
}

function EstimateSheet({
  variant,
  est,
  copy,
  peel,
  reduced,
  still,
  onBook,
}: {
  variant: "top" | "carbon";
  est: EstimateSnapshot;
  copy: EstimateCopy;
  peel: PeelState;
  reduced: boolean;
  still: boolean;
  onBook: () => void;
}) {
  const carbon = variant === "carbon";
  // Only the sheet you can see owns the shared transition name (names must be unique on a page).
  const named = carbon ? peel === "peeled" : peel !== "peeled";
  const empty = est.count === 0;
  return (
    <Sheet
      tone={carbon ? "canary" : "paper"}
      pantograph={!carbon}
      imprint={IMPRINTS.estimate}
      slip={false}
      className="est-sheet"
      bodyClassName="est-body"
    >
      <header className="est-head">
        <h3 className="est-title" id={carbon ? undefined : "est-title"} tabIndex={carbon ? undefined : -1}>
          {copy.title}
        </h3>
        <p className={carbon ? "est-copyline" : "est-draft"}>{carbon ? ESTIMATE_COPY.yourCopy : copy.draft}</p>
      </header>

      <div className="est-scroll" data-lenis-prevent="">
        {empty ? (
          <p className="est-empty">{copy.empty}</p>
        ) : carbon ? (
          <ul className="est-lines">
            {est.lines.map((line) => (
              <li key={line.id}>
                <EstimateLine line={line} variant="carbon" />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="est-lines">
            <AnimatePresence initial={false}>
              {est.lines.map((line) => (
                <m.li
                  key={line.id}
                  // Out of sight there's nothing to watch, and measuring height: auto would force a
                  // page layout on the tap that added the line.
                  initial={still ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={reduced ? { duration: 0 } : { duration: 0.28, ease: EASE_SLIP }}
                >
                  <EstimateLine line={line} variant="top" />
                </m.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
        {!empty && <Notes est={est} />}
      </div>

      {!empty && (
        <footer className="est-bottom">
          <Total est={est} named={named} live={!carbon || peel === "peeled"} />
          {peel !== "none" && (
            <span className="est-stamp">
              <Stamp level="approved" animate={!carbon && !reduced} seed="your-estimate" size="lg" />
            </span>
          )}
          <div className="est-actions">
            <button type="button" className="btn btn-blue est-book" data-size="md" onClick={onBook}>
              {ESTIMATE_COPY.bookWith}
            </button>
            <button type="button" className="btn est-print" data-size="sm" onClick={() => window.print()}>
              <Printer aria-hidden="true" size={18} strokeWidth={2.2} />
              <span>{ESTIMATE_COPY.print}</span>
            </button>
            <button
              type="button"
              className="est-clear"
              onClick={() => {
                estimate.clear();
                requestAnimationFrame(() => document.getElementById("est-title")?.focus());
              }}
            >
              {ESTIMATE_COPY.clear}
            </button>
          </div>
        </footer>
      )}
    </Sheet>
  );
}

function totalOf(est: EstimateSnapshot): { label: string; value: string } {
  return est.hasRanges
    ? { label: ESTIMATE_COPY.estimatedTotal, value: moneyRange(est.rangeLow, est.rangeHigh) }
    : { label: ESTIMATE_COPY.total, value: money(est.exactTotal) };
}

function Total({ est, named, live }: { est: EstimateSnapshot; named: boolean; live: boolean }) {
  const { label, value } = totalOf(est);
  const figure: ReactNode = (
    <span className="est-total-fig" data-range={est.hasRanges ? "" : undefined}>
      <Odometer value={value} />
    </span>
  );
  return (
    <div className="est-total" aria-live={live ? "polite" : undefined}>
      <span className="est-total-label">{label}</span>
      {named ? (
        <ViewTransition name={ESTIMATE_TOTAL_TRANSITION} share="auto" default="none">
          {figure}
        </ViewTransition>
      ) : (
        figure
      )}
    </div>
  );
}

/** Past the split-pay line: pay in halves. A big bill: the car-care card. A diagnosis: it's credited. */
function notesFor(est: EstimateSnapshot): string[] {
  const high = est.hasRanges ? est.rangeHigh : est.exactTotal;
  const notes: string[] = [];
  if (high > SPLIT_PAY_OVER) notes.push(ESTIMATE_COPY.splitPay);
  if (high >= BIG_BILL) notes.push(ESTIMATE_COPY.bigBill);
  if (est.lines.some((l) => l.id === "diagnosis")) notes.push(ESTIMATE_COPY.diagCredit);
  return notes;
}

function Notes({ est }: { est: EstimateSnapshot }) {
  const notes = notesFor(est);
  if (!notes.length) return null;
  return (
    <div className="est-notes">
      {notes.map((note) => (
        <p key={note}>
          <MoneyText text={note} />
        </p>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------------------------------
 * The printed estimate: black and white, one page. Letterhead, lines, totals, the warranty
 * sentence and the imprint. Boxes for unapproved lines are left empty for a pen.
 * ------------------------------------------------------------------------------------------- */

function PrintBox({ checked }: { checked: boolean }) {
  return (
    <svg className="epr-box" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="1" y="1" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.3" />
      {checked && (
        <path d="M3.6 8.4c1.2 1 2.4 2.4 3.5 4.2C9 8.6 11.3 5.4 14.6 2.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
      )}
    </svg>
  );
}

function PrintedLine({ line }: { line: Line }) {
  return (
    <section className="epr-line">
      <div className="epr-line-head">
        <h2>{line.name}</h2>
        {line.kind === "flat" && <span className="epr-num">{money(line.total)}</span>}
      </div>
      {line.kind === "exact" && (
        <table className="epr-math">
          <tbody>
            {line.math.parts.map((part, i) => (
              <tr key={i}>
                <td>{part.label}</td>
                <td>{money(part.amount)}</td>
              </tr>
            ))}
            {line.math.hours > 0 && (
              <tr>
                <td>
                  {ESTIMATE_COPY.labor}: {laborText(line.math.hours)}
                  {line.laborNote ? ` (${line.laborNote})` : ""}
                </td>
                <td>{money(line.math.labor)}</td>
              </tr>
            )}
            {line.math.hours > 0 && (
              <tr>
                <td>{ESTIMATE_COPY.supplies}</td>
                <td>{money(line.math.supplies)}</td>
              </tr>
            )}
            {line.math.disposal > 0 && (
              <tr>
                <td>{ESTIMATE_COPY.disposal}</td>
                <td>{money(line.math.disposal)}</td>
              </tr>
            )}
            {line.math.parts.length > 0 && (
              <tr>
                <td>{ESTIMATE_COPY.tax}</td>
                <td>{money(line.math.tax)}</td>
              </tr>
            )}
            <tr className="epr-sum">
              <td>{ESTIMATE_COPY.lineTotal}</td>
              <td>{money(line.math.total)}</td>
            </tr>
          </tbody>
        </table>
      )}
      {line.kind === "range" && (
        <p className="epr-typical">
          {ESTIMATE_COPY.typical(line.low, line.high)}
          {line.vehicle ? ` · ${line.vehicle}` : ""}
        </p>
      )}
      <p className="epr-approve">
        <PrintBox checked={line.approved} />
        {ESTIMATE_COPY.approveLine}
      </p>
    </section>
  );
}

function PrintedEstimate({ est }: { est: EstimateSnapshot }) {
  const { label, value } = totalOf(est);
  return (
    <div className="est-print-root" aria-hidden="true">
      <header className="epr-letterhead">
        <div>
          <p className="epr-shop">{SHOP.letterhead}</p>
          <p className="epr-sub">{SHOP.wordmark.sub}</p>
        </div>
        <div className="epr-nap">
          <p>{SHOP.street}</p>
          <p>{SHOP.town}</p>
          <p>{SHOP.phone.display}</p>
        </div>
      </header>
      <div className="epr-title">
        <h1>{ESTIMATE_COPY.title}</h1>
        <p>{ESTIMATE_COPY.draft}</p>
      </div>
      {est.lines.map((line) => (
        <PrintedLine key={line.id} line={line} />
      ))}
      <div className="epr-total">
        <span>{label}</span>
        <span className="epr-num">{value}</span>
      </div>
      {est.allApproved && <p className="epr-stamp">{ESTIMATE_COPY.approvedStamp}</p>}
      <p className="epr-warranty">{WARRANTY.sentence}</p>
      <p className="epr-imprint">{COPY.printImprint}</p>
    </div>
  );
}
