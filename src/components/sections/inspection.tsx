// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * "What did you find?" (#inspection, spec §11.3): an example of the inspection Ana texts for
 * RO 4471. Every item gets a photo, a measurement and a price, and you approve each line.
 *
 * The server renders the whole inspection as plain paper (no-JS, and what every visitor sees
 * before hydration): the thread, the walk-around, and per item the exploded still, the parts
 * list, the stamp, measurement and exact price, with Previous / Next. InspectionEnhance then swaps
 * in the tier's stage (the pinned WebGL stage on desktop, sticky frame sequences on touch, stills
 * with Approve / Not today on lite), loaded on demand.
 */
import { InspectionEnhance } from "@/components/inspection/enhance";
import { InspectionStyles } from "@/components/inspection/item-static";
import { InspectionStaticIsland } from "@/components/islands";
import { INSPECTION_COPY } from "@/data/inspection";

export function Inspection() {
  return (
    <section id="inspection" aria-labelledby="inspection-title" className="section-pad relative">
      <InspectionStyles />
      <div className="counter-wrap">
        <header className="grid gap-x-6 gap-y-5 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <h2 id="inspection-title" className="type-h2 text-ink">
              {INSPECTION_COPY.title}
            </h2>
            <p className="type-lead mt-5 max-w-[48ch] text-graphite">{INSPECTION_COPY.lead}</p>
          </div>
          <p className="font-mono text-[14px] leading-[1.65] text-graphite lg:col-span-4 lg:text-right">
            {INSPECTION_COPY.meta.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
        </header>

        <InspectionEnhance>
          <InspectionStaticIsland />
        </InspectionEnhance>
      </div>
    </section>
  );
}
