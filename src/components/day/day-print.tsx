// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The day sheet's photo print.
 *
 * - StepPrint: one step's print on the stacked day sheet (a poster; on phones only the pad gauge
 *   plays, which FilmClip decides from the tier).
 * - DayPrint: the desktop print that swaps media as the day moves on: the bay (the frame the
 *   night film lands on), the lift rising, the pad gauge, the blue APPROVED BY YOU stamp, the parts,
 *   the torque wrench, the road test and the pickup box. Only the current layer is visible; only
 *   the current clip plays, and only while the chapter is on screen. Clips that play once hold
 *   their last frame (`ended` tells the chapter, which then stops asking them to play).
 *
 * Server-safe (no hooks); DayPrint's callbacks are only passed from the client chapter.
 */
import type { CSSProperties, Ref } from "react";
import { FilmClip } from "@/components/ui/film-clip";
import { Print } from "@/components/ui/print";
import { Stamp } from "@/components/ui/stamp";
import { DAY_STEPS, MEDIA_LABEL, NIGHT, printFor, type DayPrintMedia } from "@/data/day";
import { CLIPS, PHOTOS, type ClipId, type Photo } from "@/data/media";
import { cx } from "@/lib/cx";

function PhotoPicture({ photo, sizes, className }: { photo: Photo; sizes: string; className?: string }) {
  const small = photo.small;
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={small ? `${small.avif} ${small.width}w, ${photo.avif} ${photo.width}w` : photo.avif} sizes={sizes} />
      <img
        src={photo.webp}
        srcSet={small ? `${small.webp} ${small.width}w, ${photo.webp} ${photo.width}w` : undefined}
        sizes={sizes}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
    </picture>
  );
}

/** The caption under a step's print: the time, then the demo-media label from data/day.ts. */
export function stepCaption(stepIndex: number): string {
  const step = DAY_STEPS[stepIndex];
  const media = printFor(stepIndex);
  return `${step.time} · ${media?.kind === "photo" ? MEDIA_LABEL.image : MEDIA_LABEL.footage}`;
}

/* ---------------------------------------------------------------------------------------------
 * Stacked day sheet
 * ------------------------------------------------------------------------------------------- */

export function StepPrint({ stepIndex, tilt = 0, className }: { stepIndex: number; tilt?: number; className?: string }) {
  const media: DayPrintMedia = DAY_STEPS[stepIndex].print;
  if (media.kind === "stamp") {
    return (
      <div className={cx("grid min-h-[9rem] place-items-center", className)}>
        <Stamp level="approved" size={22} seed="day-approved" />
      </div>
    );
  }
  return (
    <Print tilt={tilt} caption={stepCaption(stepIndex)} className={className}>
      {media.kind === "clip" ? (
        <FilmClip id={media.clip} variant="print" playOnce={media.once} />
      ) : (
        <div className="relative aspect-video">
          <PhotoPicture photo={PHOTOS[media.photo]} sizes="(min-width: 1024px) 420px, 92vw" />
        </div>
      )}
    </Print>
  );
}

/* ---------------------------------------------------------------------------------------------
 * Desktop day sheet
 * ------------------------------------------------------------------------------------------- */

/** The media layers, in the order the day uses them, and the step each one belongs to. */
const CLIP_LAYERS: ReadonlyArray<{ clip: ClipId; step: number; once: boolean }> = [
  { clip: "lift-rise", step: 1, once: true },
  { clip: "pad-gauge", step: 2, once: false },
  { clip: "torque", step: 5, once: true },
  { clip: "road-test", step: 6, once: true },
  { clip: "pickup-box", step: 7, once: true },
];

/** Which layer shows at a step: 0 is the bay; the stamp step keeps the pad gauge under it. */
function layerFor(step: number): ClipId | "bay" | "parts" {
  if (step <= 0) return "bay";
  const media = printFor(step - 1);
  if (!media) return "bay";
  return media.kind === "photo" ? "parts" : media.clip;
}

export function DayPrint({
  step,
  playing,
  ended,
  onEnded,
  frameRef,
  className,
  style,
}: {
  /** 0 = the developed bay frame; 1–7 = DAY_STEPS[step - 1]. */
  step: number;
  /** The chapter is on screen and not paused. */
  playing: boolean;
  /** The step whose play-once clip has finished (it holds its last frame and stops playing). */
  ended: number | null;
  onEnded?: (step: number) => void;
  /** The image area, for the film's DEVELOP landing. */
  frameRef?: Ref<HTMLDivElement>;
  className?: string;
  style?: CSSProperties;
}) {
  const showing = layerFor(step);
  const bay = CLIPS.hero.variants.band!.poster;
  const caption = step === 0 ? NIGHT.developCaption : stepCaption(step - 1);
  const layer = (visible: boolean) =>
    cx("absolute inset-0 transition-opacity duration-[320ms] ease-out", visible ? "opacity-100" : "opacity-0");

  return (
    <Print tilt={1.4} caption={caption} className={className} style={style}>
      <div ref={frameRef} className="relative aspect-video" data-print-frame="">
        <picture className={layer(showing === "bay")}>
          <source type="image/avif" srcSet={bay.avif} />
          <img src={bay.webp} alt="" width={bay.width} height={bay.height} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        </picture>

        <div className={layer(showing === "parts")}>
          <PhotoPicture photo={PHOTOS.parts} sizes="420px" />
        </div>

        {CLIP_LAYERS.map((l) => {
          const current = step === l.step;
          return (
            <div key={l.clip} className={layer(showing === l.clip)}>
              <FilmClip
                id={l.clip}
                variant="print"
                playOnce={l.once}
                controls={false}
                active={playing && current && !(l.once && ended === l.step)}
                onEnded={l.once ? () => onEnded?.(l.step) : undefined}
                className="aspect-auto h-full w-full"
              />
            </div>
          );
        })}

        {step === 3 && (
          <div className="absolute inset-0 grid place-items-center">
            <Stamp level="approved" animate size={26} seed="day-approved" className="shadow-[0_2px_0_rgb(18_20_23/0.1)]" />
          </div>
        )}
      </div>
    </Print>
  );
}
