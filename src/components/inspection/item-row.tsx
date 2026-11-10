"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * An inspection line you answer (spec §11.3): stamp, name, measurement, the exact price, and two
 * equal buttons, "Approve" (blue: your ink) and "Not today" (paper). Never preselected.
 *
 *   Approve   → the exact line goes into the estimate store, approved; a blue tick writes itself
 *               in; the price chip flies (FLIP, 500 ms) to the visible Book button, which now
 *               reads "Book · {total}"; toast "Added to your estimate: {name}, {price}."
 *   Not today → the line leaves the estimate; a pencil note "Remind me in 3 months"; the reminder
 *               toast (on the tire: "Your call. This one we'd fix today…").
 *   Battery   → "Nothing to do".
 *
 * Approval is read back from the estimate store, so removing the line in "Your estimate" un-ticks
 * it here too. "Not today" lives in a tiny local store shared with the thread and the summary.
 */
import { Check } from "lucide-react";
import { useMemo, useRef, useSyncExternalStore } from "react";
import { notify } from "@/components/providers/lazy-toaster";
import { PenTick } from "@/components/ui/pen-tick";
import { Stamp } from "@/components/ui/stamp";
import { LABELS } from "@/data/copy";
import { INSPECTION_COPY, INSPECTION_TOASTS, ITEMS, type InspectionItem, type ItemId } from "@/data/inspection";
import { cx } from "@/lib/cx";
import { money } from "@/lib/pricing";
import { estimate, useEstimateDeferred, useEstimateValue } from "@/lib/stores";

/* ---- "Not today" choices -------------------------------------------------------------------- */

type Flags = Partial<Record<ItemId, true>>;
const NONE: Flags = {};
let declined: Flags = NONE;
const listeners = new Set<() => void>();

function setDeclined(id: ItemId, value: boolean) {
  if (!!declined[id] === value) return;
  const next = { ...declined };
  if (value) next[id] = true;
  else delete next[id];
  declined = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Lines the visitor said "not today" to. */
export function useDeclined(): Flags {
  return useSyncExternalStore(subscribe, () => declined, () => NONE);
}

/** Whether the visitor said "not today" to one line (re-renders only when that one changes). */
function useDeclinedOne(id: ItemId): boolean {
  return useSyncExternalStore(subscribe, () => !!declined[id], () => false);
}

/**
 * Which inspection lines are approved, for the views around the rows (the thread's ticks, the
 * badge). It follows the estimate in a transition, so an Approve tap paints before they update.
 */
export function useApproved(): Partial<Record<ItemId, boolean>> {
  const { lines } = useEstimateDeferred();
  const key = ITEMS.map((item) => (lines.some((l) => l.id === item.job.id && l.approved) ? 1 : 0)).join("");
  return useMemo(() => Object.fromEntries(ITEMS.map((item, i) => [item.id, key[i] === "1"])), [key]);
}

/* ---- the price chip ------------------------------------------------------------------------- */

function visibleBookTarget(): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>("[data-book-target]")) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight) return el;
  }
  return null;
}

/** FLIP a blue price chip from the line's price to the Book button (header or tear-off bar). */
function flyChip(from: HTMLElement, text: string) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const target = visibleBookTarget();
  if (!target || typeof from.animate !== "function") return;
  const a = from.getBoundingClientRect();
  const chip = document.createElement("span");
  chip.textContent = text;
  chip.setAttribute("aria-hidden", "true");
  chip.className =
    "pointer-events-none fixed z-[75] whitespace-nowrap rounded-[6px] bg-blue px-2.5 py-1.5 font-mono text-[15px] font-semibold leading-none text-white shadow-lift";
  chip.style.left = `${a.left + a.width / 2}px`;
  chip.style.top = `${a.top + a.height / 2}px`;
  chip.style.translate = "-50% -50%";
  document.body.appendChild(chip);
  const b = target.getBoundingClientRect();
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const flight = chip.animate(
    [
      { transform: "translate(0, 0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 36}px) scale(0.95)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.6)`, opacity: 0.2 },
    ],
    { duration: 500, easing: "cubic-bezier(.2,.7,.1,1)" },
  );
  const land = () => {
    chip.remove();
    target.animate([{ transform: "scale(1)" }, { transform: "scale(1.05)" }, { transform: "scale(1)" }], {
      duration: 240,
      easing: "ease-out",
    });
  };
  flight.onfinish = land;
  flight.oncancel = () => chip.remove();
}

/** Run `fn` in a fresh task just after the next paint. */
const afterPaint = (fn: () => void) => requestAnimationFrame(() => setTimeout(fn, 0));

/* ---- the row -------------------------------------------------------------------------------- */

function PencilNote() {
  return (
    <p className="pd-pencil relative mt-2 inline-block -rotate-1 text-[15.5px] font-[560] text-graphite [--wdth:84]">
      {INSPECTION_COPY.remindNote}
      <svg aria-hidden="true" className="absolute -bottom-1.5 left-0 h-2 w-full overflow-visible" viewBox="0 0 100 8" preserveAspectRatio="none">
        <path pathLength={1} d="M1 5 C 18 2.5, 38 6.5, 58 4 S 88 3, 99 5" />
      </svg>
    </p>
  );
}

export function ItemRow({
  item,
  compact = false,
  className,
}: {
  item: InspectionItem;
  /** The summary sheet's tighter line. */
  compact?: boolean;
  className?: string;
}) {
  // Primitive reads: a tap re-renders this row (and its twin in the summary), not every row.
  const jobId = item.job.id;
  const approved = useEstimateValue((s) => s.lines.some((l) => l.id === jobId && l.approved));
  const declinedOne = useDeclinedOne(item.id);
  const isDeclined = !approved && declinedOne;
  const priceRef = useRef<HTMLSpanElement>(null);

  const approve = () => {
    if (approved) return;
    estimate.add({ kind: "exact", ...item.job, approved: true, source: "inspection" });
    setDeclined(item.id, false);
    // The tick paints with this interaction; the chip flight and the toast start right after
    // that paint, in their own tasks, so the click itself stays short.
    const from = priceRef.current;
    afterPaint(() => {
      if (from?.isConnected) flyChip(from, money(item.price));
      afterPaint(() => notify(INSPECTION_TOASTS.approved(item)));
    });
  };

  const notToday = () => {
    if (isDeclined) return;
    if (estimate.has(item.job.id)) estimate.remove(item.job.id);
    setDeclined(item.id, true);
    afterPaint(() => notify(INSPECTION_TOASTS.notToday(item)));
  };

  const size = compact ? "sm" : "md";

  return (
    <div className={cx("flex flex-wrap items-center gap-x-5 gap-y-3", className)}>
      <Stamp level={item.rating} seed={item.id} size="sm" className={compact ? "hidden sm:inline-flex" : undefined} />
      <div className="min-w-[12rem] flex-1">
        <p className={cx("text-ink", compact ? "text-[17px] font-bold leading-tight [--wdth:88]" : "type-h3")}>{item.name}</p>
        {!compact && <p className="mono-measure mt-1 text-graphite [text-wrap:balance]">{item.measurement}</p>}
        {isDeclined && <PencilNote />}
      </div>
      <p className="flex items-center gap-1.5">
        <span ref={priceRef} className="mono-price text-ink sm:text-[19px]">
          {money(item.price)}
        </span>
        <span className="inline-grid size-[24px] place-items-center">{approved && <PenTick size={22} />}</span>
      </p>
      {item.noAction ? (
        <p className={cx("inline-flex items-center rounded-[6px] bg-ok-wash px-4 font-semibold text-ok", compact ? "min-h-11" : "min-h-12")}>
          {LABELS.nothingToDo}
        </p>
      ) : (
        <div role="group" aria-label={item.name} className="flex gap-2">
          <button
            type="button"
            aria-pressed={approved}
            onClick={approve}
            className="btn btn-blue min-w-[7.5rem]"
            data-size={size}
          >
            {approved && <Check aria-hidden="true" size={18} strokeWidth={2.6} />}
            {LABELS.approve}
            <span className="sr-only"> {item.name}</span>
          </button>
          <button
            type="button"
            aria-pressed={isDeclined}
            onClick={notToday}
            className={cx(
              "btn btn-paper min-w-[7.5rem]",
              isDeclined ? "shadow-[inset_0_0_0_2px_var(--ink)]" : "shadow-[inset_0_0_0_1.5px_var(--steel)]",
            )}
            data-size={size}
          >
            {LABELS.notToday}
            <span className="sr-only">: {item.name}</span>
          </button>
        </div>
      )}
    </div>
  );
}
