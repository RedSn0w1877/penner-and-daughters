"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The confirmation: a canary slip under the binder clip. Date and time, how you're getting here,
 * "Add to calendar" (a DEMO-titled .ics made in the browser), what happens next, and the plain
 * line that this is a demo and nobody will call.
 */
import { CalendarClock } from "lucide-react";
import { PROPS } from "@/data/media";
import { LABELS } from "@/data/copy";
import { COPY } from "@/lib/facts";
import { downloadIcs } from "@/lib/ics";
import { Figures } from "./review";
import { NIGHT_KEYS } from "./step-time";

export const SLIP_COPY = {
  title: "Booked (demo only)",
  calendar: "Add to calendar",
  nextTitle: "What happens next",
  next: ["We text you the day before.", "Photos and a written price before any work.", "You approve, or say not today."],
  demo: `Demo only: nothing was sent and nobody will call. ${COPY.fictionLine}`,
  another: "Book another time",
} as const;

export interface BookedSlip {
  /** Epoch ms of the appointment (the morning we start, for a night drop). */
  start: number;
  /** "Tue, Nov 3 · {time}" or, for a night drop, "Tue, Nov 3". */
  when: string;
  arrival: string;
  nightDrop: boolean;
}

export function ConfirmationSlip({
  booked,
  onAnother,
  backHref,
}: {
  booked: BookedSlip;
  onAnother: () => void;
  backHref: string;
}) {
  return (
    <div className="bk-slip" role="group" aria-labelledby="bk-slip-title">
      {/* eslint-disable-next-line @next/next/no-img-element -- static export: plain <img> through withBase() */}
      <img
        className="bk-slip-clip"
        src={PROPS.binderClip.webp}
        alt=""
        width={PROPS.binderClip.width}
        height={PROPS.binderClip.height}
        decoding="async"
      />
      <h3 id="bk-slip-title" className="bk-slip-title" tabIndex={-1} data-step-title="">
        {SLIP_COPY.title}
      </h3>
      <p className="bk-slip-when">
        <Figures>{booked.when}</Figures>
      </p>
      <p className="bk-slip-arrival">{booked.arrival}</p>
      {booked.nightDrop && <p className="bk-slip-note">{NIGHT_KEYS}</p>}
      <button
        type="button"
        className="btn bk-slip-cal"
        data-size="md"
        onClick={() => downloadIcs({ start: new Date(booked.start) })}
      >
        <CalendarClock aria-hidden="true" size={20} strokeWidth={2.2} />
        <span>{SLIP_COPY.calendar}</span>
      </button>
      <div className="bk-slip-next">
        <h4>{SLIP_COPY.nextTitle}</h4>
        <ol>
          {SLIP_COPY.next.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </div>
      <p className="bk-slip-demo">{SLIP_COPY.demo}</p>
      <div className="bk-slip-actions">
        <button type="button" className="btn bk-slip-again" data-size="md" onClick={onAnother}>
          {SLIP_COPY.another}
        </button>
        <a href={backHref} className="text-link">
          {LABELS.backToTop}
        </a>
      </div>
    </div>
  );
}
