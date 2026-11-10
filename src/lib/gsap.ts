// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * GSAP + ScrollTrigger, registered once. Import this module only from code that is already
 * deferred (a dynamic import or a lazily mounted component): gsap and ScrollTrigger together
 * are ~40 KB gzipped and the budget keeps them out of the first load.
 *
 * Importing it also arms sleepWhenIdle(): GSAP's ticker (which drives Lenis and every
 * ScrollTrigger) goes to sleep 2 s after the last wheel / touch / key / pointer input, so an idle
 * page runs zero requestAnimationFrame callbacks. Creating a tween wakes it again on its own, and
 * any input wakes it immediately. ScrollTrigger still updates on native scroll events while the
 * ticker sleeps (scrollbar drags, programmatic scrolls).
 *
 * Import gsap / ScrollTrigger / useGSAP from here, never from the packages directly, so there is
 * one registration and one idle policy.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

const IDLE_MS = 2000;
const WAKE_EVENTS = ["wheel", "touchstart", "touchmove", "keydown", "pointerdown", "pointermove"] as const;

let idleCleanup: (() => void) | null = null;

/*
 * ScrollTrigger keeps a tiny requestAnimationFrame loop alive for as long as it's enabled
 * (`_rafBugFix`, a Firefox repaint workaround: `() => _enabled && requestAnimationFrame(_rafBugFix)`),
 * so the ticker sleeping alone never reaches 0 rAF at rest. That loop re-reads the global
 * requestAnimationFrame on every frame, so a thin gate can park it while idle and restart it on
 * the next input, before any scrolling happens.
 *
 * Only a callback that re-requests ITSELF from inside its own frame, and whose whole source is a
 * one-liner, is treated as such a keep-alive. A one-off nested rAF (a double-rAF layout read, a
 * timer-driven demo's next step) re-requests a different function, so it always runs; a real
 * animation loop that re-requests itself is never a one-liner. Real work (GSAP's ticker,
 * ScrollTrigger's update, R3F) is never gated.
 */
let gateIdle = false;
const parked = new Set<FrameRequestCallback>();
const shortCache = new WeakMap<FrameRequestCallback, boolean>();
let nativeRaf: typeof window.requestAnimationFrame | null = null;
/** The callback whose frame is running right now (through the gate), if any. */
let running: FrameRequestCallback | null = null;

function isOneLiner(cb: FrameRequestCallback): boolean {
  let hit = shortCache.get(cb);
  if (hit === undefined) {
    const src = Function.prototype.toString.call(cb);
    hit = src.length < 140 && src.includes("requestAnimationFrame(");
    shortCache.set(cb, hit);
  }
  return hit;
}

function installRafGate() {
  if (nativeRaf) return;
  const raf = window.requestAnimationFrame;
  nativeRaf = raf;
  window.requestAnimationFrame = function gatedRequestAnimationFrame(cb: FrameRequestCallback): number {
    // A self-rescheduling one-liner (cb asked for itself from inside its own frame) waits while idle.
    if (gateIdle && cb === running && isOneLiner(cb)) {
      parked.add(cb);
      return 0;
    }
    return raf.call(window, (time) => {
      const outer = running;
      running = cb;
      try {
        cb(time);
      } finally {
        running = outer;
      }
    });
  };
}

function releaseParked() {
  const callbacks = [...parked];
  parked.clear();
  callbacks.forEach((cb) => window.requestAnimationFrame(cb));
}

/**
 * Put the GSAP ticker (and ScrollTrigger's keep-alive loop) to sleep 2 s after the last
 * wheel / touch / key / pointer input, once nothing is animating; wake on input. The check runs
 * on the ticker itself, so however the ticker woke (input, a new tween, a scrub catching up),
 * it goes back to sleep. Before the first input it sleeps almost at once. Idempotent.
 */
export function sleepWhenIdle(): () => void {
  if (typeof window === "undefined") return () => {};
  if (idleCleanup) return idleCleanup;
  installRafGate();

  // No input yet: allow sleep ~300 ms after loading (nothing needs the ticker at rest).
  let lastInput = performance.now() - IDLE_MS + 300;

  const busy = () => gsap.globalTimeline.getChildren(true, true, true).some((child) => child.isActive());

  const check = () => {
    if (gateIdle) return;
    if (performance.now() - lastInput < IDLE_MS || busy()) return;
    gateIdle = true;
    gsap.ticker.sleep();
  };

  const onInput = () => {
    lastInput = performance.now();
    if (gateIdle) {
      gateIdle = false;
      releaseParked();
      gsap.ticker.wake();
    }
  };

  // GSAP wakes its own ticker when a tween starts; un-gate keep-alive loops then too.
  const onTickWhileGated = () => {
    if (!gateIdle) return;
    gateIdle = false;
    releaseParked();
  };

  gsap.ticker.add(onTickWhileGated, false, true);
  gsap.ticker.add(check);
  const opts: AddEventListenerOptions = { passive: true, capture: true };
  WAKE_EVENTS.forEach((type) => window.addEventListener(type, onInput, opts));

  idleCleanup = () => {
    WAKE_EVENTS.forEach((type) => window.removeEventListener(type, onInput, opts));
    gsap.ticker.remove(check);
    gsap.ticker.remove(onTickWhileGated);
    gateIdle = false;
    releaseParked();
    gsap.ticker.wake();
    idleCleanup = null;
  };
  return idleCleanup;
}

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  ScrollTrigger.config({
    // Mobile address bars resize the viewport mid-scroll; don't recalculate pins for that.
    ignoreMobileResize: true,
    // ScrollTrigger re-syncs every 250 ms with a requestAnimationFrame, even at rest. Native scroll
    // events and Lenis (which calls ScrollTrigger.update on every scroll) already keep it current,
    // so push that safety net out of the way: an idle page runs zero frames. (config() starts a
    // fresh interval each call without keeping its id, so set it exactly once, here.)
    syncInterval: 2147483647,
  });
  sleepWhenIdle();
  refreshWhenPageSettles();
}

/**
 * Sections above the pins skip rendering until they're near the viewport (content-visibility:
 * auto with an estimated height), so the page's real height arrives as you scroll. When the
 * document height changes and then holds for 250 ms, re-measure every ScrollTrigger so the pins
 * below start where they should. Refreshing can itself change the height (pin spacers), so the
 * height it leaves behind is the new baseline, not a reason to refresh again.
 */
function refreshWhenPageSettles() {
  if (typeof ResizeObserver === "undefined") return;
  const root = document.documentElement;
  let settled = root.scrollHeight;
  let timer = 0;
  const ro = new ResizeObserver(() => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (Math.abs(root.scrollHeight - settled) < 2) return;
      ScrollTrigger.refresh();
      settled = root.scrollHeight;
    }, 250);
  });
  ro.observe(document.body);
}

export { gsap, ScrollTrigger, useGSAP };
