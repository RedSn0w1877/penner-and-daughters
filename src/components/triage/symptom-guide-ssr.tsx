// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { Fragment } from "react";
import { TextLink } from "@/components/ui/buttons";
import { Stamp } from "@/components/ui/stamp";
import { LABELS } from "@/data/copy";
import { INSPECTION_LINKS, SYMPTOM_BY_ID, TABS, ZONES, type Symptom } from "@/data/symptoms";
import { SHOP } from "@/lib/facts";

/* ---------------------------------------------------------------------------------------------
 * Copy shared by the server guide and the interactive verdict box.
 * ------------------------------------------------------------------------------------------- */

export const ROW_LABELS = {
  likely: "Most likely",
  also: "Also possible",
  costs: "Usually costs",
  ifWait: "If you wait",
  where: "Where we'd look first",
} as const;

export const ACTION_COPY = {
  tow: "Don't drive it. If it isn't safe to move, we'll help you arrange a tow.",
  bookNext: (slot: string) => `Book the next opening · ${slot}`,
  bookThis: (slot: string) => `Book this · next opening ${slot}`,
  bookWhenever: "Book when it suits you",
  textQuestion: "Text us a question",
  goodToKnow: "Good to know",
  bookAnyway: "Book anyway",
} as const;

/** Dollar figures inside running text (a range like "{low}–{high}", or a single fee), so they can be set in the mono face. */
const MONEY = /(\$\d{1,3}(?:,\d{3})*(?:\.\d\d)?(?:–\$\d{1,3}(?:,\d{3})*(?:\.\d\d)?)?)/;

/** Running text with its dollar figures in the mono face (figures are always mono on this site). */
export function MoneyText({ text }: { text: string }) {
  const parts = text.split(MONEY);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="font-mono text-[0.94em] font-semibold whitespace-nowrap tabular-nums">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/* ---------------------------------------------------------------------------------------------
 * The static tab strip: before the guide upgrades (and with JS off) the four index tabs are
 * plain jump links to their groups below.
 * ------------------------------------------------------------------------------------------- */

export function GuideTabStrip() {
  return (
    <nav aria-label="Symptom groups" className="ptabs" data-variant="index">
      {TABS.map((tab) => (
        <a key={tab.id} href={`#guide-${tab.id}`} className="ptab inline-flex items-center no-underline">
          {tab.label}
        </a>
      ))}
    </nav>
  );
}

/* ---------------------------------------------------------------------------------------------
 * The guide
 * ------------------------------------------------------------------------------------------- */

const BOOK_LINK = "btn btn-blue";

/**
 * The ink Call button, number as live text. (In the guide it repeats thirty times, so it skips the
 * phone icon the full CallButton carries: the same button for a fraction of the HTML.)
 */
function GuideCall() {
  return (
    <a href={SHOP.phone.tel} className="btn btn-ink" data-size="sm">
      {LABELS.call} <span className="btn-num">{SHOP.phone.display}</span>
    </a>
  );
}

/** Verdict actions that work with JS off: tel:, sms: and in-page links only. */
function GuideActions({ s }: { s: Symptom }) {
  const v = s.verdict;
  const inspection = s.inspection ? INSPECTION_LINKS[s.inspection] : null;
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
      {v === "stop-driving" && (
        <>
          <GuideCall />
          <p className="w-full text-[15px] leading-[1.45] font-semibold text-ink">{ACTION_COPY.tow}</p>
        </>
      )}
      {v === "today" && (
        <>
          <GuideCall />
          <a href="#book" className={BOOK_LINK} data-size="sm">
            {LABELS.bookATime}
          </a>
        </>
      )}
      {(v === "this-week" || v === "within-2-weeks") && (
        <>
          <a href="#book" className={BOOK_LINK} data-size="sm">
            {LABELS.bookATime}
          </a>
          <GuideCall />
        </>
      )}
      {v === "when-convenient" && (
        <>
          <a href="#book" className={BOOK_LINK} data-size="sm">
            {ACTION_COPY.bookWhenever}
          </a>
          <TextLink body={s.smsBody} icon>
            {ACTION_COPY.textQuestion}
          </TextLink>
        </>
      )}
      {v === "normal" && (
        <a href="#book" className="text-link text-[16px]">
          {ACTION_COPY.bookAnyway}
        </a>
      )}
      {inspection && (
        <a href={inspection.href} className="text-link text-[16px]">
          {inspection.label}
        </a>
      )}
    </div>
  );
}

function GuideItem({ s }: { s: Symptom }) {
  return (
    <li className="border-b border-rule">
      <details className="group">
        <summary className="flex min-h-[52px] cursor-pointer list-none items-center gap-3 py-2.5 [&::-webkit-details-marker]:hidden">
          <span className="flex flex-1 flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span className="text-[17px] leading-[1.3] font-semibold">{s.label}</span>
            <Stamp level={s.verdict} size="sm" seed={s.id} className="shrink-0" />
          </span>
          <span aria-hidden="true" className="w-4 text-center font-mono text-[20px] leading-none text-graphite transition-transform duration-200 group-open:rotate-45">
            +
          </span>
        </summary>
        {/* The id sits inside the details, so a link to it opens the entry in browsers that reveal fragments. */}
        <div id={`symptom-${s.id}`} className="scroll-mt-[calc(var(--header-h)+64px)] pt-1 pb-5">
          <dl className="grid gap-x-6 gap-y-3 text-[16px] leading-[1.5] sm:grid-cols-[9.5rem_minmax(0,1fr)]">
            <dt className="type-label">{ROW_LABELS.likely}</dt>
            <dd>{s.likely}</dd>
            {s.also && (
              <>
                <dt className="type-label">{ROW_LABELS.also}</dt>
                <dd>{s.also}</dd>
              </>
            )}
            <dt className="type-label">{ROW_LABELS.costs}</dt>
            <dd>
              <MoneyText text={s.costs} />
            </dd>
            <dt className="type-label">{ROW_LABELS.ifWait}</dt>
            <dd>
              <MoneyText text={s.ifWait} />
            </dd>
            <dt className="type-label">{ROW_LABELS.where}</dt>
            <dd>{ZONES[s.zone].name}</dd>
          </dl>
          <GuideActions s={s} />
        </div>
      </details>
    </li>
  );
}

/**
 * The whole symptom guide as server HTML: four groups of collapsible entries, each with its
 * verdict stamp and the full answer (what it usually is, what it costs, what waiting does, where
 * we'd look). This is the no-JS view and what search engines read; after hydration the
 * interactive tool replaces it with the same words.
 */
export function SymptomGuideSSR() {
  return (
    <div className="mt-6">
      {TABS.map((tab) => (
        <section key={tab.id} aria-labelledby={`guide-${tab.id}`} className="mt-9 first:mt-0">
          <h3 id={`guide-${tab.id}`} className="type-h3 scroll-mt-[calc(var(--header-h)+64px)]">
            {tab.label}
          </h3>
          {tab.groups.map((group) => (
            <div key={group.id} className="mt-3">
              {group.label && <h4 className="type-label mt-5 mb-1">{group.label}</h4>}
              <ul className="border-t border-rule">
                {group.symptoms.map((id) => (
                  <GuideItem key={id} s={SYMPTOM_BY_ID[id]} />
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
