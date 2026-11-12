"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * A CSS phone's screen that reads from the top while the thread is short and keeps the newest
 * arrived text in view once it overflows, by sliding the list up with a transform.
 *
 * Every text is laid out from the start (the ones that haven't arrived are `invisible`), so a text
 * arriving never moves anything in layout: only this list's transform changes, and transforms are
 * not layout shifts. (Growing the list and pinning its bottom edge, the old way, moved every
 * bubble on each arrival and counted as layout shift while scrolling.)
 *
 *   shown    how many texts have arrived (the list's first `shown` <li>s)
 *   children the <ol> with every text
 */
import { useLayoutEffect, useRef, type ReactNode } from "react";

export function ThreadScroll({ shown, children }: { shown: number; children: ReactNode }) {
  const screenRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const placed = useRef(false);

  useLayoutEffect(() => {
    const screen = screenRef.current;
    const list = listRef.current;
    const ol = list?.firstElementChild as HTMLElement | null;
    if (!screen || !list || !ol) return;
    const place = () => {
      const last = ol.children[Math.max(0, shown - 1)] as HTMLElement | undefined;
      if (!last) return;
      // offsetTop is relative to the list (position: relative), and ignores its transform.
      const end = last.offsetTop + last.offsetHeight + parseFloat(getComputedStyle(ol).paddingBottom || "0");
      const y = Math.max(0, Math.ceil(end - screen.clientHeight));
      if (!placed.current) {
        // The first placement lands without a slide.
        list.style.transition = "none";
        list.style.transform = `translateY(${-y}px)`;
        void list.offsetHeight;
        list.style.transition = "";
        placed.current = true;
      } else {
        list.style.transform = `translateY(${-y}px)`;
      }
    };
    place();
    // The screen's height follows the viewport, and bubbles reflow when the fonts arrive.
    const ro = new ResizeObserver(place);
    ro.observe(screen);
    ro.observe(ol);
    return () => ro.disconnect();
  }, [shown]);

  return (
    <div ref={screenRef} className="min-h-0 flex-1 overflow-hidden">
      <div
        ref={listRef}
        className="relative transition-transform duration-[280ms] ease-slip will-change-transform motion-reduce:transition-none"
      >
        {children}
      </div>
    </div>
  );
}
