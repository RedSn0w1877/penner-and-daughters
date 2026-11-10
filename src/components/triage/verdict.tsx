"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import type { ReactNode } from "react";
import { CallButton, TextLink } from "@/components/ui/buttons";
import { LineCar } from "@/components/ui/line-car";
import { Stamp } from "@/components/ui/stamp";
import { LABELS } from "@/data/copy";
import { INSPECTION_LINKS, SYMPTOM_BY_ID, ZONES, type Symptom } from "@/data/symptoms";
import { cx } from "@/lib/cx";
import { nextOpening } from "@/lib/slots";
import { booking, symptom, useSymptom } from "@/lib/stores";
import type { Tier } from "@/lib/tier";
import { useMinuteClock } from "@/lib/use-media";
import { ACTION_COPY, MoneyText, ROW_LABELS } from "./symptom-guide-ssr";

export const VERDICT_COPY = {
  title: "Shop's first read",
  empty: "Your answer lands here: how soon to come in, what it usually is and what it usually costs.",
} as const;

const BOOK = "btn btn-blue h-auto min-h-[48px] w-full justify-start py-3 text-left leading-[1.25] whitespace-normal sm:w-auto";
const SECONDARY = "btn btn-paper h-auto min-h-[48px] border-[1.5px] border-ink py-3 text-left leading-[1.25] whitespace-normal";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="type-label">{label}</dt>
      <dd className="mt-0.5 text-[16px] leading-[1.5] text-ink">{children}</dd>
    </div>
  );
}

/** A plain hash link to #book that carries the concern into the booking flow first. */
function BookLink({ s, className, children }: { s: Symptom; className: string; children: ReactNode }) {
  return (
    <a href="#book" className={className} onClick={() => booking.prefill({ concern: s.bookingConcern })}>
      {children}
    </a>
  );
}

function Actions({ s, slot }: { s: Symptom; slot: string | null }) {
  const inspection = s.inspection ? INSPECTION_LINKS[s.inspection] : null;
  const v = s.verdict;
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-rule pt-5">
      {v === "stop-driving" && (
        <>
          <CallButton size="md" className="w-full sm:w-auto" />
          <p className="w-full text-[16px] leading-[1.45] font-semibold text-ink">{ACTION_COPY.tow}</p>
        </>
      )}
      {v === "today" && (
        <>
          <CallButton size="md" className="w-full sm:w-auto" />
          <BookLink s={s} className={SECONDARY}>
            {slot ? ACTION_COPY.bookNext(slot) : LABELS.bookATime}
          </BookLink>
        </>
      )}
      {(v === "this-week" || v === "within-2-weeks") && (
        <>
          <BookLink s={s} className={BOOK}>
            {slot ? ACTION_COPY.bookThis(slot) : LABELS.bookATime}
          </BookLink>
          <CallButton size="md" className="w-full sm:w-auto" />
        </>
      )}
      {v === "when-convenient" && (
        <>
          <BookLink s={s} className={BOOK}>
            {ACTION_COPY.bookWhenever}
          </BookLink>
          <TextLink body={s.smsBody} icon className="py-2 text-[16px]">
            {ACTION_COPY.textQuestion}
          </TextLink>
        </>
      )}
      {v === "normal" && (
        <>
          <button type="button" className={SECONDARY} onClick={() => symptom.clear()}>
            {ACTION_COPY.goodToKnow}
          </button>
          <BookLink s={s} className="text-link px-1 py-2 text-[16px]">
            {ACTION_COPY.bookAnyway}
          </BookLink>
        </>
      )}
      {inspection && (
        <a href={inspection.href} className="text-link w-full py-1.5 text-[16px]">
          {inspection.label}
        </a>
      )}
    </div>
  );
}

/**
 * The answer, with the stamp pressed in (STAMP) and the pencil loop drawn round the zone (INK).
 * `still` (the lite tier): the same answer, already in place.
 */
function Filled({ s, slot, still }: { s: Symptom; slot: string | null; still: boolean }) {
  return (
    <div className={still ? undefined : "animate-[pd-reveal_260ms_var(--ease-slip)_both]"}>
      <Stamp level={s.verdict} animate={!still} size="lg" seed={s.id} />
      <p className="mt-4 text-[22px] leading-[1.2] font-bold text-ink [--wdth:86]">{`“${s.label}”`}</p>
      <dl className="mt-4 grid gap-3.5">
        <Row label={ROW_LABELS.likely}>{s.likely}</Row>
        {s.also && <Row label={ROW_LABELS.also}>{s.also}</Row>}
        <Row label={ROW_LABELS.costs}>
          <MoneyText text={s.costs} />
        </Row>
        <Row label={ROW_LABELS.ifWait}>
          <MoneyText text={s.ifWait} />
        </Row>
      </dl>
      <div className="mt-5">
        <p className="type-label">{ROW_LABELS.where}</p>
        <div data-bob className="mx-auto mt-2 max-w-[340px]">
          <LineCar view="side" zone={s.zone} draw={!still} alt={`A plain sedan, side view, circled at: ${ZONES[s.zone].name}`} />
        </div>
        <p className="mt-1 text-center text-[16px] font-semibold text-ink">{ZONES[s.zone].name}</p>
      </div>
      <Actions s={s} slot={slot} />
    </div>
  );
}

/** Before a pick: one plain sentence over the faint car, not an empty form that reads as loading. */
function Blank() {
  return (
    <div>
      <p className="max-w-[30ch] text-[19px] leading-[1.35] font-semibold text-graphite [--wdth:90]">{VERDICT_COPY.empty}</p>
      <div data-bob aria-hidden="true" className="mx-auto mt-6 max-w-[340px] opacity-50">
        <LineCar view="side" />
      </div>
    </div>
  );
}

/**
 * "Shop's first read": the verdict box. A rubber stamp (shape + word + color), what the customer
 * said in quotes, then most likely, also possible, usually costs, if you wait, and where we'd look
 * first on the line-art car. The actions follow the verdict, and the booking ones name the next
 * opening from the shared appointment book. Changes are announced politely (aria-live).
 */
export function Verdict({ tier }: { tier: Tier }) {
  const state = useSymptom();
  const s = state.id ? SYMPTOM_BY_ID[state.id] : null;
  const now = useMinuteClock();
  const slot = now ? (nextOpening(now)?.label ?? null) : null;

  return (
    <section
      id="triage-verdict"
      tabIndex={-1}
      aria-labelledby="triage-verdict-title"
      className="scroll-mt-[calc(var(--header-h)+16px)] rounded-[2px] border-[1.5px] border-ink bg-paper outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue"
    >
      <header className="flex items-center justify-between gap-3 border-b-[1.5px] border-ink bg-paper-shade px-4 py-2.5 sm:px-5">
        <h3 id="triage-verdict-title" className="text-[16px] font-bold text-ink [--wdth:88]">
          {VERDICT_COPY.title}
        </h3>
      </header>
      <div aria-live="polite" className={cx("px-4 pt-5 pb-6 sm:px-5")}>
        {s ? <Filled key={`${s.id}-${state.seq}`} s={s} slot={slot} still={tier === "lite"} /> : <Blank />}
      </div>
    </section>
  );
}
