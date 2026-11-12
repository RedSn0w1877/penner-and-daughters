"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The stacked day sheet for #your-day: the night (the night-drop band, the clock, the lines), the
 * dawn (the door-rise band), a band from night to the counter, then the seven steps as ruled rows
 * with their texts and prints. Whole section on phones and tablets, with reduced motion and without
 * JS; on the desktop full tier DayUpgrade swaps it for the pinned film chapter.
 *
 * A client island (components/islands.tsx), so its copy isn't serialized a second time into the
 * home page's RSC payload; the server HTML is still complete.
 */
import { ClockFace, clockText } from "@/components/day/day-clock";
import { DawnFilm, DayUpgrade, NightDropButton } from "./day-islands";
import { TextList } from "@/components/day/day-phone";
import { StepPrint } from "@/components/day/day-print";
import { LugNut } from "@/components/day/status-board";
import { CallButton } from "@/components/ui/buttons";
import { FilmClip } from "@/components/ui/film-clip";
import { Sheet } from "@/components/ui/sheet";
import { IMPRINTS } from "@/data/copy";
import { DAY_COLUMNS, DAY_SHEET, DAY_STEPS, MEDIA_LABEL, NIGHT, columnIndex } from "@/data/day";

function StackedDay() {
  return (
    <>
      {/* The night, on the night palette. */}
      <div className="bg-night text-night-ink">
        <div className="counter-wrap pb-14 pt-4 lg:pb-24 lg:pt-6">
          <h2 id="your-day-title" className="type-h2 max-w-[15ch]">
            {NIGHT.title}
          </h2>
          <p className="type-lead mt-5 max-w-[40ch] text-night-dim">{NIGHT.lead}</p>

          {/* 7:12 PM, the night drop. */}
          <div className="mt-10 grid gap-7 lg:mt-16 lg:grid-cols-12 lg:items-center lg:gap-10">
            <figure className="-mx-2 sm:mx-0 lg:col-span-7 lg:col-start-6 lg:row-start-1">
              <FilmClip id="night-drop" variant="band" sizes="(min-width: 1024px) 58vw, 100vw" />
              <figcaption className="mono-imprint mt-2 px-2 text-night-dim sm:px-0">{MEDIA_LABEL.footage}</figcaption>
            </figure>
            <div className="lg:col-span-5 lg:row-start-1">
              <ClockFace minutes={NIGHT.dropAt} className="text-[clamp(64px,23vw,96px)] lg:text-[clamp(96px,9vw,136px)]" />
              <p className="mono-imprint mt-2 text-night-dim">{NIGHT.clockCaption}</p>
              <p className="mt-6 text-[clamp(28px,7vw,40px)] font-[780] leading-[1.05] [--wdth:78]">{NIGHT.dropLine}</p>
              <p className="mt-3 max-w-[42ch] text-[17px] leading-[1.5] text-night-dim">{NIGHT.dropNote}</p>
              <p className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-dashed border-night-dim/40 pt-5">
                <span className="font-mono text-[17px] font-bold tabular-nums">{clockText(NIGHT.waitAt)}</span>
                <span className="text-[19px] font-semibold leading-snug [--wdth:90]">{NIGHT.waitLine}</span>
              </p>
            </div>
          </div>

          {/* At opening time, the bay door goes up. */}
          <div className="mt-14 grid gap-7 lg:mt-20 lg:grid-cols-12 lg:items-center lg:gap-10">
            <figure className="-mx-2 sm:mx-0 lg:col-span-7">
              <DawnFilm />
              <figcaption className="mono-imprint mt-2 px-2 text-night-dim sm:px-0">{MEDIA_LABEL.footage}</figcaption>
            </figure>
            <div className="lg:col-span-5">
              <ClockFace minutes={NIGHT.openAt} className="text-[clamp(64px,23vw,96px)] lg:text-[clamp(96px,9vw,136px)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Dawn: night to the counter, carrying the morning's first line. Short on phones, so it reads
          as a turn of the page, never as an empty screen. */}
      <div className="h-[34vh] min-h-[240px] lg:h-[50vh] lg:min-h-[320px] bg-[linear-gradient(180deg,var(--night)_0%,var(--dawn)_42%,var(--counter)_100%)]">
        <p className="counter-wrap pt-[7vh] text-center text-[clamp(26px,4.2vw,52px)] font-[800] leading-[1.04] text-night-ink [--wdth:70]">
          {NIGHT.doorLine}
        </p>
      </div>

      {/* The day sheet, step by step. */}
      <div className="counter-wrap">
        <Sheet imprint={IMPRINTS.day} aria-labelledby="day-sheet-title">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h3 id="day-sheet-title" className="type-h3 [--wdth:80]">
              {DAY_SHEET.title}
            </h3>
            <p className="mono-measure text-graphite">{DAY_SHEET.car}</p>
          </div>
          <ol className="mt-6 border-t-[1.5px] border-ink">
            {DAY_STEPS.map((s, i) => (
              <li key={s.id} className="grid gap-5 border-b border-dashed border-rule py-7 lg:grid-cols-12 lg:gap-8 lg:py-9">
                <div className="lg:col-span-2">
                  <p className="font-mono text-[18px] font-bold tabular-nums">{s.time}</p>
                  <p className="type-label mt-2 inline-flex items-center gap-2">
                    <LugNut state="done" size={14} />
                    {DAY_COLUMNS[columnIndex(s.column)].label}
                  </p>
                </div>
                <div className="lg:col-span-5">
                  <p className="max-w-[40ch] text-[19px] font-semibold leading-[1.35] [--wdth:90]">{s.line}</p>
                  <TextList texts={s.texts} className="mt-5 max-w-[28rem]" />
                </div>
                <div className="lg:col-span-5">
                  <StepPrint
                    stepIndex={i}
                    tilt={i % 2 ? 0.9 : -0.9}
                    className="mx-auto w-[min(100%,26rem)] sm:ml-0 lg:ml-auto lg:mr-2"
                  />
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <NightDropButton />
            <CallButton />
          </div>
        </Sheet>
      </div>
    </>
  );
}

/** The stacked sheet inside its desktop upgrade (the film chapter swaps in on the full tier). */
export function StackedDayUpgrade() {
  return (
    <DayUpgrade>
      <StackedDay />
    </DayUpgrade>
  );
}
