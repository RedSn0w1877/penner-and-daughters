"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import type { ReactNode } from "react";
import { PenTick } from "@/components/ui/pen-tick";
import { SYMPTOM_BY_ID, TABS, type SymptomId } from "@/data/symptoms";
import { cx } from "@/lib/cx";
import { symptom, useSymptom } from "@/lib/stores";

/* The index tabs only appear once the tool has loaded, so they travel in this deferred chunk. */
export { PaperTabs } from "@/components/ui/paper-tabs";

/** A square ink box; the chosen one gets a blue ballpoint tick (blue is always the customer's mark). */
export function InkCheck({ checked }: { checked: boolean }) {
  return (
    <span aria-hidden="true" className="relative size-[18px] shrink-0 rounded-[2px] border-[1.5px] border-ink bg-paper">
      {checked && <PenTick size={25} className="absolute -left-[3px] -top-[9px]" />}
    </span>
  );
}

/** Pick a symptom from inside the tool. */
export const pick = (id: SymptomId) => symptom.set(id, "triage");

/**
 * One ruled line item on the concern sheet: a box to tick, then the words. Lists are ruled rows,
 * never card grids. `lead` sits between the box and the label (a fluid swatch, say).
 */
export function OptionRow({ id, lead, children }: { id: SymptomId; lead?: ReactNode; children?: ReactNode }) {
  const { id: current } = useSymptom();
  const chosen = current === id;
  return (
    <li className="border-b border-rule">
      <button
        type="button"
        aria-pressed={chosen}
        onClick={() => pick(id)}
        className={cx(
          "group flex min-h-[52px] w-full items-center gap-3.5 py-2.5 text-left transition-colors",
          chosen ? "text-ink" : "text-ink hover:bg-paper-shade/60",
        )}
      >
        <InkCheck checked={chosen} />
        {lead}
        <span className={cx("flex-1 text-[17px] leading-[1.35]", chosen ? "font-bold" : "font-semibold")}>
          {children ?? SYMPTOM_BY_ID[id].label}
        </span>
      </button>
    </li>
  );
}

/** A group heading on a panel ("Won't start", "What color is the puddle?"). */
export function GroupHeading({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cx("text-[length:var(--fs-h3)] leading-[1.25] font-bold [--wdth:88]", className)}>{children}</h3>;
}

const OTHER = TABS.find((t) => t.id === "other")!;

/** "Something else": won't start, feels wrong, comfort and fuel. (Takes PanelProps; needs none.) */
export function OtherPanel() {
  return (
    <div className="grid gap-8">
      {OTHER.groups.map((group) => (
        <div key={group.id}>
          <GroupHeading>{group.label}</GroupHeading>
          <ul className="mt-2.5 border-t border-rule">
            {group.symptoms.map((id) => (
              <OptionRow key={id} id={id} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
