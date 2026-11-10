// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * "The visitor is heading for the inspection": the trigger for the desktop diagram's heavy work
 * (the three.js chunk, the four part models, shader compile and the GPU warm-up).
 *
 * It fires once, the first time either happens:
 *   - "What's it doing?" (#whats-wrong) reaches the middle of the screen, or is already above it
 *     (a reload part-way down the page); the warm-up then runs while the visitor reads the triage,
 *     a full section ahead of the pin;
 *   - a link to #inspection or #inspection-item-n is clicked (the menu, the symptom guide), so the
 *     work starts before the jump.
 *
 * Never at load on its own: a page left alone at the top compiles nothing, draws nothing and runs
 * no animation frames (the idle contract).
 */

let fired = false;
let armed = false;
const listeners = new Set<() => void>();

function fire() {
  if (fired) return;
  fired = true;
  disarm();
  listeners.forEach((l) => l());
  listeners.clear();
}

let io: IntersectionObserver | null = null;

function onClick(e: MouseEvent) {
  const link = (e.target as Element | null)?.closest?.("a[href]");
  if (link && /#inspection(-item-\d+)?$/.test(link.getAttribute("href") ?? "")) fire();
}

function disarm() {
  io?.disconnect();
  io = null;
  document.removeEventListener("click", onClick, true);
}

function arm() {
  if (armed) return;
  armed = true;
  document.addEventListener("click", onClick, true);
  const section = document.getElementById("whats-wrong");
  if (!section) return;
  io = new IntersectionObserver(
    ([entry]) => {
      // In the top half of the viewport, or already scrolled past.
      if (entry.isIntersecting || entry.boundingClientRect.bottom < 0) fire();
    },
    { rootMargin: "0px 0px -50% 0px" },
  );
  io.observe(section);
}

/** Run `fn` once the visitor heads for the inspection (immediately if they already have). */
export function whenHeadingToInspection(fn: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  if (fired) {
    fn();
    return () => {};
  }
  arm();
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
