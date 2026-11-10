"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { LABELS } from "@/data/copy";
import { CLIPS, clipRendition, type ClipId, type ClipVariant } from "@/data/media";
import { cx } from "@/lib/cx";
import { useTier } from "@/lib/tier";
import { useInView, useLoadIdle, useMedia, usePageVisible } from "@/lib/use-media";

/* On the touch tier only one clip plays at a time: starting one pauses the last. */
let touchCurrent: HTMLVideoElement | null = null;

export interface FilmClipProps {
  id: ClipId;
  variant: ClipVariant;
  /**
   * Below 1024px use this variant instead, in the same element (poster art-directed by media
   * query, video sources picked at attach time). The hero: variant "print" (4:5) with
   * phoneVariant "band" (16:9).
   */
  phoneVariant?: ClipVariant;
  /** Play once and hold the last frame (overrides the clip's own loop setting). */
  playOnce?: boolean;
  onEnded?: () => void;
  /**
   * undefined: play while ≥ 25% in view. true: play (restarting if it had ended since it was last
   * inactive). false: pause and hold the frame. Off-screen and hidden tabs always pause.
   */
  active?: boolean;
  /** The LCP poster: loads eagerly with fetchPriority high (pair it with a preload). */
  priority?: boolean;
  /** Poster alt text; defaults to the clip's description. */
  alt?: string;
  /** Show the Pause / Play button on clips over 5 s (default on). */
  controls?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * A film clip that is a still first. The poster (<picture>, AVIF then WebP) is the server HTML,
 * the no-JS view, the lite view and the LCP. The <video> attaches only after window load + idle,
 * only on tiers that play it (full: all; touch: hero, night drop, door rise, pad gauge; lite: none),
 * with preload="none", muted and inline. It plays while in view, pauses off-screen and in hidden
 * tabs, and fades in over the poster once frames are actually playing.
 */
export function FilmClip({
  id,
  variant,
  phoneVariant,
  playOnce,
  onEnded,
  active,
  priority = false,
  alt,
  controls = true,
  className,
  style,
}: FilmClipProps) {
  const clip = CLIPS[id];
  const desk = clipRendition(id, variant);
  const phone = phoneVariant ? clipRendition(id, phoneVariant) : null;

  const tier = useTier();
  const loadIdle = useLoadIdle();
  const wide = useMedia("(min-width: 1024px)");
  const visible = usePageVisible();
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inView = useInView(wrapRef, { threshold: 0.25 });

  const [userPaused, setUserPaused] = useState(false);
  const [ready, setReady] = useState(false);

  const plays = tier === "full" || (tier === "touch" && clip.touchPlays);
  const attached = plays && loadIdle;
  const loop = playOnce === undefined ? clip.loop : !playOnce;
  const rendition = phone && !wide ? phone : desk;
  const shouldPlay = attached && visible && !userPaused && (active === undefined ? inView : active);
  const showToggle = attached && controls && (loop || clip.duration > 5);
  const sourceKey = rendition.sources[0].src;

  const wasActive = useRef(active);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const reactivated = active === true && wasActive.current !== true;
    wasActive.current = active;
    if (!shouldPlay) {
      v.pause();
      return;
    }
    if (reactivated && v.ended) v.currentTime = 0;
    if (tier === "touch") {
      if (touchCurrent && touchCurrent !== v) touchCurrent.pause();
      touchCurrent = v;
    }
    v.play().catch(() => {
      /* Autoplay refused (e.g. Low Power Mode): the poster stays. */
    });
  }, [shouldPlay, active, tier, sourceKey]);

  useEffect(
    () => () => {
      if (touchCurrent === videoRef.current) touchCurrent = null;
    },
    [],
  );

  const vars = {
    ...style,
    "--film-ar": `${(phone ?? desk).width} / ${(phone ?? desk).height}`,
    "--film-ar-desk": `${desk.width} / ${desk.height}`,
  } as CSSProperties;

  return (
    <div ref={wrapRef} className={cx("film", className)} data-variant={variant} data-responsive={phone ? "true" : undefined} style={vars}>
      <picture>
        {phone && <source media="(max-width: 1023px)" type="image/avif" srcSet={phone.poster.avif} />}
        {phone && <source media="(max-width: 1023px)" type="image/webp" srcSet={phone.poster.webp} />}
        <source type="image/avif" srcSet={desk.poster.avif} />
        <img
          src={desk.poster.webp}
          alt={alt ?? clip.alt}
          width={desk.poster.width}
          height={desk.poster.height}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding={priority ? "sync" : "async"}
        />
      </picture>

      {attached && (
        <video
          ref={videoRef}
          key={sourceKey}
          muted
          playsInline
          loop={loop}
          preload="none"
          disablePictureInPicture
          disableRemotePlayback
          aria-hidden="true"
          tabIndex={-1}
          data-ready={ready ? "true" : undefined}
          onPlaying={() => setReady(true)}
          onEnded={() => onEnded?.()}
        >
          {rendition.sources.map((s) => (
            <source key={s.src} src={s.src} type={s.type} />
          ))}
        </video>
      )}

      {showToggle && (
        <button type="button" className="film-toggle" onClick={() => setUserPaused((p) => !p)}>
          {userPaused ? <Play aria-hidden="true" size={16} /> : <Pause aria-hidden="true" size={16} />}
          <span>{userPaused ? LABELS.playVideo : LABELS.pauseVideo}</span>
        </button>
      )}
    </div>
  );
}
