"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The appointment book: four short steps ("What's going on" · "How you'll get here" · "Pick a
 * time" · "Your details"), a last look before confirming, the lug-nut loader, the canary confirmation slip and one
 * burst of paper-punch confetti.
 *
 * - Steps slide side by side in a View Transition (types bk-forward / bk-back / bk-done; CSS in
 *   booking.css). It's started directly with flushSync rather than through a React transition,
 *   so a step change never waits behind other pending transitions on the page (lazy chunks still
 *   loading), and Next always answers within a frame. Lite tier and reduced motion swap instantly.
 * - What the visitor carried in (a symptom, "Book with this estimate", "Book a night drop")
 *   arrives through the booking store and resets the book to step one with that chip chosen.
 * - The draft lives in this tab's sessionStorage (every access in try/catch), never in the URL.
 * - Confirming makes no network request: canvas-confetti is fetched when the review opens, so
 *   the burst plays from memory, and the .ics is a Blob.
 */
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { useScrollTo } from "@/components/providers/smooth-scroll";
import { PenTick } from "@/components/ui/pen-tick";
import { LABELS } from "@/data/copy";
import { BOOKING_CONCERNS, BOOKING_COPY, ESTIMATE_COPY, SERVICE_BY_ID, priceText } from "@/data/services";
import { SYMPTOMS } from "@/data/symptoms";
import { ARRIVALS, SHOP, type Arrival } from "@/lib/facts";
import { dayLabel, hoursFor, zonedDate } from "@/lib/hours";
import { money, moneyRange } from "@/lib/pricing";
import { isBookable, slotsFor } from "@/lib/slots";
import { useBooking, useEstimateDeferred, type BookingState, type EstimateSnapshot } from "@/lib/stores";
import { useReducedMotion, useTier } from "@/lib/tier";
import { useMinuteClock } from "@/lib/use-media";
import { ConfirmationSlip, type BookedSlip } from "./confirmation-slip";
import { Review, type ConfirmPhase, type PriceLine, type ReviewRow } from "./review";
import { StepArrival } from "./step-arrival";
import { StepConcern, type ConcernOption } from "./step-concern";
import { REQUIRED_ORDER, StepDetails, validateDetails, type Details } from "./step-details";
import { NIGHT_KEYS, StepTime, nightDropDays } from "./step-time";

export const STEP_TITLES = ["What's going on", "How you'll get here", "Pick a time", "Your details"] as const;

/** The verdict-box label, reused for a carried symptom's price line. */
const COSTS_LABEL = "Usually costs";

/** "Use my estimate (total)". (Aliased: the data's "use…" name reads like a React hook to the linter.) */
const estimateChipLabel = BOOKING_COPY.useEstimate;

/** 0–3 are the steps; 4 is the review. */
type Step = 0 | 1 | 2 | 3 | 4;

interface Draft extends Details {
  v: 1;
  step: Step;
  /** A BOOKING_CONCERNS id, "estimate" (your estimate) or "carried" (the carried symptom). */
  concern: string | null;
  /** The symptom label carried in from the guide. */
  carried: string | null;
  arrival: Arrival | null;
  /** Night key drop: the morning we start ("2026-11-03"). */
  day: string | null;
  /** Any other arrival: the slot id ("2026-11-03T08:30"). */
  slot: string | null;
}

const EMPTY: Draft = {
  v: 1,
  step: 0,
  concern: null,
  carried: null,
  arrival: null,
  day: null,
  slot: null,
  name: "",
  mobile: "",
  vehicle: "",
  notes: "",
};

/** How long the lug nuts take, then a beat on "Booked" before the slip. */
const LOADER_MS = 1150;
const SEALED_MS = 520;

type StepTransition = "bk-forward" | "bk-back" | "bk-done";

/** Typed view transitions (Chrome 125+, Safari 18+). Older engines just swap the step. */
function canTypeTransitions(): boolean {
  return (
    typeof document !== "undefined" &&
    "startViewTransition" in document &&
    typeof ViewTransition !== "undefined" &&
    "types" in ViewTransition.prototype
  );
}

/**
 * Page side-by-side: the step panel is named only for the length of the transition (data-vt on
 * the stage), so it never joins any other view transition on the page.
 */
function slideStep(stage: HTMLElement | null, type: StepTransition, update: () => void): void {
  if (!stage || !canTypeTransitions()) {
    update();
    return;
  }
  stage.dataset.vt = type;
  const done = () => {
    if (stage.dataset.vt === type) delete stage.dataset.vt;
  };
  try {
    const vt = document.startViewTransition({ update: () => flushSync(update), types: [type] });
    vt.finished.then(done, done);
  } catch {
    done();
    update();
  }
}

/* ---------------------------------------------------------------------------------------------
 * The draft, in this tab's session storage (the privacy page promises exactly this)
 * ------------------------------------------------------------------------------------------- */

const STORAGE_KEY = "pd-booking-draft-v1";

function sanitize(raw: unknown): Draft | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.v !== 1) return null;
  const text = (k: string, max = 600) => (typeof r[k] === "string" ? (r[k] as string).slice(0, max) : "");
  const id = (k: string) => (typeof r[k] === "string" ? (r[k] as string).slice(0, 200) : null);
  const step = typeof r.step === "number" && r.step >= 0 && r.step <= 4 ? (Math.floor(r.step) as Step) : 0;
  const arrival = ARRIVALS.find((a) => a.id === r.arrival)?.id ?? null;
  return {
    v: 1,
    step,
    concern: id("concern"),
    carried: id("carried"),
    arrival,
    day: id("day"),
    slot: id("slot"),
    name: text("name", 120),
    mobile: text("mobile", 120),
    vehicle: text("vehicle", 120),
    notes: text("notes"),
  };
}

function readDraft(): Draft | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? sanitize(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function isBlank(d: Draft): boolean {
  return !(d.concern || d.carried || d.arrival || d.day || d.slot || d.name || d.mobile || d.vehicle || d.notes);
}

function writeDraft(d: Draft): void {
  try {
    if (isBlank(d)) window.sessionStorage.removeItem(STORAGE_KEY);
    else window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {
    // Storage blocked (private mode, a strict browser): the book still works, it just won't survive a reload.
  }
}

function clearDraft(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}

/* ---------------------------------------------------------------------------------------------
 * Carried in from elsewhere on the page
 * ------------------------------------------------------------------------------------------- */

function applyPrefill(d: Draft, now: BookingState, before: BookingState | null): Draft {
  const next: Draft = { ...d, step: 0 };
  if (now.concern) next.carried = now.concern;
  const estimateIsNew = now.estimate && !before?.estimate;
  const concernIsNew = Boolean(now.concern) && now.concern !== before?.concern;
  if (estimateIsNew) next.concern = "estimate";
  else if (concernIsNew) next.concern = "carried";
  else if (now.estimate) next.concern = "estimate";
  else if (now.concern) next.concern = "carried";
  if (now.arrival && now.arrival !== d.arrival) {
    next.arrival = now.arrival;
    next.day = null;
    next.slot = null;
  }
  return next;
}

/* ---------------------------------------------------------------------------------------------
 * Confetti: one burst of paper-punch dots, fetched ahead of time so confirming fetches nothing
 * ------------------------------------------------------------------------------------------- */

const loadConfetti = () => import("canvas-confetti");
type ConfettiModule = Awaited<ReturnType<typeof loadConfetti>>;
let confettiModule: ConfettiModule | null = null;
let confettiRequested = false;

function preloadConfetti(): void {
  if (confettiRequested) return;
  confettiRequested = true;
  loadConfetti()
    .then((m) => {
      confettiModule = m;
    })
    .catch(() => {
      confettiRequested = false;
    });
}

function burst(from: Element | null): void {
  const confetti = confettiModule?.default;
  if (!confetti || !from) return;
  const css = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  const canvas = document.createElement("canvas");
  canvas.className = "bk-confetti";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  const fire = confetti.create(canvas, { resize: true, useWorker: false, disableForReducedMotion: true });
  const box = from.getBoundingClientRect();
  const done = fire({
    particleCount: 60,
    spread: 76,
    startVelocity: 30,
    gravity: 1.05,
    decay: 0.91,
    ticks: 160,
    scalar: 0.8,
    shapes: ["circle"],
    colors: [
      token("--canary", "#fbf1b8"),
      token("--pink", "#f7d6dc"),
      token("--blue", "#1b44a3"),
      token("--graphite", "#4b525a"),
      token("--paper", "#fcfbf7"),
    ],
    origin: {
      x: (box.left + box.width / 2) / window.innerWidth,
      y: Math.min(0.9, Math.max(0.08, (box.top + 30) / window.innerHeight)),
    },
  });
  const cleanup = () => {
    fire.reset();
    canvas.remove();
  };
  if (done) void done.then(cleanup);
  else setTimeout(cleanup, 4000);
}

/* ---------------------------------------------------------------------------------------------
 * Price line on the review
 * ------------------------------------------------------------------------------------------- */

function priceLineFor(draft: Draft, est: EstimateSnapshot, named: boolean): PriceLine | null {
  if (draft.concern === "estimate") {
    if (est.count === 0) return null;
    return est.hasRanges
      ? { kind: "total", label: ESTIMATE_COPY.estimatedTotal, value: moneyRange(est.rangeLow, est.rangeHigh), named }
      : { kind: "total", label: ESTIMATE_COPY.total, value: money(est.exactTotal), named };
  }
  if (draft.concern === "carried") {
    const symptom = SYMPTOMS.find((s) => s.bookingConcern === draft.carried);
    return symptom ? { kind: "text", label: COSTS_LABEL, text: symptom.costs } : null;
  }
  const serviceId = BOOKING_CONCERNS.find((c) => c.id === draft.concern)?.service;
  if (!serviceId) return null;
  if (serviceId === "diagnosis") return { kind: "text", text: BOOKING_COPY.diagnosisReview };
  const service = SERVICE_BY_ID[serviceId];
  return service.price.kind === "range"
    ? { kind: "text", label: service.name, text: ESTIMATE_COPY.typical(service.price.low, service.price.high) }
    : { kind: "text", label: service.name, text: priceText(service) };
}

/* ---------------------------------------------------------------------------------------------
 * The flow
 * ------------------------------------------------------------------------------------------- */

const subscribeNever = () => () => {};

export function BookingFlow({ variant = "section" }: { variant?: "section" | "page" }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const titleId = (i: number) => `bk${uid}-step${i}`;
  const formId = `bk${uid}-details`;
  const page = variant === "page";

  const tier = useTier();
  const reduced = useReducedMotion();
  const est = useEstimateDeferred();
  const carried = useBooking();
  const now = useMinuteClock();
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  const scrollTo = useScrollTo();
  const stageRef = useRef<HTMLDivElement>(null);
  const focusNext = useRef(false);
  const burstDone = useRef(false);

  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [restored, setRestored] = useState(false);
  const [applied, setApplied] = useState<BookingState | null>(null);
  const [phase, setPhase] = useState<ConfirmPhase>("form");
  const [booked, setBooked] = useState<BookedSlip | null>(null);
  const [attempted, setAttempted] = useState(false);

  // After hydration, pick the draft back up from this tab.
  if (hydrated && !restored) {
    setRestored(true);
    const saved = readDraft();
    if (saved) setDraft(saved);
  }

  // Something was carried in: back to step one with it chosen.
  if (carried.seq > 0 && carried.seq !== applied?.seq) {
    setApplied(carried);
    setDraft((d) => applyPrefill(d, carried, applied));
    setPhase("form");
    setBooked(null);
  }

  const lite = tier === "lite" || reduced;

  /* ---- What's chosen, and what's valid ---- */

  const estimateFigure =
    est.count === 0 ? null : est.hasRanges ? moneyRange(est.rangeLow, est.rangeHigh) : money(est.exactTotal);
  const options: ConcernOption[] = [];
  if (estimateFigure) {
    options.push({
      id: "estimate",
      // "Use my estimate (…)": the template takes one amount; a range slots into the same place.
      label: estimateChipLabel(est.exactTotal).replace(money(est.exactTotal), estimateFigure),
      carried: true,
      figure: { text: estimateFigure, named: page },
    });
  }
  if (draft.carried) options.push({ id: "carried", label: draft.carried, carried: true });
  for (const c of BOOKING_CONCERNS) options.push({ id: c.id, label: c.label });
  const concernLabel = options.find((o) => o.id === draft.concern)?.label ?? null;

  const slot = useMemo(
    () => (draft.slot ? (slotsFor(draft.slot.slice(0, 10)).find((s) => s.id === draft.slot) ?? null) : null),
    [draft.slot],
  );
  const nightDays = useMemo(() => (now ? nightDropDays(now) : []), [now]);
  const nightDrop = draft.arrival === "nightdrop";
  const slotOk =
    !!slot && !!now && isBookable(slot, now) && (draft.arrival !== "wait" || slot.time <= SHOP.slots.waitWithUsLast);
  const dayOk = !!draft.day && nightDays.some((d) => d.key === draft.day);
  const errors = validateDetails(draft);
  const valid = [
    concernLabel !== null,
    draft.arrival !== null,
    nightDrop ? dayOk : slotOk,
    Object.keys(errors).length === 0,
  ];
  const firstInvalid = valid.indexOf(false);
  // A stale draft (an old slot, an emptied estimate) lands on the first step that needs you.
  const current = Math.min(draft.step, firstInvalid === -1 ? 4 : firstInvalid) as Step;
  const reachable = (i: number) => valid.slice(0, i).every(Boolean);

  const arrivalLabel = ARRIVALS.find((a) => a.id === draft.arrival)?.label ?? "";
  const whenLabel = nightDrop
    ? draft.day
      ? dayLabel(draft.day)
      : ""
    : slot
      ? `${dayLabel(slot.id.slice(0, 10))} · ${slot.label}`
      : "";
  const firstName = draft.name.trim().split(/\s+/)[0] ?? "";

  /* ---- Moving between steps ---- */

  const commit = (update: () => void, type: StepTransition) => {
    focusNext.current = true;
    if (lite) update();
    else slideStep(stageRef.current, type, update);
  };

  const go = (next: Step) => {
    if (next === current || phase !== "form") return;
    commit(() => setDraft((d) => ({ ...d, step: next })), next > current ? "bk-forward" : "bk-back");
  };

  const edit = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const submitDetails = () => {
    const first = REQUIRED_ORDER.find((k) => errors[k]);
    if (first) {
      setAttempted(true);
      requestAnimationFrame(() => document.getElementById(`${formId}-${first}`)?.focus());
      return;
    }
    go(4);
  };

  const confirm = () => {
    if (phase !== "form" || firstInvalid !== -1) return;
    let start: Date | null = null;
    if (nightDrop && draft.day) {
      const hours = hoursFor(draft.day);
      if (hours) start = zonedDate(draft.day, hours.open);
    } else if (slot) {
      start = slot.start;
    }
    if (!start) return;
    setBooked({ start: start.getTime(), when: whenLabel, arrival: arrivalLabel, nightDrop });
    setPhase("booking");
    clearDraft();
  };

  const another = () => {
    burstDone.current = false;
    commit(() => {
      setPhase("form");
      setBooked(null);
      setAttempted(false);
      // A new booking, same driver: keep the name, number and car.
      setDraft((d) => ({ ...EMPTY, name: d.name, mobile: d.mobile, vehicle: d.vehicle }));
    }, "bk-back");
  };

  /* ---- Effects ---- */

  // Keep the draft in this tab while the book is open.
  useEffect(() => {
    if (!restored || phase !== "form") return;
    writeDraft(draft);
  }, [draft, restored, phase]);

  // Booking… → Booked → the slip.
  useEffect(() => {
    if (phase === "booking") {
      const t = setTimeout(() => setPhase("sealed"), reduced ? 320 : LOADER_MS);
      return () => clearTimeout(t);
    }
    if (phase === "sealed") {
      const t = setTimeout(() => {
        focusNext.current = true;
        const land = () => setPhase("booked");
        if (lite) land();
        else slideStep(stageRef.current, "bk-done", land);
      }, reduced ? 240 : SEALED_MS);
      return () => clearTimeout(t);
    }
  }, [phase, reduced, lite]);

  // The review is the last stop before confirming: fetch the confetti now, not on confirm.
  useEffect(() => {
    if (current === 4 && phase === "form" && tier && tier !== "lite" && !reduced) preloadConfetti();
  }, [current, phase, tier, reduced]);

  // One burst when the slip lands (full and touch tiers; never lite or reduced motion).
  useEffect(() => {
    if (phase !== "booked" || burstDone.current) return;
    burstDone.current = true;
    if (tier === "lite" || reduced) return;
    burst(stageRef.current?.querySelector(".bk-slip") ?? stageRef.current);
  }, [phase, tier, reduced]);

  // After a step change: focus the new step's heading, and bring the step into view if needed.
  useEffect(() => {
    if (!focusNext.current) return;
    focusNext.current = false;
    const stage = stageRef.current;
    if (!stage) return;
    stage.querySelector<HTMLElement>("[data-step-title]")?.focus({ preventScroll: true });
    const top = stage.getBoundingClientRect().top;
    if (top < 64 || top > window.innerHeight * 0.7) scrollTo(stage, { offset: 96 });
  }, [current, phase, scrollTo]);

  /* ---- The active panel ---- */

  const nav = (step: Step) => (
    <div className="bk-nav">
      {step > 0 && (
        <button type="button" className="btn btn-paper bk-back" data-size="md" onClick={() => go((step - 1) as Step)}>
          {LABELS.back}
        </button>
      )}
      {step === 3 ? (
        <button type="submit" form={formId} className="btn btn-blue bk-next" data-size="md">
          {LABELS.next}
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-blue bk-next"
          data-size="md"
          disabled={!valid[step]}
          onClick={() => go((step + 1) as Step)}
        >
          {LABELS.next}
        </button>
      )}
    </div>
  );

  let panel: ReactNode;
  if (phase === "booked" && booked) {
    panel = <ConfirmationSlip booked={booked} onAnother={another} backHref={page ? "#main" : "#top"} />;
  } else if (current === 0) {
    panel = (
      <>
        <StepConcern
          titleId={titleId(0)}
          title={STEP_TITLES[0]}
          options={options}
          value={draft.concern}
          onPick={(concern) => edit({ concern })}
        />
        {nav(0)}
      </>
    );
  } else if (current === 1) {
    panel = (
      <>
        <StepArrival
          titleId={titleId(1)}
          title={STEP_TITLES[1]}
          value={draft.arrival}
          onPick={(arrival) => edit(arrival === draft.arrival ? {} : { arrival, slot: null, day: null })}
        />
        {nav(1)}
      </>
    );
  } else if (current === 2) {
    panel = (
      <>
        <StepTime
          titleId={titleId(2)}
          title={STEP_TITLES[2]}
          now={now}
          arrival={draft.arrival}
          day={draft.day}
          slot={draft.slot}
          firstName={firstName}
          onPickDay={(day) => edit({ day })}
          onPickSlot={(id) => edit({ slot: id })}
        />
        {nav(2)}
      </>
    );
  } else if (current === 3) {
    panel = (
      <>
        <StepDetails
          titleId={titleId(3)}
          title={STEP_TITLES[3]}
          formId={formId}
          values={draft}
          errors={errors}
          showErrors={attempted}
          onChange={(field, value) => edit({ [field]: value } as Partial<Draft>)}
          onSubmit={submitDetails}
        />
        {nav(3)}
      </>
    );
  } else {
    const rows: ReviewRow[] = [
      { label: STEP_TITLES[0], value: concernLabel ?? "" },
      { label: STEP_TITLES[1], value: arrivalLabel },
      { label: STEP_TITLES[2], value: whenLabel, note: nightDrop ? NIGHT_KEYS : undefined },
      {
        label: STEP_TITLES[3],
        value: [draft.name.trim(), draft.mobile.trim(), draft.vehicle.trim()].join(" · "),
        note: draft.notes.trim() || undefined,
      },
    ];
    panel = (
      <Review
        rows={rows}
        price={priceLineFor(draft, est, page)}
        phase={phase}
        onConfirm={confirm}
        onBack={() => go(3)}
      />
    );
  }

  const panelKey = phase === "booked" ? "done" : `step-${current}`;
  const ticked = (i: number) => phase !== "form" || (valid[i] && i < current);

  return (
    <div className="bk-flow">
      <ol className="bk-rail">
        {STEP_TITLES.map((title, i) => (
          <li key={title}>
            <button
              type="button"
              className="bk-rail-item"
              aria-current={phase === "form" && i === current ? "step" : undefined}
              disabled={phase !== "form" || !reachable(i)}
              onClick={() => go(i as Step)}
            >
              <span className="bk-box" aria-hidden="true">
                <PenTick active={ticked(i)} size={16} />
              </span>
              <span>{title}</span>
            </button>
          </li>
        ))}
      </ol>
      <div ref={stageRef} className="bk-stage">
        <div key={panelKey} className="bk-panel">
          {panel}
        </div>
      </div>
    </div>
  );
}
