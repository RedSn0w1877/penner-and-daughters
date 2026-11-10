"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The pad-wear ruler (item 1, spec §11.3): "Drag to see what waiting does".
 *
 * A slider in millimetres of pad left, 10 (new) on the left to 0 (grind) on the right. Arrow keys,
 * Home/End and dragging all work; the handle is blue because you're the one moving it. The status
 * line answers in plain words, and when the price changes (pads only → pads and rotors at the grind) the
 * digits pop in one by one (Number pop-in, no blur). "Hear it" plays the squeal at 1–3 mm and the
 * grind at 0 through lib/audio: only on a tap, with a caption and a Stop button.
 */
import { Square, Volume2 } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { LABELS } from "@/data/copy";
import { WEAR } from "@/data/inspection";
import { SOUND_CAPTIONS, play, type SoundId } from "@/lib/audio";
import { cx } from "@/lib/cx";

const MAX = WEAR.newMM;
const pct = (mm: number) => ((MAX - mm) / MAX) * 100;

/** Number pop-in: each character rises into place, staggered (screen readers get it whole). */
function PopNumber({ text }: { text: string }) {
  return (
    <span className="whitespace-nowrap font-mono font-semibold text-ink">
      <span className="sr-only">{text}</span>
      <span key={text} aria-hidden="true" className="inline-flex">
        {Array.from(text).map((ch, i) => (
          <span key={i} className="inline-block animate-[pd-digit_300ms_var(--ease-slip)_both]" style={{ animationDelay: `${i * 30}ms` }}>
            {ch}
          </span>
        ))}
      </span>
    </span>
  );
}

export function WearRuler({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (mm: number) => void;
  className?: string;
}) {
  const id = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const [playing, setPlaying] = useState<SoundId | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const sound = WEAR.sound(value);
  const status = WEAR.status(value);

  useEffect(() => () => stopRef.current?.(), []);

  const change = (mm: number) => {
    const next = Math.max(0, Math.min(MAX, Math.round(mm)));
    if (next === value) return;
    if (playing && WEAR.sound(next) !== playing) stopRef.current?.();
    setBlocked(null);
    onChange(next);
  };

  const fromPointer = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return;
    const r = track.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    change(MAX - t * MAX);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus({ preventScroll: true });
    setDragging(true);
    fromPointer(e.clientX);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging) fromPointer(e.clientX);
  };

  const endDrag = () => setDragging(false);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = {
      ArrowRight: value - 1,
      ArrowDown: value - 1,
      ArrowLeft: value + 1,
      ArrowUp: value + 1,
      PageDown: value - 3,
      PageUp: value + 3,
      Home: MAX,
      End: 0,
    };
    if (!(e.key in keys)) return;
    e.preventDefault();
    change(keys[e.key]);
  };

  const hear = () => {
    if (playing) {
      stopRef.current?.();
      return;
    }
    if (!sound) return;
    setBlocked(null);
    setPlaying(sound);
    stopRef.current = play(sound, {
      onEnd: () => setPlaying(null),
      onBlocked: (message) => setBlocked(message),
    });
  };

  const caption = playing ? SOUND_CAPTIONS[playing] : (blocked ?? (sound ? null : LABELS.nothingToHear));

  return (
    <div className={cx("min-w-0", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <p id={`${id}-label`} className="type-label">
          {WEAR.label}
        </p>
        <p className="font-mono text-[16px] font-semibold tabular-nums text-ink">{WEAR.readout(value)}</p>
      </div>

      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-labelledby={`${id}-label`}
        aria-valuemin={0}
        aria-valuemax={MAX}
        aria-valuenow={value}
        aria-valuetext={WEAR.readout(value)}
        aria-orientation="horizontal"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        className={cx(
          "group relative mt-2 h-[66px] cursor-grab touch-pan-y select-none rounded-[4px] outline-offset-4",
          dragging && "cursor-grabbing",
        )}
      >
        {/* The ruler: a rule, a tick every millimetre, the six marked thicknesses. */}
        <svg aria-hidden="true" className="absolute inset-x-0 top-0 h-[26px] w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 26">
          <rect x="0" y="8" width="100" height="8" rx="1" fill="var(--paper-shade)" />
          <rect x={pct(value)} y="8" width={100 - pct(value)} height="8" fill="var(--graphite)" opacity="0.32" />
          <line x1="0" y1="16" x2="100" y2="16" stroke="var(--ink)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
          {Array.from({ length: MAX + 1 }, (_, i) => (
            <line
              key={i}
              x1={pct(i)}
              x2={pct(i)}
              y1={WEAR.ticks.some((t) => t.mm === i) ? 4 : 10}
              y2="16"
              stroke="var(--ink)"
              strokeWidth="1.2"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        {/* Two staggered rows (10 · 5 · 0 above, 7 · 3 · 1 below) so the worded ticks never collide. */}
        <div aria-hidden="true" className="absolute inset-x-0 top-[27px] h-[38px]">
          {WEAR.ticks.map((t, i) => (
            <span
              key={t.mm}
              className={cx(
                "absolute whitespace-nowrap font-mono text-[12.5px] leading-none text-graphite",
                i === 0 ? "" : i === WEAR.ticks.length - 1 ? "-translate-x-full" : "-translate-x-1/2",
                t.mm === value && "font-semibold text-ink",
              )}
              style={{ left: `${pct(t.mm)}%`, top: t.mm === 10 || t.mm === 5 || t.mm === 0 ? 2 : 20 }}
            >
              {t.label}
            </span>
          ))}
        </div>
        {/* Your handle. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-[-3px] grid h-[30px] w-[18px] -translate-x-1/2 place-items-center rounded-[5px] bg-blue shadow-[0_1px_2px_rgb(18_20_23/0.3)] transition-[left] duration-150 ease-out group-focus-visible:shadow-[0_0_0_2px_var(--paper),0_0_0_4px_var(--blue)]"
          style={{ left: `${pct(value)}%` }}
        >
          <span className="h-3.5 w-[2px] rounded-full bg-white/85" />
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-start gap-x-4 gap-y-2">
        <p aria-live="polite" className="min-h-[3em] min-w-[14rem] flex-1 text-[16px] leading-snug text-ink">
          {status.text}
          {status.price && <PopNumber text={status.price} />}
          {status.after}
        </p>
        <button
          type="button"
          onClick={hear}
          disabled={!sound && !playing}
          className="btn btn-paper shadow-[inset_0_0_0_1.5px_var(--steel)] disabled:cursor-not-allowed disabled:opacity-55"
          data-size="sm"
        >
          {playing ? <Square aria-hidden="true" size={16} strokeWidth={2.4} /> : <Volume2 aria-hidden="true" size={18} strokeWidth={2.2} />}
          <span>{playing ? LABELS.stop : LABELS.hearIt}</span>
        </button>
      </div>
      <p aria-live="polite" className="mt-1 min-h-[1.4em] text-[14px] leading-snug text-graphite">
        {caption}
      </p>
    </div>
  );
}
