// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { SafetyLists } from "@/components/triage/safety-lists";
import { SymptomGuideIsland } from "@/components/islands";
import { GuideTabStrip } from "@/components/triage/symptom-guide-ssr";
import { TriageTool } from "@/components/triage/triage-tool";

/**
 * #whats-wrong: "What's it doing?", the concern sheet. The question sits on the counter; the
 * sheet answers it. The full symptom guide is server HTML (no-JS and search) kept out of the RSC
 * payload (a static island), and the interactive tool takes its place after load + idle. Under the sheet: when to pull over, and
 * what's usually nothing.
 */
export function Triage() {
  return (
    <section id="whats-wrong" aria-labelledby="whats-wrong-title" className="section-pad scroll-mt-[var(--header-h)]">
      <div className="counter-wrap">
        <div className="max-w-[44rem] px-2 sm:px-0">
          <h2 id="whats-wrong-title" className="type-h2">
            What&apos;s it doing?
          </h2>
          <p className="type-lead mt-4 text-graphite lg:mt-5">
            Start with what you notice. We&apos;ll tell you how soon to come in, what it usually is and what it usually costs.
          </p>
        </div>
        <TriageTool guide={<SymptomGuideIsland />} staticTabs={<GuideTabStrip />} />
        <SafetyLists className="mt-8 lg:mt-10" />
      </div>
    </section>
  );
}
