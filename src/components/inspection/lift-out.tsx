"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The lift-out flourish (desktop, first in the cut order): when the brake item comes up, the worn
 * pad lifts out of the pad photo in Ana's text and lands on the 3D inner pad (FLIP, 700 ms), then
 * fades as the diagram's own pad takes its place. One image, one Web Animation, removed when done.
 * Reduced motion skips it.
 */
import { PAD_CUTOUT } from "@/data/media";

/** Fly the pad cutout from `from` (the photo in the thread) to `to` (viewport px, the 3D pad). */
export function liftOut(from: HTMLElement, to: { x: number; y: number }, width = 132): void {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const a = from.getBoundingClientRect();
  if (!a.width || typeof from.animate !== "function") return;

  const img = document.createElement("img");
  img.src = PAD_CUTOUT.webp;
  img.alt = "";
  img.setAttribute("aria-hidden", "true");
  img.decoding = "async";
  img.className = "pointer-events-none fixed left-0 top-0 z-[35] h-auto [filter:drop-shadow(0_10px_12px_rgb(18_20_23/0.28))]";
  img.style.width = `${width}px`;
  img.style.opacity = "0";
  document.body.appendChild(img);

  const half = width / 2;
  const sx = a.left + a.width / 2 - half;
  const sy = a.top + a.height / 2 - half * 0.6;
  const ex = to.x - half;
  const ey = to.y - half * 0.6;

  const go = () => {
    const flight = img.animate(
      [
        { transform: `translate(${sx}px, ${sy}px) scale(0.5) rotate(-9deg)`, opacity: 0 },
        { transform: `translate(${sx}px, ${sy - 28}px) scale(0.72) rotate(-5deg)`, opacity: 1, offset: 0.2 },
        { transform: `translate(${ex}px, ${ey}px) scale(1) rotate(0deg)`, opacity: 1 },
      ],
      { duration: 700, easing: "cubic-bezier(.2,.7,.1,1)", fill: "forwards" },
    );
    flight.onfinish = () => {
      const fade = img.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280, easing: "ease-out", fill: "forwards" });
      fade.onfinish = () => img.remove();
      fade.oncancel = () => img.remove();
    };
    flight.oncancel = () => img.remove();
  };

  if (img.complete) go();
  else {
    img.onload = go;
    img.onerror = () => img.remove();
  }
}
