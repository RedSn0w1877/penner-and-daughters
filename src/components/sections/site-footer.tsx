// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import Link from "@/components/ui/link";
import { LABELS } from "@/data/copy";
import { withBase } from "@/lib/base-path";
import { COPY, HOURS_TEXT, SHOP, WARRANTY } from "@/lib/facts";

/**
 * Footer on the deeper counter: name, address, numbers, hours, the warranty line, links
 * (Terms and Privacy on every page), the fiction disclosure and the © line. Graphite on
 * counter-deep only (the lighter imprint grey fails contrast here).
 */
export function SiteFooter() {
  const linkCls = "font-semibold text-ink underline decoration-[1.5px] underline-offset-[3px] hover:text-blue";
  return (
    <footer className="site-footer mt-0">
      <div className="counter-wrap grid gap-10 py-14 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-5">
          <p className="text-[20px] font-[820] text-ink [--wdth:74]">{SHOP.name}</p>
          <p className="mt-2">{SHOP.address}</p>
          <p className="mt-1">
            <a href={SHOP.phone.tel} className="whitespace-nowrap font-mono font-semibold text-ink no-underline hover:underline">
              {SHOP.phone.display}
            </a>{" "}
            · call or text
          </p>
          <p className="mt-1">
            Owner&apos;s direct line: {SHOP.owner.name},{" "}
            <a href={SHOP.ownerPhone.tel} className="whitespace-nowrap font-mono font-semibold text-ink no-underline hover:underline">
              {SHOP.ownerPhone.display}
            </a>
          </p>
        </div>

        <div className="lg:col-span-4">
          <p>{HOURS_TEXT.footer}</p>
          <p className="mt-3">{WARRANTY.sentence}</p>
        </div>

        <nav id="site-footer-nav" aria-label="Footer" className="scroll-mt-[var(--header-h)] lg:col-span-3">
          <ul className="flex flex-col gap-2.5">
            <li>
              <a href={withBase("/#prices")} className={linkCls}>
                {LABELS.services}
              </a>
            </li>
            <li>
              <Link href="/book/" className={linkCls}>
                {LABELS.bookATime}
              </Link>
            </li>
            <li>
              <Link href="/track/" className={linkCls}>
                {LABELS.trackMyCar}
              </Link>
            </li>
            <li>
              <Link href="/legal/terms/" className={linkCls}>
                {LABELS.terms}
              </Link>
            </li>
            <li>
              <Link href="/legal/privacy/" className={linkCls}>
                {LABELS.privacy}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="border-t border-dashed border-steel/60 pt-6 text-[14px] lg:col-span-12">
          <p className="max-w-[72ch]">{COPY.footerFiction}</p>
          <p className="mt-2">{COPY.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
