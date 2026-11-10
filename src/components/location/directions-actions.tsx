"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Directions and Copy address. The address is fictional, so Directions only explains what a real
 * shop's button would do (a paper-slip toast); Copy address really copies it (Clipboard API, with
 * the old execCommand fallback) and confirms with a toast. Nothing leaves the page.
 */
import { Copy, MapPin } from "lucide-react";
import { notify } from "@/components/providers/lazy-toaster";
import { LABELS, TOASTS } from "@/data/copy";
import { cx } from "@/lib/cx";
import { SHOP } from "@/lib/facts";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function DirectionsActions({ className }: { className?: string }) {
  return (
    <div className={cx("flex flex-wrap items-center gap-x-6 gap-y-3", className)}>
      <button type="button" className="btn btn-ink" data-size="md" onClick={() => notify(TOASTS.directions)}>
        <MapPin aria-hidden="true" size={20} strokeWidth={2.2} />
        <span>{LABELS.directions}</span>
      </button>
      <button
        type="button"
        className="text-link inline-flex min-h-[44px] items-center gap-2 border-0 bg-transparent p-0 text-[17px]"
        onClick={async () => {
          if (await copyText(SHOP.address)) notify(TOASTS.addressCopied);
        }}
      >
        <Copy aria-hidden="true" size={18} strokeWidth={2.2} />
        <span>Copy address</span>
      </button>
    </div>
  );
}
