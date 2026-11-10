"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { usePathname } from "next/navigation";
import { LABELS } from "@/data/copy";
import { withBase } from "@/lib/base-path";

const LINK =
  "sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[90] focus:rounded-[6px] focus:bg-ink focus:px-4 focus:py-3 focus:text-paper focus:font-semibold";

/** Screen-reader-only until focused: "Skip to main content" · "Skip to booking". */
export function SkipLinks() {
  const pathname = usePathname();
  const hasBook = pathname === "/" || pathname.startsWith("/book");
  return (
    <div className="skip-links">
      <a href="#main" className={LINK}>
        {LABELS.skipToMain}
      </a>
      <a href={hasBook ? "#book" : withBase("/book/")} className={LINK}>
        {LABELS.skipToBooking}
      </a>
    </div>
  );
}
