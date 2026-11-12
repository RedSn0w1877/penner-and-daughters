"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import Link from "@/components/ui/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { MenuSheet } from "@/components/chrome/menu-sheet";
import { OpenStatus } from "@/components/chrome/open-status";
import { BookButton, PhoneLink } from "@/components/ui/buttons";
import { NAV } from "@/data/copy";
import { withBase } from "@/lib/base-path";
import { SHOP } from "@/lib/facts";

/**
 * Sticky header. Transparent on the counter; after 80px of scroll it becomes a paper strip with a
 * 1.5px ink rule (no blur). Desktop: wordmark, the six links, open-now chip, the number, Book.
 * Under 1024px: wordmark, the number, Menu. The scroll state comes from an IntersectionObserver
 * sentinel, so there's no scroll listener.
 */
export function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const onHome = pathname === "/" || pathname === "";

  useEffect(() => {
    const header = headerRef.current;
    const sentinel = sentinelRef.current;
    if (!header || !sentinel) return;
    const io = new IntersectionObserver(([entry]) => {
      header.dataset.scrolled = !entry.isIntersecting && entry.boundingClientRect.top < 0 ? "true" : "false";
    });
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* 80px below the header's resting place (notice line 24px + 80px). */}
      <div ref={sentinelRef} aria-hidden="true" className="pointer-events-none absolute left-0 top-[104px] h-px w-px" />
      <header ref={headerRef} className="site-header" data-scrolled="false">
        <div className="counter-wrap flex h-full items-center gap-2 min-[400px]:gap-3 lg:gap-6">
          <Link
            href="/"
            className="-my-1.5 flex min-h-11 shrink-0 flex-col justify-center whitespace-nowrap leading-none no-underline"
            aria-label={`${SHOP.name}, home`}
          >
            <span className="text-[17px] font-[820] [--wdth:74] min-[400px]:text-[19px] sm:text-[22px]">{SHOP.wordmark.name}</span>
            <span className="mt-[3px] text-[12px] font-medium text-graphite min-[400px]:text-[13px] sm:text-[15px]">
              {SHOP.wordmark.sub}
            </span>
          </Link>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-4 xl:gap-5">
              {NAV.map((item) => {
                const cls = "whitespace-nowrap text-[15px] font-semibold text-ink no-underline decoration-[1.5px] underline-offset-4 hover:underline";
                return (
                  <li key={item.label}>
                    {item.href ? (
                      <Link href={item.href} className={cls}>
                        {item.label}
                      </Link>
                    ) : (
                      <a href={onHome ? item.hash : withBase(`/${item.hash}`)} className={cls}>
                        {item.label}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-2 min-[400px]:gap-3 lg:gap-5">
            <OpenStatus variant="chip" className="hidden 2xl:inline-flex" />
            {/* Under 360px the number can't fit beside the wordmark and Menu (the page would scroll
                sideways); the tear-off bar's Call carries it there. */}
            <PhoneLink className="-my-3 inline-flex min-h-11 items-center text-[13px] text-ink max-[359px]:hidden min-[400px]:text-[14px] sm:text-[15px] lg:hidden xl:inline-flex" />
            <BookButton withTotal size="sm" className="hidden lg:inline-flex" />
            <MenuSheet />
          </div>
        </div>
      </header>
    </>
  );
}
