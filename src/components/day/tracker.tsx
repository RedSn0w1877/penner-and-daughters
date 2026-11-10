"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Track my car (on the day sheet and at /track/). Type the repair order number (4471 is filled in)
 * and see the car's day: done steps carry a white witness mark on their lug nut, the live step says
 * "Now". "Run the demo day" plays all seven steps in 20 seconds: the status line swaps per step
 * (Text state swap) and a border beam runs along the live step while it plays (border-beam loads
 * only when the run starts). Nothing is sent anywhere; the toggle only shows a demo note.
 */
import { Pause, Phone, Play } from "lucide-react";
import type { BorderBeamProps } from "border-beam";
import { useEffect, useId, useState, type ComponentType, type FormEvent } from "react";
import { notify } from "@/components/providers/lazy-toaster";
import { PenTick } from "@/components/ui/pen-tick";
import { Sheet } from "@/components/ui/sheet";
import { TextSwap } from "@/components/ui/text-swap";
import { IMPRINTS, TOASTS } from "@/data/copy";
import { TRACKER_COPY, TRACKER_DEFAULT_LIVE, TRACKER_RUN_MS, TRACKER_STEPS, trackerStepText } from "@/data/day";
import { cx } from "@/lib/cx";
import { SHOP } from "@/lib/facts";
import { LugNut } from "./status-board";

type Run = "idle" | "running" | "paused" | "done";

const STEP_MS = Math.round(TRACKER_RUN_MS / TRACKER_STEPS.length);
const LAST = TRACKER_STEPS.length - 1;

export function Tracker({ standalone = false, className }: { standalone?: boolean; className?: string }) {
  const uid = useId();
  const Heading = standalone ? "h1" : "h3";
  const [ro, setRo] = useState<string>(TRACKER_COPY.ro);
  const [found, setFound] = useState(true);
  const [live, setLive] = useState(TRACKER_DEFAULT_LIVE);
  const [run, setRun] = useState<Run>("idle");
  const [updates, setUpdates] = useState(false);
  const [Beam, setBeam] = useState<ComponentType<BorderBeamProps> | null>(null);

  // The demo day: one timer per step, nothing while paused or done.
  useEffect(() => {
    if (run !== "running") return;
    const timer = setTimeout(() => {
      if (live >= LAST) setRun("done");
      else setLive(live + 1);
    }, STEP_MS);
    return () => clearTimeout(timer);
  }, [run, live]);

  const toggleRun = () => {
    if (run === "running") {
      setRun("paused");
      return;
    }
    if (run === "idle" || run === "done") setLive(0);
    setRun("running");
    if (!Beam) {
      void import("border-beam")
        .then((m) => setBeam(() => m.BorderBeam))
        .catch(() => {});
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const ok = ro.replace(/\D/g, "") === TRACKER_COPY.ro;
    setFound(ok);
    if (!ok && run === "running") setRun("paused");
  };

  const running = run === "running";

  return (
    <Sheet as="article" imprint={IMPRINTS.day} slip={!standalone} className={className} aria-labelledby={`${uid}-title`}>
      <Heading id={`${uid}-title`} className={standalone ? "type-h2" : "type-h3 text-[clamp(22px,2vw,28px)] [--wdth:80]"}>
        {TRACKER_COPY.title}
      </Heading>

      <form onSubmit={onSubmit} className="mt-6 flex flex-wrap items-end gap-x-4 gap-y-3" noValidate>
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1">
          <span className="type-label">{TRACKER_COPY.roLabel}</span>
          <input
            value={ro}
            onChange={(e) => setRo(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            className="h-11 w-full border-0 border-b-[1.5px] border-ink bg-transparent px-1 font-mono text-[17px] font-semibold tabular-nums outline-offset-4"
          />
        </label>
        <button type="submit" className="btn btn-ink" data-size="sm">
          {TRACKER_COPY.show}
        </button>
      </form>

      {found ? (
        <div className="mt-7">
          <p className="mono-measure text-ink">{TRACKER_COPY.car}</p>
          <p className="type-label mt-1">{TRACKER_COPY.advisor}</p>

          <p className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1" aria-live="polite">
            <span className="rounded-[4px] bg-ink px-2 py-[3px] text-[13px] font-bold leading-none text-paper [--wdth:80]">{TRACKER_COPY.now}</span>
            <span className="text-[clamp(20px,1.8vw,24px)] font-bold leading-tight [--wdth:84]">
              <TextSwap text={trackerStepText(live)} />
            </span>
          </p>

          <ol className="mt-4 border-t-[1.5px] border-ink">
            {TRACKER_STEPS.map((step, i) => {
              const state = i < live ? "done" : i === live ? "current" : "upcoming";
              const row = (
                <div className={cx("flex min-h-[48px] items-center gap-3 px-1 py-2", state === "upcoming" && "text-graphite")}>
                  <LugNut state={state} size={18} key={`${step.id}-${state}`} />
                  <span className="min-w-0 flex-1 text-[16px] leading-snug">
                    <span className={cx(state === "current" ? "font-bold text-ink" : "font-medium")}>{step.label}</span>
                    <span className="text-graphite"> · </span>
                    <span className="font-mono text-[14.5px] tabular-nums">{step.time}</span>
                  </span>
                  {state === "current" && (
                    <span className="rounded-[4px] border-[1.5px] border-ink px-[6px] py-[2px] text-[12.5px] font-bold leading-none [--wdth:80]">
                      {TRACKER_COPY.now}
                    </span>
                  )}
                </div>
              );
              return (
                <li key={step.id} className="border-b border-dashed border-rule" aria-current={state === "current" ? "step" : undefined}>
                  {state === "current" && Beam ? (
                    <Beam size="line" colorVariant="mono" theme="light" staticColors duration={2.4} strength={0.6} active={running}>
                      {row}
                    </Beam>
                  ) : (
                    row
                  )}
                </li>
              );
            })}
          </ol>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <button type="button" onClick={toggleRun} className="btn btn-ink" data-size="sm">
              {running ? <Pause aria-hidden="true" size={18} /> : <Play aria-hidden="true" size={18} />}
              <span>{running ? TRACKER_COPY.pause : TRACKER_COPY.run}</span>
            </button>

            <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-3 text-[16px] font-semibold">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={updates}
                onChange={(e) => {
                  setUpdates(e.target.checked);
                  if (e.target.checked) notify(TOASTS.textUpdates);
                }}
              />
              <span className="grid size-[26px] flex-none place-items-center rounded-[3px] border-[1.5px] border-ink bg-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue">
                {updates && <PenTick size={22} />}
              </span>
              {TRACKER_COPY.textMe}
            </label>
          </div>

          <a href={SHOP.phone.tel} className="text-link mt-5 inline-flex min-h-[44px] items-center gap-2">
            <Phone aria-hidden="true" size={18} strokeWidth={2.2} />
            <span>{TRACKER_COPY.callAdvisor}</span>
          </a>
        </div>
      ) : (
        <p className="mt-6 max-w-[46ch] text-[17px] font-semibold text-ink" role="status">
          {TRACKER_COPY.notFound}
        </p>
      )}
    </Sheet>
  );
}
