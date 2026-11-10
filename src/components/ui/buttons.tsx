// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { MessageSquare, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { LABELS } from "@/data/copy";
import { cx } from "@/lib/cx";
import { SHOP, SMS_BODY_DEFAULT, smsHref } from "@/lib/facts";

export { BookButton } from "./book-button";

/**
 * The ink Call button: phone icon, "Call", and the number as live text in mono (a tel: link,
 * so it works with JS off). It never animates in.
 */
export function CallButton({
  size = "md",
  short = false,
  className,
}: {
  /** sm 44px · md 48px · lg 56px (the hero). */
  size?: "sm" | "md" | "lg";
  /** Just "Call" (the tear-off bar); the number stays in the accessible name. */
  short?: boolean;
  className?: string;
}) {
  return (
    <a
      href={SHOP.phone.tel}
      className={cx("btn btn-ink", className)}
      data-size={size}
      aria-label={short ? `${LABELS.call} ${SHOP.phone.display}` : undefined}
    >
      <Phone aria-hidden="true" size={20} strokeWidth={2.2} />
      {short ? (
        <span>{LABELS.call}</span>
      ) : (
        <span>
          {LABELS.call} <span className="btn-num">{SHOP.phone.display}</span>
        </span>
      )}
    </a>
  );
}

/**
 * A plain text link that opens the visitor's messaging app with a prefilled body
 * (default "Hi Penner & Daughters, about my car: ").
 */
export function TextLink({
  body,
  children,
  icon = false,
  className,
}: {
  body?: string;
  children?: ReactNode;
  icon?: boolean;
  className?: string;
}) {
  return (
    <a href={smsHref(body ?? SMS_BODY_DEFAULT)} className={cx("text-link inline-flex items-center gap-2", className)}>
      {icon && <MessageSquare aria-hidden="true" size={18} strokeWidth={2.2} />}
      {children ?? LABELS.textUs}
    </a>
  );
}

/** The shop's number as a mono tel: link (header, letterhead, footer). */
export function PhoneLink({ className, owner = false }: { className?: string; owner?: boolean }) {
  const p = owner ? SHOP.ownerPhone : SHOP.phone;
  return (
    <a href={p.tel} className={cx("font-mono font-semibold tabular-nums whitespace-nowrap", className)}>
      {p.display}
    </a>
  );
}
