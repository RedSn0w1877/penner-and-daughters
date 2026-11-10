// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { CallButton } from "@/components/ui/buttons";
import { PULL_OVER, USUALLY_NORMAL } from "@/data/symptoms";
import { cx } from "@/lib/cx";

export const SAFETY_COPY = {
  pullOver: "Pull over and call if you see:",
  normal: "Usually nothing to fix:",
} as const;

/** Shape + word, never color alone: a red octagon for "pull over", a green circle for "nothing to fix". */
function Mark({ kind }: { kind: "stop" | "ok" }) {
  return kind === "stop" ? (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-[18px] shrink-0 text-stop">
      <path d="M6.2 1h7.6L19 6.2v7.6L13.8 19H6.2L1 13.8V6.2Z" fill="currentColor" />
      <rect x="5" y="8.7" width="10" height="2.6" rx="0.6" fill="#fff" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-[18px] shrink-0 text-ok">
      <circle cx="10" cy="10" r="8.4" fill="currentColor" />
    </svg>
  );
}

function List({
  items,
  from,
}: {
  items: ReadonlyArray<{ label: string; symptom: string }>;
  from: "pull-over" | "normal-list";
}) {
  return (
    <ul className="mt-3 border-t border-rule">
      {items.map((item) => (
        <li key={item.label} className="border-b border-rule">
          {/* With JS the triage tool opens the symptom; without it this jumps to the entry in the guide. */}
          <a
            href={`#symptom-${item.symptom}`}
            data-symptom={item.symptom}
            data-from={from}
            className="group flex min-h-[48px] items-center justify-between gap-4 py-2.5 text-[16px] leading-[1.4] text-ink no-underline"
          >
            <span className="underline decoration-rule decoration-[1.5px] underline-offset-[5px] transition-colors group-hover:decoration-ink">
              {item.label}
            </span>
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="size-4 shrink-0 text-graphite transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2.5 8h10M9 4.2 12.8 8 9 11.8" />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * Under the concern sheet, a paper-shade strip: what means "pull over and call", and the three
 * things that are usually nothing at all. Every item opens its symptom.
 */
export function SafetyLists({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        "grid gap-x-12 gap-y-8 rounded-[2px] bg-paper-shade px-[18px] py-6 shadow-paper sm:px-8 sm:py-8 lg:grid-cols-2 lg:px-12",
        className,
      )}
    >
      <div>
        <h3 className="flex items-center gap-2.5 text-[18px] leading-[1.3] font-bold [--wdth:88]">
          <Mark kind="stop" />
          {SAFETY_COPY.pullOver}
        </h3>
        <List items={PULL_OVER} from="pull-over" />
        <CallButton size="md" className="mt-5" />
      </div>
      <div>
        <h3 className="flex items-center gap-2.5 text-[18px] leading-[1.3] font-bold [--wdth:88]">
          <Mark kind="ok" />
          {SAFETY_COPY.normal}
        </h3>
        <List items={USUALLY_NORMAL} from="normal-list" />
      </div>
    </div>
  );
}
