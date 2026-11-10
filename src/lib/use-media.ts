"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Small client hooks shared by every section. They all read browser state through
 * useSyncExternalStore: the server and the hydrating render get a fixed, lite-safe answer,
 * and the real value lands on the next commit, so markup never mismatches on hydration and
 * nothing calls setState inside an effect body.
 */
import { useCallback, useEffect, useState, useSyncExternalStore, type RefObject } from "react";

/** A media query, false on the server and during hydration. */
export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    useCallback(
      (notify: () => void) => {
        const list = window.matchMedia(query);
        list.addEventListener("change", notify);
        return () => list.removeEventListener("change", notify);
      },
      [query],
    ),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

function subscribeVisibility(notify: () => void) {
  document.addEventListener("visibilitychange", notify);
  return () => document.removeEventListener("visibilitychange", notify);
}

/** False while the tab is hidden. */
export function usePageVisible(): boolean {
  return useSyncExternalStore(subscribeVisibility, () => !document.hidden, () => true);
}

/* ---------------------------------------------------------------------------------------------
 * "After load + idle": the moment deferred work may start (video attach, gsap, lenis, sonner).
 * window load, then requestIdleCallback with a 1.5 s timeout. One shared flag for the page.
 * ------------------------------------------------------------------------------------------- */

let loadIdle = false;
let loadIdleArmed = false;
const loadIdleListeners = new Set<() => void>();

function armLoadIdle() {
  if (loadIdleArmed || typeof window === "undefined") return;
  loadIdleArmed = true;
  const fire = () => {
    loadIdle = true;
    loadIdleListeners.forEach((l) => l());
  };
  const idle = () => {
    if ("requestIdleCallback" in window) window.requestIdleCallback(fire, { timeout: 1500 });
    else setTimeout(fire, 200);
  };
  if (document.readyState === "complete") idle();
  else window.addEventListener("load", idle, { once: true });
}

/** Run `fn` once the page has loaded and gone idle (immediately if that already happened). */
export function afterLoadIdle(fn: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  if (loadIdle) {
    fn();
    return () => {};
  }
  armLoadIdle();
  let done = false;
  const once = () => {
    if (done) return;
    done = true;
    loadIdleListeners.delete(once);
    fn();
  };
  loadIdleListeners.add(once);
  return () => {
    done = true;
    loadIdleListeners.delete(once);
  };
}

function subscribeLoadIdle(notify: () => void) {
  armLoadIdle();
  loadIdleListeners.add(notify);
  return () => loadIdleListeners.delete(notify);
}

/** True once the window has loaded and gone idle. False on the server and during hydration. */
export function useLoadIdle(): boolean {
  return useSyncExternalStore(subscribeLoadIdle, () => loadIdle, () => false);
}

/* ---------------------------------------------------------------------------------------------
 * A minute-aligned clock for "open now" status and next-opening labels: one setTimeout to the
 * next minute boundary, paused while the tab is hidden. Null on the server and during hydration.
 * ------------------------------------------------------------------------------------------- */

let clockNow: Date | null = null;
let clockTimer: ReturnType<typeof setTimeout> | undefined;
const clockListeners = new Set<() => void>();

function clockTick() {
  clockNow = new Date();
  clockListeners.forEach((l) => l());
  clockSchedule();
}

function clockSchedule() {
  clearTimeout(clockTimer);
  if (document.hidden || clockListeners.size === 0) return;
  const now = Date.now();
  clockTimer = setTimeout(clockTick, 60_000 - (now % 60_000) + 50);
}

function onClockVisibility() {
  if (document.hidden) clearTimeout(clockTimer);
  else clockTick();
}

function subscribeClock(notify: () => void) {
  clockListeners.add(notify);
  if (clockListeners.size === 1) {
    clockNow = new Date();
    document.addEventListener("visibilitychange", onClockVisibility);
    clockSchedule();
  }
  return () => {
    clockListeners.delete(notify);
    if (clockListeners.size === 0) {
      clearTimeout(clockTimer);
      document.removeEventListener("visibilitychange", onClockVisibility);
    }
  };
}

function clockSnapshot() {
  clockNow ??= new Date();
  return clockNow;
}

/** The current time, refreshed on each minute boundary. */
export function useMinuteClock(): Date | null {
  return useSyncExternalStore(subscribeClock, clockSnapshot, () => null);
}

/* ---------------------------------------------------------------------------------------------
 * In-view flag via IntersectionObserver (no scroll listeners).
 * ------------------------------------------------------------------------------------------- */

function createFlag() {
  let value = false;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next: boolean) => {
      if (next === value) return;
      value = next;
      listeners.forEach((l) => l());
    },
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  options: { rootMargin?: string; threshold?: number } = {},
): boolean {
  const { rootMargin = "0px", threshold = 0 } = options;
  const [flag] = useState(createFlag);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => flag.set(entry.isIntersecting), { rootMargin, threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, flag, rootMargin, threshold]);
  return useSyncExternalStore(flag.subscribe, flag.get, () => false);
}
