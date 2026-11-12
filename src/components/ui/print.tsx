// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import type { CSSProperties, ReactNode } from "react";
import { PROPS } from "@/data/media";
import { cx } from "@/lib/cx";

/**
 * A photo print: white 12px border, a binder clip, and a mono caption with a time. Prints may
 * tilt (≤ 1.5°); text sheets never do. Put an <img>, <picture> or <FilmClip> inside.
 */
export function Print({
  children,
  caption,
  tilt = 0,
  clip = true,
  className,
  style,
}: {
  children: ReactNode;
  /** "Bay 2, 7:31 AM · demo footage". Mono, under the photo. */
  caption?: ReactNode;
  /** Degrees, clamped to ±1.5. */
  tilt?: number;
  /** Show the binder clip (default on). */
  clip?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const t = Math.max(-1.5, Math.min(1.5, tilt));
  return (
    <figure className={cx("print", className)} style={{ ...style, "--tilt": `${t}deg` } as CSSProperties}>
      {clip && (
        // eslint-disable-next-line @next/next/no-img-element -- static export: plain <img> through withBase()
        <img
          className="print-clip"
          src={PROPS.binderClip.webp}
          alt=""
          width={PROPS.binderClip.width}
          height={PROPS.binderClip.height}
          loading="lazy"
          decoding="async"
        />
      )}
      <div className="print-frame">{children}</div>
      {caption && <figcaption className="print-caption">{caption}</figcaption>}
    </figure>
  );
}
