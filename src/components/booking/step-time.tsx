"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Step 3, "Pick a time". Day tabs for the next ten business days (the sliding pill), then that
 * day's page of half-hour rows (weekdays and Saturday mornings, from SHOP.slots in facts.ts). Taken
 * times are struck through in pencil. Availability comes from lib/slots: seeded by the date, so
 * every visitor sees the same book. Once your first name is known, it's written in blue on the
 * time you picked. The night key drop picks a morning only.
 */
import { useMemo, useState, type CSSProperties } from "react";
import { PaperTabs, tabPanelProps } from "@/components/ui/paper-tabs";
import { PenTick } from "@/components/ui/pen-tick";
import { HOURS_TEXT, SHOP, type Arrival } from "@/lib/facts";
import { dateKey, dayLabel } from "@/lib/hours";
import { businessDays, earliestBookable, slotsFor, type BusinessDay, type Slot } from "@/lib/slots";

export const NIGHT_KEYS = "Drop your keys any time the night before.";

export const TIME_COPY = {
  nightDrop: `Pick the morning we start. ${NIGHT_KEYS}`,
  legend: "Struck-through times are taken.",
} as const;

/** A day's rows from 90 minutes out; wait-with-us times stop early (see slots.ts). */
export function visibleSlots(key: string, now: Date, arrival: Arrival | null): Slot[] {
  const earliest = earliestBookable(now).getTime();
  return slotsFor(key).filter(
    (s) => s.start.getTime() >= earliest && (arrival !== "wait" || s.time <= SHOP.slots.waitWithUsLast),
  );
}

/** The next ten business days that still have an open time. */
export function timedDays(now: Date, arrival: Arrival | null): BusinessDay[] {
  return businessDays(now, 14)
    .filter((d) => visibleSlots(d.key, now, arrival).some((s) => s.open))
    .slice(0, 10);
}

/** Night drop: the next ten mornings we could start (not today; the keys go in the night before). */
export function nightDropDays(now: Date): BusinessDay[] {
  const today = dateKey(now);
  return businessDays(now, 12)
    .filter((d) => d.key !== today)
    .slice(0, 10);
}

/** Each pencil strike sits at its own slight angle, seeded by the slot so it never changes. */
function strikeAngle(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 0x01000193) >>> 0;
  return -(1 + (h % 32) / 10);
}

export function StepTime({
  titleId,
  title,
  now,
  arrival,
  day,
  slot,
  firstName,
  onPickDay,
  onPickSlot,
}: {
  titleId: string;
  title: string;
  now: Date | null;
  arrival: Arrival | null;
  day: string | null;
  slot: string | null;
  firstName: string;
  onPickDay: (key: string) => void;
  onPickSlot: (id: string) => void;
}) {
  const nightDrop = arrival === "nightdrop";
  const days = useMemo(
    () => (now ? (nightDrop ? nightDropDays(now) : timedDays(now, arrival)) : []),
    [now, nightDrop, arrival],
  );
  const [view, setView] = useState<string | null>(slot ? slot.slice(0, 10) : null);
  const viewKey = view && days.some((d) => d.key === view) ? view : (days[0]?.key ?? null);
  const slots = useMemo(
    () => (viewKey && now && !nightDrop ? visibleSlots(viewKey, now, arrival) : []),
    [viewKey, now, nightDrop, arrival],
  );

  const heading = (
    <h3 id={titleId} className="bk-step-title" tabIndex={-1} data-step-title="">
      {title}
    </h3>
  );

  if (nightDrop) {
    return (
      <>
        {heading}
        <p className="bk-note">{TIME_COPY.nightDrop}</p>
        <div className="bk-daylist" role="radiogroup" aria-labelledby={titleId}>
          {days.map((d) => (
            <label key={d.key} className="bk-daychip">
              <input
                type="radio"
                className="sr-only"
                name={`${titleId}-day`}
                value={d.key}
                checked={day === d.key}
                onChange={() => onPickDay(d.key)}
              />
              <span className="bk-box" aria-hidden="true">
                <PenTick active={day === d.key} size={16} />
              </span>
              <span>{d.label}</span>
            </label>
          ))}
        </div>
      </>
    );
  }

  if (!viewKey) return heading;

  const tabsId = `${titleId}-day`;
  const chosenDay = slot?.slice(0, 10) ?? null;
  const saturday = days.find((d) => d.key === viewKey)?.saturday ?? false;
  const anyTaken = slots.some((s) => !s.open);

  return (
    <>
      {heading}
      <div className="bk-days" data-lenis-prevent="">
        <PaperTabs
          variant="pill"
          idPrefix={tabsId}
          label={title}
          tabs={days.map((d) => ({
            id: d.key,
            label: (
              <>
                {d.label}
                {/* Always drawn (hidden until chosen) so the tab never changes width under the pill. */}
                <span className="bk-day-dot" data-on={d.key === chosenDay ? "" : undefined} aria-hidden="true" />
              </>
            ),
          }))}
          value={viewKey}
          onChange={setView}
        />
      </div>
      <div className="bk-daypanel" {...tabPanelProps(tabsId, viewKey)}>
        {(saturday || arrival === "wait" || anyTaken) && (
          <p className="bk-legend">
            {saturday && <span>{HOURS_TEXT.saturdaySlots}</span>}
            {arrival === "wait" && <span>{HOURS_TEXT.waitWithUs}</span>}
            {anyTaken && <span>{TIME_COPY.legend}</span>}
          </p>
        )}
        <div
          className="bk-slots"
          role="radiogroup"
          aria-label={dayLabel(viewKey)}
          style={{ "--rows": Math.ceil(slots.length / 2) } as CSSProperties}
        >
          {slots.map((s) => {
            const chosen = slot === s.id;
            return (
              <label
                key={s.id}
                className="bk-slot"
                data-taken={s.open ? undefined : ""}
                style={{ "--strike": `${strikeAngle(s.id)}deg` } as CSSProperties}
              >
                <input
                  type="radio"
                  className="sr-only"
                  name={`${titleId}-slot`}
                  value={s.id}
                  checked={chosen}
                  disabled={!s.open}
                  aria-label={s.open ? undefined : `${s.label}, taken`}
                  onChange={() => onPickSlot(s.id)}
                />
                <span className="bk-slot-time">{s.label}</span>
                {chosen && firstName && <span className="bk-slot-name">{firstName}</span>}
              </label>
            );
          })}
        </div>
      </div>
    </>
  );
}
