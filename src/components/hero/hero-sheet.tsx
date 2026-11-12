// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { MapPin } from "lucide-react";
import { NextOpening } from "@/components/chrome/next-opening";
import { OpenStatus } from "@/components/chrome/open-status";
import { BookButton, CallButton, TextLink } from "@/components/ui/buttons";
import { Sheet } from "@/components/ui/sheet";
import { IMPRINTS, LABELS } from "@/data/copy";
import { SERVICE_BY_ID, priceText } from "@/data/services";
import { cx } from "@/lib/cx";
import { SHOP } from "@/lib/facts";
import { DIAG, money } from "@/lib/pricing";
import { CustomerStates } from "./customer-states";
import { PromiseList } from "./promise-list";
import { QuickPicks, type QuickPick } from "./quick-picks";

/** Brakes first (what most drivers come for), then what the check-engine check costs. */
const PICKS: readonly QuickPick[] = [
  { label: "Brakes squeal or grind", price: priceText(SERVICE_BY_ID["brake-pads"]), id: "squeal-braking" },
  { label: "Check-engine light", price: `${money(DIAG, { range: true })} check`, id: "cel-steady" },
  { label: "Another noise, light or leak" },
];

/**
 * Repair order 4471: the hero, and the three-second test. Everything a driver needs is server
 * HTML: what this is (auto repair in Halden Crossing), the Call button with the number as live
 * text, Book, the hours (swapped for live open-now status after hydration) and the address.
 * The H1, Call and the phone number never animate in.
 *
 * Desktop: letterhead, then the form. Under 1024px the letterhead steps aside (the header carries
 * the number) and the address line moves under the status.
 */
export function HeroSheet({ className }: { className?: string }) {
  return (
    <div data-hero-sheet className={className}>
      <Sheet
        imprint={IMPRINTS.hero}
        carbon
        slip={false}
        bodyClassName="lg:px-12 lg:pt-10 lg:pb-11"
        // A narrow phone can't fit "Halden Crossing." at 58px with the fallback font; clip, never scroll.
        className="[&>.sheet-paper]:overflow-clip"
      >
        <header className="mb-7 hidden items-start justify-between gap-6 border-b-[1.5px] border-ink pb-4 lg:flex">
          <div>
            <p className="text-[22px] leading-none font-[820] [--wdth:74]">{SHOP.letterhead}</p>
            <p className="mt-2 text-[14px] font-medium text-graphite">Auto repair · family-run since {SHOP.founded}</p>
          </div>
          <address className="text-right font-mono text-[13px] leading-[1.55] not-italic text-ink">
            <span className="block">{SHOP.street}</span>
            <span className="block">{SHOP.town}</span>
            <a href={SHOP.phone.tel} className="tabular-nums no-underline hover:underline">
              {SHOP.phone.display}
            </a>
          </address>
        </header>

        {/* Two nowrap lines in a fixed two-line box: a font swap can't change the sheet's height. */}
        <h1 id="hero-title" className="type-h1 h-[1.76em] max-[389px]:text-[14.4vw]">
          <span className="block whitespace-nowrap">Auto repair in</span>{" "}
          <span className="block whitespace-nowrap">{SHOP.town}.</span>
        </h1>

        <p className="type-lead mt-4 max-w-[33em] text-graphite lg:mt-6">
          We text you photos of what we find and a written price for every line.{" "}
          <strong className="font-semibold text-ink">Nothing gets fixed until you say yes.</strong>
        </p>

        {/* Phones: Call across, then Book with "or text us" beside it, so the text link never sits
            under the tear-off bar; then the quick picks. */}
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 sm:grid-cols-2 lg:mt-7 lg:flex lg:flex-wrap lg:items-center lg:gap-4">
          <CallButton size="lg" className="col-span-2 w-full sm:col-span-1 lg:w-auto" />
          <BookButton size="lg" className="w-full lg:w-auto" />
          <TextLink className="self-center justify-self-start py-2.5 text-[17px] sm:col-span-2 lg:ml-1 lg:py-0">{LABELS.orTextUs}</TextLink>
        </div>

        <QuickPicks picks={PICKS} className="mt-4 lg:hidden" />

        <div className="mt-5 lg:mt-6">
          <NextOpening className="text-ink" />
          <OpenStatus variant="line" className="mt-1.5 text-[16px] text-ink" />
          <p className={cx("mt-2 flex items-start gap-2 text-[16px] leading-[1.45] text-ink lg:hidden")}>
            <MapPin aria-hidden="true" size={18} strokeWidth={2.2} className="mt-[2px] shrink-0 text-steel" />
            <span>
              {SHOP.address} ·{" "}
              <a href="#find-us" className="text-link">
                {LABELS.directions}
              </a>
            </span>
          </p>
        </div>

        <CustomerStates className="mt-7" />
        <PromiseList className="mt-6" />
      </Sheet>
    </div>
  );
}
