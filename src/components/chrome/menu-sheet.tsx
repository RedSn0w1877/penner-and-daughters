"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import Link from "@/components/ui/link";
import { usePathname } from "next/navigation";
import { Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { lockScroll, unlockScroll } from "@/components/providers/smooth-scroll";
import { CallButton, TextLink } from "@/components/ui/buttons";
import { LABELS, NAV } from "@/data/copy";
import { withBase } from "@/lib/base-path";

/**
 * The phone/tablet menu (under 1024px). The 44px "Menu" button grows into a paper panel
 * (Plus-to-menu morph: a clip-path circle from the button, the + turning to ×) with the six
 * nav links, Call, Text us and Close. Focus moves in and is trapped; Escape or Close returns it.
 * Scrolling is locked while it's open.
 */
export function MenuSheet() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const onHome = pathname === "/" || pathname === "";

  const close = useCallback((restoreFocus: boolean) => {
    unlockScroll("menu");
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  const toggle = () => {
    if (open) {
      close(true);
    } else {
      lockScroll("menu");
      setOpen(true);
    }
  };

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? []).filter((el) => el.offsetParent !== null);
    // Wait a frame so the panel is visible (and focusable) before moving focus in.
    const frame = requestAnimationFrame(() => focusables()[0]?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(true);
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  // Leaving the page (a route change) never leaves the scroll locked.
  useEffect(() => () => unlockScroll("menu"), []);

  return (
    <>
      {/* Without JS the toggle can't open anything, so the server HTML also carries a plain link to
          the footer's links; CSS shows exactly one of the two (html.js is set before first paint). */}
      <a href="#site-footer-nav" className="menu-trigger menu-trigger-nojs btn btn-paper px-2.5 text-[15px] min-[400px]:px-3.5 min-[400px]:text-[16px] lg:hidden" data-size="sm">
        {LABELS.menu}
      </a>
      <button
        ref={triggerRef}
        type="button"
        className="menu-trigger menu-trigger-js btn btn-paper gap-1.5 px-2.5 text-[15px] min-[400px]:px-3.5 min-[400px]:text-[16px] lg:hidden"
        data-size="sm"
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={toggle}
      >
        <span>{LABELS.menu}</span>
        <Plus
          aria-hidden="true"
          size={16}
          strokeWidth={2.4}
          className="menu-plus hidden min-[400px]:block"
          data-open={open ? "true" : undefined}
        />
      </button>

      <div
        id="site-menu"
        ref={panelRef}
        className="menu-sheet lg:hidden"
        data-open={open ? "true" : undefined}
        role="dialog"
        aria-modal="true"
        aria-label={LABELS.menu}
        inert={!open}
      >
        <div className="flex items-center justify-end">
          <button type="button" className="btn btn-paper" data-size="sm" onClick={() => close(true)}>
            <X aria-hidden="true" size={18} strokeWidth={2.4} />
            <span>{LABELS.close}</span>
          </button>
        </div>
        <nav aria-label="Menu links" className="mt-2">
          <ul className="flex flex-col">
            {NAV.map((item) => {
              const cls =
                "type-h3 flex min-h-[52px] items-center border-b border-dashed border-rule py-2 text-[22px] no-underline hover:text-blue";
              const onClick = () => close(false);
              return (
                <li key={item.label}>
                  {item.href ? (
                    <Link href={item.href} className={cls} onClick={onClick}>
                      {item.label}
                    </Link>
                  ) : (
                    <a href={onHome ? item.hash : withBase(`/${item.hash}`)} className={cls} onClick={onClick}>
                      {item.label}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mt-6 flex flex-col gap-4">
          <CallButton size="lg" className="w-full" />
          <TextLink icon className="self-start text-[17px]">
            {LABELS.textUs}
          </TextLink>
        </div>
      </div>
    </>
  );
}
