"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { useCallback, useId, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "@/lib/cx";

export interface PaperTab<T extends string = string> {
  id: T;
  label: ReactNode;
}

/** Props for the panel that belongs to tab `id` (role, id, aria-labelledby). */
export function tabPanelProps(idPrefix: string, id: string) {
  return {
    role: "tabpanel" as const,
    id: `${idPrefix}-panel-${id}`,
    "aria-labelledby": `${idPrefix}-tab-${id}`,
    tabIndex: 0,
  };
}

/**
 * Tabs with the Transitions.dev "sliding pill", drawn as paper:
 *  - variant "index": paper index tabs standing on a sheet's top edge (the symptom guide);
 *    the active tab is the sheet's own paper and slides between labels.
 *  - variant "pill": a segmented control (vehicle classes, booking days).
 * ARIA tablist with automatic activation: arrow keys move and select, Home/End jump.
 * Render each panel with {...tabPanelProps(idPrefix, id)}.
 */
export function PaperTabs<T extends string>({
  tabs,
  value,
  onChange,
  idPrefix: idPrefixProp,
  label,
  variant = "index",
  className,
  allPanels = false,
}: {
  tabs: ReadonlyArray<PaperTab<T>>;
  value: T;
  onChange: (id: T) => void;
  /** Unique per tab set; used for the tab and panel ids. Pass it when you render panels with tabPanelProps(). */
  idPrefix?: string;
  /** Accessible name of the tablist (recommended). */
  label?: string;
  variant?: "index" | "pill";
  className?: string;
  /**
   * True when every tab's panel is in the DOM (hidden ones included). Otherwise only the selected
   * tab points at a panel, so no aria-controls refers to an id that doesn't exist.
   */
  allPanels?: boolean;
}) {
  const autoId = useId();
  const idPrefix = idPrefixProp ?? `tabs${autoId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const listRef = useRef<HTMLDivElement>(null);

  // Write the pill's position straight to CSS variables: no React state, no extra render.
  const place = useCallback(
    (snap: boolean) => {
      const list = listRef.current;
      const tab = list?.querySelector<HTMLElement>(`[data-tab-id="${CSS.escape(value)}"]`);
      if (!list || !tab) return;
      if (snap) list.dataset.snap = "true";
      list.style.setProperty("--pill-x", `${tab.offsetLeft}px`);
      list.style.setProperty("--pill-w", `${tab.offsetWidth}px`);
      list.dataset.ready = "true";
      if (snap) {
        void list.offsetWidth;
        requestAnimationFrame(() => {
          delete list.dataset.snap;
        });
      }
      if (list.scrollWidth > list.clientWidth) {
        const left = tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2;
        list.scrollTo({ left, behavior: snap ? "auto" : "smooth" });
      }
    },
    [value],
  );

  const firstPlace = useRef(true);
  useLayoutEffect(() => {
    place(firstPlace.current);
    firstPlace.current = false;
  }, [place]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => place(true));
    ro.observe(list);
    return () => ro.disconnect();
  }, [place]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = tabs.findIndex((t) => t.id === value);
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const id = tabs[next].id;
    onChange(id);
    listRef.current?.querySelector<HTMLElement>(`[data-tab-id="${CSS.escape(id)}"]`)?.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      className={cx("ptabs", className)}
      data-variant={variant}
      data-snap="true"
      onKeyDown={onKeyDown}
    >
      <span className="ptabs-pill" aria-hidden="true" />
      {tabs.map((t) => {
        const selected = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${t.id}`}
            aria-selected={selected}
            aria-controls={allPanels || selected ? `${idPrefix}-panel-${t.id}` : undefined}
            tabIndex={selected ? 0 : -1}
            data-tab-id={t.id}
            className="ptab"
            onClick={() => onChange(t.id)}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
