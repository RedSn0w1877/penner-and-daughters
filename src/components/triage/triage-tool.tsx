"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { useDeferredValue, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ComponentType, type ReactNode } from "react";
import { wakeScroller } from "@/components/hero/customer-states";
import { useScrollTo } from "@/components/providers/smooth-scroll";
import type { PaperTabs as PaperTabsType } from "@/components/ui/paper-tabs";
import { Sheet } from "@/components/ui/sheet";
import { IMPRINTS } from "@/data/copy";
import type { SymptomId, TabId } from "@/data/symptom-basics";
import { PHONE_TEXT, SHOP } from "@/lib/facts";
import { symptom, type SymptomSource } from "@/lib/stores";
import { useTier, type Tier } from "@/lib/tier";
import { afterLoadIdle } from "@/lib/use-media";
import { ConcernBox } from "./concern-box";

/** What every tab panel gets: whether it's the visible tab, and the page's tier. */
export interface PanelProps {
  active: boolean;
  tier: Tier;
}

interface Parts {
  Tabs: typeof PaperTabsType;
  /** The four tabs' ids and labels. */
  tabItems: ReadonlyArray<{ id: TabId; label: string }>;
  /** Which tab a symptom lives on, and its label (the full guide data rides in this chunk). */
  tabOf: (id: SymptomId) => TabId;
  labelOf: (id: SymptomId) => string;
  isSymptom: (id: string) => id is SymptomId;
  NoisePanel: ComponentType<PanelProps>;
  DashCluster: ComponentType<PanelProps>;
  LeakPanel: ComponentType<PanelProps>;
  OtherPanel: ComponentType<PanelProps>;
  Verdict: ComponentType<{ tier: Tier }>;
  /** Fetch liquid-gooey ahead of the leak tab opening (full tier). */
  preloadLeak: () => void;
}

/* ---------------------------------------------------------------------------------------------
 * The panels and the verdict box are their own chunks, kept out of the first load. They load
 * after window load + idle, or sooner the moment someone picks a symptom (the hero's
 * "Customer states" line, the pull-over list). Until then the server guide stands in.
 * ------------------------------------------------------------------------------------------- */

let parts: Parts | null = null;
let pending: Promise<void> | null = null;
const partListeners = new Set<() => void>();

export function loadTriage(): Promise<void> {
  pending ??= import("./triage-parts")
    .then((m) => {
      const byId = m.SYMPTOM_BY_ID;
      parts = {
        Tabs: m.PaperTabs,
        tabItems: m.TABS.map((t) => ({ id: t.id, label: t.label })),
        tabOf: (id) => byId[id].tab,
        labelOf: (id) => byId[id].label,
        isSymptom: (id): id is SymptomId => id in byId,
        NoisePanel: m.NoisePanel,
        DashCluster: m.DashCluster,
        LeakPanel: m.LeakPanel,
        OtherPanel: m.OtherPanel,
        Verdict: m.Verdict,
        preloadLeak: m.loadGooey,
      };
      partListeners.forEach((listener) => listener());
    })
    .catch(() => {
      pending = null;
    });
  return pending;
}

function subscribeParts(listener: () => void) {
  partListeners.add(listener);
  return () => {
    partListeners.delete(listener);
  };
}

function useParts(): Parts | null {
  return useSyncExternalStore(subscribeParts, () => parts, () => null);
}

const ID_PREFIX = "triage";
const WIDE = "(min-width: 1024px)";

/** Bring the answer into view: on phones the verdict (80px under the top), on desktop the sheet. */
function revealAnswer(scrollTo: ReturnType<typeof useScrollTo>, focus: boolean) {
  wakeScroller();
  requestAnimationFrame(() => {
    const verdict = document.getElementById("triage-verdict");
    const wide = window.matchMedia(WIDE).matches;
    if (wide) scrollTo("#concern-sheet");
    else scrollTo(verdict ?? document.getElementById("concern") ?? "#whats-wrong", { offset: 80 });
    if (focus) (verdict ?? document.getElementById("concern"))?.focus({ preventScroll: true });
  });
}

/** "This guide can't see your car. If anything feels unsafe, pull over and call {SHOP.phone.display}." */
function Footnote() {
  const [before, after] = PHONE_TEXT.guideFootnote.split(SHOP.phone.display);
  return (
    <div className="mt-10 border-t border-rule pt-4">
      <p className="max-w-[62ch] text-[15px] leading-[1.5] text-graphite">
        {before}
        <a href={SHOP.phone.tel} className="font-mono font-semibold whitespace-nowrap text-ink tabular-nums">
          {SHOP.phone.display}
        </a>
        {after}
      </p>
    </div>
  );
}

/**
 * The concern sheet. Server HTML (and the no-JS page): the tab strip as jump links, the empty
 * concern line and the full guide as collapsible entries. After load + idle the four paper index
 * tabs take over the strip, and the guide becomes the tool: a tab panel on columns 1–7 and the
 * verdict box on 8–12 (sticky inside the sheet on desktop; under the panel on phones).
 */
export function TriageTool({ guide, staticTabs }: { guide: ReactNode; staticTabs: ReactNode }) {
  const loaded = useParts();
  const tier = useTier();
  const scrollTo = useScrollTo();
  const rootRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<TabId>("noise");

  // Load the panels once the page is idle.
  useEffect(() => afterLoadIdle(() => void loadTriage()), []);

  // A pick from outside the tool (the hero, the lists) loads it and opens the symptom's tab.
  // A pick inside it, on a phone, scrolls the verdict into view.
  useEffect(
    () =>
      symptom.subscribe(() => {
        const s = symptom.get();
        if (!s.id) return;
        const id = s.id;
        if (s.from !== "triage") void loadTriage().then(() => parts && setTab(parts.tabOf(id)));
        else if (!window.matchMedia(WIDE).matches) revealAnswer(scrollTo, false);
      }),
    [scrollTo],
  );

  // The pull-over and usually-normal lists are plain links in the server HTML; with JS they open
  // the symptom here instead of jumping into the (replaced) guide.
  useEffect(() => {
    const section = rootRef.current?.closest("section");
    if (!section) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest<HTMLAnchorElement>("a[data-symptom]");
      const id = link?.dataset.symptom as SymptomId | undefined;
      // The links come from our own server HTML; once the data has loaded, check the id anyway.
      if (!link || !id || (parts && !parts.isSymptom(id))) return;
      e.preventDefault();
      symptom.set(id, (link.dataset.from as SymptomSource | undefined) ?? "link");
      revealAnswer(scrollTo, true);
    };
    section.addEventListener("click", onClick);
    return () => section.removeEventListener("click", onClick);
  }, [scrollTo]);

  const t: Tier = tier ?? "lite";
  // A tab press re-renders only the strip (the pill moves with the press); the panels follow in a
  // deferred, interruptible render, so showing a panel never blocks the tap's next paint.
  const shown = useDeferredValue(tab);

  const body = useMemo(() => {
    if (!loaded) return null;
    // The same ids PaperTabs gives its tabs (`${idPrefix}-tab-${id}` / `${idPrefix}-panel-${id}`).
    const panel = (id: TabId, node: ReactNode) => (
      <div
        key={id}
        role="tabpanel"
        id={`${ID_PREFIX}-panel-${id}`}
        aria-labelledby={`${ID_PREFIX}-tab-${id}`}
        tabIndex={0}
        hidden={shown !== id}
        className="outline-none"
      >
        {node}
      </div>
    );
    return (
      <div className="mt-7 grid gap-x-12 gap-y-10 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-7">
          {panel("noise", <loaded.NoisePanel active={shown === "noise"} tier={t} />)}
          {panel("light", <loaded.DashCluster active={shown === "light"} tier={t} />)}
          {panel("leak", <loaded.LeakPanel active={shown === "leak"} tier={t} />)}
          {panel("other", <loaded.OtherPanel active={shown === "other"} tier={t} />)}
        </div>
        <div className="min-w-0 lg:col-span-5">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+20px)]">
            <loaded.Verdict tier={t} />
          </div>
        </div>
      </div>
    );
  }, [loaded, shown, t]);
  const concern = useMemo(() => <ConcernBox labelOf={loaded?.labelOf} />, [loaded]);

  return (
    <div ref={rootRef} className="mt-9 lg:mt-12">
      {/* The tabs ride on the sheet's top edge, so the two SLIP in together as one sheet. */}
      <div id="concern-sheet" className="sheet" data-slip="">
        <div
          className="px-2 sm:px-6"
          // Pointing at or focusing the leak tab fetches its goo, so it's ready when the tab opens.
          onPointerOver={(e) => t === "full" && (e.target as Element).closest('[data-tab-id="leak"]') && loaded?.preloadLeak()}
          onFocus={(e) => t === "full" && (e.target as Element).closest('[data-tab-id="leak"]') && loaded?.preloadLeak()}
        >
          {loaded ? (
            <loaded.Tabs tabs={loaded.tabItems} value={tab} onChange={setTab} idPrefix={ID_PREFIX} label="What you notice" variant="index" allPanels />
          ) : (
            staticTabs
          )}
        </div>
        <Sheet
          imprint={IMPRINTS.concern}
          slip={false}
          // overflow: clip instead of hidden, so the verdict box can be sticky inside the sheet.
          className="[&>.sheet-paper]:overflow-clip"
          bodyClassName="lg:px-12 lg:pt-9"
        >
          {concern}
          {body ?? guide}
          <Footnote />
        </Sheet>
      </div>
      <style href="pd-triage" precedence="pd">{TRIAGE_CSS}</style>
    </div>
  );
}

/* Keyframes for the triage tool (the lazy panels reference them by name). Reduced motion is
   handled globally: every animation collapses to its end state. */
const TRIAGE_CSS = [
  "@keyframes pd-reveal{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}",
  "@keyframes pd-flash{0%,49%{opacity:1}50%,100%{opacity:.14}}",
  "@keyframes pd-sweep{from{transform:translateX(-100%)}to{transform:translateX(0)}}",
  "@keyframes pd-puddle{from{opacity:.3;transform:scale(.18)}to{opacity:1;transform:none}}",
  "@keyframes pd-bulb{0%,100%{opacity:0}8%,86%{opacity:1}}",
].join("");
