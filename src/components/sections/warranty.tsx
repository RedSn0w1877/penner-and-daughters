// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * "What if it's not fixed right?" (#warranty). The promises in big ratcheting type, the warranty
 * card (tilt and flip; front and back side by side for reduced motion and no JS), and three tags on
 * string with the owner's direct line. The words come from WARRANTY in lib/facts, one wording
 * everywhere. Rendering is skipped until it's near the viewport (content-visibility in globals.css).
 */
import { RatchetLinesIsland, WarrantyCardIsland } from "@/components/islands";
import { Sheet } from "@/components/ui/sheet";
import { PromiseTags } from "@/components/warranty/promise-tags";
import { IMPRINTS } from "@/data/copy";
import { WARRANTY } from "@/lib/facts";

export function Warranty() {
  return (
    <section id="warranty" aria-labelledby="warranty-title" className="section-pad">
      <div className="counter-wrap">
        <h2 id="warranty-title" className="type-h2 max-w-[15ch]">
          What if it&apos;s not fixed right?
        </h2>
        <p className="type-lead mt-5 max-w-[46ch] text-graphite">{WARRANTY.lead}</p>

        <Sheet
          imprint={IMPRINTS.warranty}
          className="mt-10 lg:mt-14"
          bodyClassName="grid gap-12 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-0 lg:px-14 lg:py-16"
        >
          <RatchetLinesIsland className="lg:col-span-7 lg:self-center" />
          <div className="flex flex-col gap-12 lg:col-span-5">
            <WarrantyCardIsland />
            <PromiseTags />
          </div>
        </Sheet>
      </div>
    </section>
  );
}
