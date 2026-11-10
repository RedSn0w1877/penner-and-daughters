// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The inspection as plain paper: the thread, the walk-around, and per item the exploded still, the
 * parts list, the stamp, measurement and exact price, with Previous / Next. It's the no-JS view and
 * what every visitor sees until InspectionEnhance swaps in the tier's stage, so it's a static island
 * (components/islands.tsx): server HTML, never a second copy in the RSC payload.
 */
import { ItemFacts, ItemHeading, PartsList, PrevNext } from "@/components/inspection/item-static";
import { PhoneThread } from "@/components/inspection/phone-thread";
import { Walkaround } from "@/components/inspection/walkaround";
import { Sheet } from "@/components/ui/sheet";
import { IMPRINTS } from "@/data/copy";
import { ITEMS, type InspectionItem } from "@/data/inspection";
import { FRAMES } from "@/data/media";

function StaticItem({ item }: { item: InspectionItem }) {
  const f = FRAMES[item.part];
  return (
    <article id={item.domId} className="mt-10 border-t border-rule pt-8 first-of-type:mt-8 first-of-type:border-t-0 first-of-type:pt-0">
      <ItemHeading item={item} />
      <div
        className="relative mt-4 overflow-hidden rounded-[2px] border border-rule bg-paper"
        style={{ aspectRatio: `${f.stillWidth} / ${f.stillHeight}` }}
      >
        {/* Only without JavaScript: every scripted tier draws its own diagram. */}
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element -- static export: plain <img> through withBase() */}
          <img
            src={f.still}
            alt={`${item.title}. ${item.subtitle}`}
            width={f.stillWidth}
            height={f.stillHeight}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-contain"
          />
        </noscript>
      </div>
      <PartsList item={item} className="mt-5" />
      <ItemFacts item={item} className="mt-6" />
      <PrevNext item={item} className="mt-4" />
    </article>
  );
}

export function InspectionStatic() {
  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <PhoneThread variant="stack" className="mx-auto max-w-[420px]" />
      </div>
      <Sheet imprint={IMPRINTS.inspection} className="lg:col-span-8">
        <Walkaround width={260} />
        {ITEMS.map((item) => (
          <StaticItem key={item.id} item={item} />
        ))}
      </Sheet>
    </div>
  );
}
