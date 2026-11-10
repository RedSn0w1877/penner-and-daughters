"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { MapPin } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { BookButton, CallButton } from "@/components/ui/buttons";
import { LABELS } from "@/data/copy";
import { withBase } from "@/lib/base-path";

function isTextField(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return true;
  return el instanceof HTMLInputElement && !["checkbox", "radio", "button", "submit", "reset", "range"].includes(el.type);
}

/** True while the on-screen keyboard is up (the visual viewport shrinks) or a text field has focus. */
function keyboardUp(): boolean {
  const vv = window.visualViewport;
  const shrunk = vv ? vv.height < window.innerHeight * 0.78 : false;
  return shrunk || isTextField(document.activeElement);
}

function subscribeKeyboard(notify: () => void) {
  const vv = window.visualViewport;
  vv?.addEventListener("resize", notify);
  document.addEventListener("focusin", notify);
  document.addEventListener("focusout", notify);
  return () => {
    vv?.removeEventListener("resize", notify);
    document.removeEventListener("focusin", notify);
    document.removeEventListener("focusout", notify);
  };
}

/**
 * The tear-off bar (phones and tablets, under 1024px): Call (ink) | Book (blue; "Book · {total}"
 * once the estimate has lines) | Directions (paper; to #find-us). Fixed to the bottom with the
 * safe area, perforated along the top and between buttons. It slides away while the keyboard is
 * up. Nothing else ever covers it.
 */
export function TearOffBar() {
  const pathname = usePathname();
  const onHome = pathname === "/" || pathname === "";
  const hidden = useSyncExternalStore(subscribeKeyboard, keyboardUp, () => false);

  return (
    <nav className="tearoff" aria-label="Call, book or get directions" data-hidden={hidden ? "true" : undefined}>
      <div className="tearoff-cell">
        <CallButton short size="md" />
      </div>
      <div className="tearoff-cell">
        <BookButton label={LABELS.book} withTotal compact size="md" />
      </div>
      <div className="tearoff-cell">
        <a href={onHome ? "#find-us" : withBase("/#find-us")} className="btn btn-paper" data-size="md">
          <MapPin aria-hidden="true" size={20} strokeWidth={2.2} />
          <span>{LABELS.directions}</span>
        </a>
      </div>
    </nav>
  );
}
