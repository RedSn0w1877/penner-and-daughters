// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Texts from the shop, two ways: inline bubbles for the stacked day sheet, and a CSS phone on the
 * desktop day sheet that receives them as the day goes on, with an unread badge (Transitions.dev
 * "Notification badge": it slides in and pops, then clears once the texts have been seen).
 *
 * Shop bubbles are paper-shade with ink; the customer's are ballpoint blue (blue is always you).
 * Server-safe; no hooks (the phone's ThreadScroll is its own client component).
 */
import type { ReactNode } from "react";
import { ThreadScroll } from "@/components/ui/thread-scroll";
import { DAY_SHEET, type DayText } from "@/data/day";
import { SHOP } from "@/lib/facts";
import { cx } from "@/lib/cx";

const STYLES = `
@layer properties, theme, base, components, utilities;
@layer components {
  @keyframes day-bubble-in {
    from { opacity: 0; translate: 0 10px; }
    to { opacity: 1; translate: 0 0; }
  }
  @keyframes day-badge {
    0% { opacity: 0; translate: 10px 0; scale: 0.4; }
    10% { opacity: 1; translate: 0 0; scale: 1.12; }
    16% { scale: 1; }
    78% { opacity: 1; scale: 1; }
    100% { opacity: 0; scale: 0.8; }
  }
  .day-bubble[data-fresh="true"] { animation: day-bubble-in 280ms var(--ease-slip) both; }
  .day-badge { animation: day-badge 2600ms var(--ease-slip) both; }
}`;

function Sender({ text, named }: { text: DayText; named: boolean }) {
  const who = text.from === "you" ? "You" : SHOP.advisor.first;
  return <span className="mt-1 px-1 font-mono text-[11.5px] leading-none text-graphite">{named ? `${who} · ${text.time}` : text.time}</span>;
}

/** One text. `named` prints the sender with the time (the stacked list has no phone header). */
export function TextBubble({
  text,
  named = false,
  fresh = false,
  pending = false,
}: {
  text: DayText;
  named?: boolean;
  fresh?: boolean;
  /** Not arrived yet (the phone): laid out, so arriving moves nothing, but invisible. */
  pending?: boolean;
}) {
  const you = text.from === "you";
  return (
    <li
      className={cx("day-bubble flex max-w-[88%] flex-col", you ? "items-end self-end" : "items-start self-start", pending && "invisible")}
      data-fresh={fresh ? "true" : undefined}
    >
      <span
        className={cx(
          "block rounded-[16px] px-[0.85em] py-[0.55em] text-[15px] leading-[1.38]",
          you ? "rounded-br-[5px] bg-blue text-white" : "rounded-bl-[5px] bg-paper-shade text-ink",
        )}
      >
        {text.body}
        {text.action && (
          // In a real thread this is the shop's pay link (money moving, so blue ink); in the sample it goes nowhere, so it isn't a control.
          <span className="mt-[0.6em] block rounded-[10px] bg-blue px-3 py-[0.55em] text-center text-[14px] font-bold text-white">
            {text.action}
          </span>
        )}
      </span>
      <Sender text={text} named={named} />
    </li>
  );
}

/** Bubbles in a column (the stacked day sheet). */
export function TextList({ texts, className }: { texts: readonly DayText[]; className?: string }) {
  if (!texts.length) return null;
  return (
    <>
      <style href="day-phone" precedence="default">
        {STYLES}
      </style>
      <ol className={cx("flex flex-col gap-3", className)}>
        {texts.map((t, i) => (
          <TextBubble key={i} text={t} named />
        ))}
      </ol>
    </>
  );
}

/**
 * The CSS phone: ink bezel, paper screen, the thread header with the unread badge, newest text at
 * the bottom. Pass `badge` > 0 with a new `badgeKey` each time texts arrive to replay the badge.
 */
export function DayPhone({
  texts,
  shown = texts.length,
  freshFrom = Infinity,
  badge = 0,
  badgeKey,
  footer,
  className,
}: {
  /** Every text of the day, so arriving moves nothing in layout; the first `shown` have arrived. */
  texts: ReadonlyArray<DayText & { key: string }>;
  shown?: number;
  /** Texts at or after this index (and before `shown`) slide in. */
  freshFrom?: number;
  badge?: number;
  badgeKey?: string | number;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "relative flex flex-col overflow-hidden rounded-[28px] border-[10px] border-ink bg-paper shadow-paper",
        className,
      )}
    >
      <style href="day-phone" precedence="default">
        {STYLES}
      </style>
      <span className="mx-auto mt-[6px] block h-[5px] w-[34%] rounded-full bg-rule" aria-hidden="true" />
      <div className="relative border-b border-rule px-4 pb-3 pt-3">
        <p className="pr-8 text-[15px] font-bold leading-tight text-ink [--wdth:90]">{DAY_SHEET.thread}</p>
        <p className="mt-[3px] text-[12.5px] leading-tight text-graphite">{DAY_SHEET.threadMeta}</p>
        {badge > 0 && (
          <span
            key={badgeKey}
            className="day-badge absolute right-3 top-3 grid h-[22px] min-w-[22px] place-items-center rounded-full bg-blue px-[6px] font-mono text-[12px] font-bold text-white"
          >
            {badge}
          </span>
        )}
      </div>
      {/* Reads from the top while short; once it overflows, the newest text stays in view: the list
          slides up (a transform), so a text arriving never shifts the layout. */}
      <ThreadScroll shown={shown}>
        <ol className="flex flex-col gap-3 px-3 pb-4 pt-3">
          {texts.map((t, i) => (
            <TextBubble key={t.key} text={t} fresh={i >= freshFrom && i < shown} pending={i >= shown} />
          ))}
        </ol>
      </ThreadScroll>
      {footer}
    </div>
  );
}
