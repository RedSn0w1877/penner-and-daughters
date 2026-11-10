// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * "What will it cost?" (#prices): the price list on the left, "Your estimate" on the right
 * (a drawer on phones). Both are islands (components/islands.tsx): complete server HTML, but no
 * second copy in the RSC payload and no code in the first load; they come alive as #prices nears.
 */
import "@/components/estimate/estimate-print.css";
import { EstimateDrawerIsland, RateSheetIsland } from "@/components/islands";
import { ESTIMATE_COPY } from "@/data/services";

const TITLE = "What will it cost?";
const LEAD =
  "Typical prices for common jobs, in plain numbers. Add a job to see it itemized, then print your estimate and take it anywhere.";

export function Estimate() {
  return (
    <section id="prices" className="prices" aria-labelledby="prices-title">
      <div className="counter-wrap">
        <header className="prices-head">
          <h2 id="prices-title" className="type-h2">
            {TITLE}
          </h2>
          <p className="type-lead prices-lead">{LEAD}</p>
        </header>
        <div className="prices-grid">
          <RateSheetIsland />
          <EstimateDrawerIsland copy={{ title: ESTIMATE_COPY.title, draft: ESTIMATE_COPY.draft, empty: ESTIMATE_COPY.empty }} />
        </div>
      </div>
    </section>
  );
}
