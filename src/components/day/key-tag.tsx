// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The blue key tag 4471 (a rendered prop), hanging from the day sheet's rail. SWING: when it moves
 * to another column it swings like a damped pendulum and settles in about 1.2 s.
 *
 * The swing is the spec's spring (stiffness 120, damping 9, mass 1) solved in closed form and
 * played as a Web Animation on the `rotate` property: the browser runs it on the compositor, so it
 * costs no requestAnimationFrame callbacks and no animation library on the page.
 */
import { PROPS } from "@/data/media";
import { cx } from "@/lib/cx";

/* Spring constants → damped oscillator: ω0 = √(k/m), ζ = c / 2√(km), ωd = ω0√(1 − ζ²). */
const STIFFNESS = 120;
const DAMPING = 9;
const OMEGA0 = Math.sqrt(STIFFNESS);
const ZETA = DAMPING / (2 * OMEGA0);
const DECAY = ZETA * OMEGA0;
const OMEGA_D = OMEGA0 * Math.sqrt(1 - ZETA * ZETA);
const SWING_MS = 1200;
const SAMPLES = 40;

const running = new WeakMap<HTMLElement, Animation>();

/**
 * Swing the tag after it moves `delta` columns (positive = to the right). It lags behind the move
 * first (the bottom trails), then swings through and settles. Bigger moves swing a little wider.
 */
export function swingKeyTag(el: HTMLElement | null, delta: number): void {
  if (!el || !delta || typeof el.animate !== "function") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const amplitude = Math.sign(delta) * (16 + 4 * Math.min(Math.abs(delta), 3));
  const frames: Keyframe[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = (i / SAMPLES) * (SWING_MS / 1000);
    const deg = amplitude * Math.exp(-DECAY * t) * Math.sin(OMEGA_D * t);
    frames.push({ rotate: `${deg.toFixed(2)}deg` });
  }
  running.get(el)?.cancel();
  const anim = el.animate(frames, { duration: SWING_MS, easing: "linear" });
  running.set(el, anim);
  anim.onfinish = () => {
    if (running.get(el) === anim) running.delete(el);
  };
}

/** The tag itself. Its ring is at the top center, so it swings from there. */
export function KeyTag({ className }: { className?: string }) {
  return (
    <span className={cx("block origin-[50%_4%]", className)} data-key-tag="">
      {/* eslint-disable-next-line @next/next/no-img-element -- static export: plain <img> through withBase() */}
      <img
        src={PROPS.keyTag.webp}
        alt=""
        width={PROPS.keyTag.width}
        height={PROPS.keyTag.height}
        className="block h-auto w-full drop-shadow-[0_3px_2px_rgb(18_20_23/0.28)]"
        decoding="async"
        loading="lazy"
      />
    </span>
  );
}
