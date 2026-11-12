// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * "Where are you?" (#find-us). The location sheet: an ink street map of the corner, the way in from
 * Route 9 and where to park, the hours (today circled), the towns, Directions and Copy address, the
 * free second-opinion offer, and a print of the storefront clipped beside that offer.
 * Every address and hour string comes from lib/facts. Rendering is skipped until it's near the
 * viewport (content-visibility in globals.css).
 */
import { DirectionsActionsIsland, HoursTableIsland, StreetMapIsland } from "@/components/islands";
import { Print } from "@/components/ui/print";
import { Sheet } from "@/components/ui/sheet";
import { IMPRINTS } from "@/data/copy";
import { MEDIA_LABEL } from "@/data/day";
import { STOREFRONT, posterSrcSet } from "@/data/media";
import { BOOKING_COPY } from "@/data/services";
import { HOURS_TEXT, SHOP } from "@/lib/facts";

/** "A, B, C and D" */
function listOf(items: readonly string[]): string {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** The second-opinion box: the question in ink, the answer in graphite. */
function SecondOpinion() {
  const text = BOOKING_COPY.secondOpinionBox;
  const cut = text.indexOf("? ") + 1;
  return (
    <p className="rounded-[2px] border-[1.5px] border-dashed border-steel/70 bg-paper-shade px-5 py-4 text-[17px] leading-[1.5] text-graphite">
      <span className="font-semibold text-ink">{text.slice(0, cut)}</span>
      {text.slice(cut)}
    </p>
  );
}

const TALL_SIZES = "(min-width: 1024px) 240px, 38vw";

function Storefront({ className }: { className?: string }) {
  const { wide, tall, alt } = STOREFRONT;
  return (
    <Print tilt={-1.3} caption={`${SHOP.road} side · ${MEDIA_LABEL.image}`} className={className}>
      <picture>
        {/* Shown ~225 px wide on desktop and ~290 on a phone: 480 w covers 1x, the full size 2x. */}
        <source media="(min-width: 640px)" type="image/avif" srcSet={posterSrcSet(tall, "avif")} sizes={TALL_SIZES} />
        <source media="(min-width: 640px)" type="image/webp" srcSet={posterSrcSet(tall, "webp")} sizes={TALL_SIZES} />
        <source type="image/avif" srcSet={posterSrcSet(wide, "avif")} sizes="80vw" />
        <img
          src={wide.webp}
          srcSet={posterSrcSet(wide, "webp")}
          sizes="80vw"
          alt={alt}
          width={wide.width}
          height={wide.height}
          loading="lazy"
          decoding="async"
          className="block aspect-video h-auto w-full object-cover sm:aspect-[4/5]"
        />
      </picture>
    </Print>
  );
}

export function FindUs() {
  return (
    <section id="find-us" aria-labelledby="find-us-title" className="section-pad">
      <div className="counter-wrap">
        <h2 id="find-us-title" className="type-h2">
          Where are you?
        </h2>
        <p className="type-lead mt-5 max-w-[44ch] text-graphite">
          On the corner of {SHOP.road} and {SHOP.cross}, across from {SHOP.landmark}.
        </p>

        <div className="mt-10 lg:mt-14">
          <Sheet imprint={IMPRINTS.location} bodyClassName="grid gap-10 lg:grid-cols-12 lg:gap-x-12">
            <div className="flex flex-col gap-8 lg:col-span-7">
              <StreetMapIsland className="-mx-1 sm:mx-0" />
              {/* The second-opinion box and the storefront print share the row under the map, so the
                  print sits on the sheet (clear of its foot and imprint) and the column has no hole. */}
              <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,15rem)] sm:items-start">
                <SecondOpinion />
                <Storefront className="relative z-[2] mx-auto w-[min(92%,30rem)] sm:mr-2 sm:w-full" />
              </div>
            </div>

            <div className="flex flex-col gap-6 lg:col-span-5">
              <p className="text-[17px] leading-[1.55] text-ink">{SHOP.directions.fromRoute9}</p>
              <p className="text-[17px] leading-[1.55] text-ink">{SHOP.directions.parking}</p>
              <HoursTableIsland />
              <div className="flex flex-col gap-2 text-[16px] leading-[1.5] text-graphite">
                <p className="font-semibold text-ink">{HOURS_TEXT.keyDrop}</p>
                <p>{HOURS_TEXT.holidays}</p>
                <p>We look after cars from {listOf(SHOP.towns)}.</p>
              </div>
              <DirectionsActionsIsland />
            </div>
          </Sheet>
        </div>
      </div>
    </section>
  );
}
