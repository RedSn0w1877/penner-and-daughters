"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import Link from "@/components/ui/link";
import { usePathname } from "next/navigation";
import { CalendarClock } from "lucide-react";
import type { MouseEventHandler } from "react";
import { LABELS } from "@/data/copy";
import { cx } from "@/lib/cx";
import { money } from "@/lib/pricing";
import { useEstimateValue } from "@/lib/stores";

/**
 * The blue Book button (blue = the customer's action). On the home page it jumps to #book;
 * anywhere else it goes to /book/. With `withTotal`, its label becomes "Book · {total}" once the
 * estimate has exact lines, and it carries data-book-target so the inspection's price chip can
 * fly to it (query "[data-book-target]" and take the visible one).
 */
export function BookButton({
  label,
  size = "md",
  withTotal = false,
  icon = true,
  compact = false,
  className,
  onClick,
}: {
  /** Default "Book a time". The tear-off bar passes "Book". */
  label?: string;
  size?: "sm" | "md" | "lg";
  withTotal?: boolean;
  icon?: boolean;
  /** Narrow slot (the tear-off bar): the total goes on a second line and the icon steps aside. */
  compact?: boolean;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  const pathname = usePathname();
  const onHome = pathname === "/" || pathname === "";
  // A string read off the store: the button re-renders only when its label would change.
  const exact = useEstimateValue((s) => (s.count > 0 && !s.hasRanges ? money(s.exactTotal) : ""));
  const total = withTotal && exact ? exact : null;

  const content = (
    <>
      {icon && !(compact && total) && <CalendarClock aria-hidden="true" size={20} strokeWidth={2.2} />}
      {total ? (
        compact ? (
          <span className="flex flex-col items-center gap-0.5 leading-none">
            <span>{LABELS.book}</span>
            <span className="btn-num text-[13px]">{total}</span>
          </span>
        ) : (
          <span>
            {LABELS.book} · <span className="btn-num">{total}</span>
          </span>
        )
      ) : (
        <span>{label ?? LABELS.bookATime}</span>
      )}
    </>
  );

  const shared = {
    className: cx("btn btn-blue", className),
    "data-size": size,
    "data-book-target": withTotal ? "" : undefined,
    onClick,
  };

  // A plain hash link on the home page: the browser (or Lenis, on the full tier) does the scrolling,
  // and it works without JS.
  return onHome ? (
    <a href="#book" {...shared}>
      {content}
    </a>
  ) : (
    <Link href="/book/" {...shared}>
      {content}
    </Link>
  );
}
