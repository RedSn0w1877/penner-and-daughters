"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import type Lenis from "lenis";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useTier } from "@/lib/tier";
import { afterLoadIdle } from "@/lib/use-media";

/**
 * Smooth scrolling and scroll locks.
 *
 * Lenis runs on the full tier only (fine pointer, ≥ 1024px, no reduced motion), loaded after
 * window load + idle, with lerp 0.1 and driven by GSAP's ticker so the page has one animation
 * loop (which lib/gsap puts to sleep 2 s after the last input). Everywhere else the browser
 * scrolls natively, with CSS smooth scrolling for in-page links.
 *
 * - useScrollTo()(target, { offset }) scrolls to an element, selector or y, landing `offset` px
 *   below the viewport top (default: under the sticky header). Works with or without Lenis.
 * - lockScroll(reason) / unlockScroll(reason): the menu and the lightbox stop scrolling.
 * - While a form field has focus, Lenis steps aside so the browser scrolls natively.
 * - Same-page #hash links are routed through Lenis (so the page doesn't jump, then glide).
 */

type ScrollTarget = string | Element | number;
export interface ScrollToOptions {
  /** Pixels between the viewport top and the target after scrolling. Default: header height + 8. */
  offset?: number;
  immediate?: boolean;
}
export type ScrollTo = (target: ScrollTarget, options?: ScrollToOptions) => void;

let lenis: Lenis | null = null;
const locks = new Set<string>();
let fieldFocused = false;

/** The live Lenis instance (full tier, after load + idle), or null. */
export function getLenis(): Lenis | null {
  return lenis;
}

function applyLocks() {
  const locked = locks.size > 0;
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
  } else {
    document.documentElement.style.overflow = locked ? "hidden" : "";
  }
}

/** Stop page scrolling for `reason` (menu, lightbox…). Reasons stack; each unlock removes one. */
export function lockScroll(reason: string): void {
  locks.add(reason);
  applyLocks();
}

export function unlockScroll(reason: string): void {
  locks.delete(reason);
  applyLocks();
}

function prefersReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function headerPadding() {
  return parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
}

const scrollToImpl: ScrollTo = (target, options = {}) => {
  if (typeof window === "undefined") return;
  let top: number;
  if (typeof target === "number") {
    top = target;
  } else {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return;
    top = el.getBoundingClientRect().top + window.scrollY - (options.offset ?? headerPadding());
  }
  top = Math.max(0, top);
  const immediate = options.immediate || prefersReduced();
  if (lenis && locks.size === 0) {
    lenis.scrollTo(top, { immediate, force: true });
  } else {
    window.scrollTo({ top, behavior: immediate ? "auto" : "smooth" });
  }
};

const ScrollContext = createContext<ScrollTo>(scrollToImpl);

/** Scroll to an element, selector or y position (Lenis-aware). */
export function useScrollTo(): ScrollTo {
  return useContext(ScrollContext);
}

function isField(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return true;
  if (el instanceof HTMLInputElement) {
    return !["checkbox", "radio", "button", "submit", "reset", "range", "color", "file", "image"].includes(el.type);
  }
  return false;
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const tier = useTier();

  useEffect(() => {
    if (tier !== "full") return;
    let disposed = false;
    let teardown: (() => void) | undefined;

    const cancelIdle = afterLoadIdle(() => {
      void Promise.all([import("lenis"), import("@/lib/gsap")]).then(([lenisModule, { gsap, ScrollTrigger }]) => {
        if (disposed || prefersReduced()) return;
        const LenisCtor = lenisModule.default;
        const instance = new LenisCtor({
          lerp: 0.1,
          smoothWheel: true,
          autoRaf: false,
          // A focused form field hands scrolling back to the browser.
          prevent: () => fieldFocused,
        });
        lenis = instance;
        instance.on("scroll", ScrollTrigger.update);
        const tick = (time: number) => instance.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
        applyLocks();

        const onFocusIn = (e: FocusEvent) => {
          fieldFocused = isField(e.target);
        };
        const onFocusOut = () => {
          fieldFocused = false;
        };
        const onClick = (e: MouseEvent) => {
          if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          const a = (e.target as Element | null)?.closest?.("a[href]");
          if (!(a instanceof HTMLAnchorElement) || a.closest(".skip-links") || a.target) return;
          const url = new URL(a.href);
          if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash || url.hash === "#") return;
          const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
          if (!el) return;
          e.preventDefault();
          scrollToImpl(el);
        };
        document.addEventListener("focusin", onFocusIn);
        document.addEventListener("focusout", onFocusOut);
        document.addEventListener("click", onClick);

        teardown = () => {
          document.removeEventListener("focusin", onFocusIn);
          document.removeEventListener("focusout", onFocusOut);
          document.removeEventListener("click", onClick);
          gsap.ticker.remove(tick);
          instance.destroy();
          if (lenis === instance) lenis = null;
        };
      });
    });

    return () => {
      disposed = true;
      cancelIdle();
      teardown?.();
    };
  }, [tier]);

  return <ScrollContext.Provider value={scrollToImpl}>{children}</ScrollContext.Provider>;
}
