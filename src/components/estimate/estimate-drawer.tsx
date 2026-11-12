"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Where "Your estimate" lives.
 *   Desktop (≥ 1024px): the right-hand column of the price list, sticky 96px from the top.
 *   Phones and tablets: a drawer resting on the tear-off bar, "Your estimate · {total}" on a 48px
 *   handle, opening to 80vh. It only shows while #prices is on screen and the estimate has lines.
 *
 * This file is the small part that ships with the page. The sheet itself (motion, the carbon
 * peel, the printed estimate) loads after load + idle, or straight away once a line exists; until
 * then the same empty sheet is drawn here so nothing jumps.
 */
import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { IMPRINTS } from "@/data/copy";
import { money, moneyRange } from "@/lib/pricing";
import { useEstimateDeferred } from "@/lib/stores";
import { afterLoadIdle, useMedia } from "@/lib/use-media";
import { CarbonPeel } from "./carbon-peel";

/** Copy the server passes down (it lives in data/services.ts, which stays out of this bundle). */
export interface EstimateCopy {
  title: string;
  draft: string;
  empty: string;
}

type EstimateModule = typeof import("./your-estimate");

let estimateModule: Promise<EstimateModule> | null = null;
const loadEstimate = () => (estimateModule ??= import("./your-estimate"));

type DrawerState = "hidden" | "closed" | "open";

export function EstimateDrawer({ copy }: { copy: EstimateCopy }) {
  const est = useEstimateDeferred();
  const hasLines = est.count > 0;
  const phone = useMedia("(max-width: 1023.98px)");
  const [mod, setMod] = useState<EstimateModule | null>(null);
  const [open, setOpen] = useState(false);
  const [inView, setInView] = useState(false);
  const [hadLines, setHadLines] = useState(hasLines);

  // Emptied: the drawer folds away closed, so it doesn't spring open with the next line.
  if (hadLines !== hasLines) {
    setHadLines(hasLines);
    if (!hasLines) setOpen(false);
  }

  useEffect(() => {
    let alive = true;
    const load = () => {
      void loadEstimate()
        .then((module) => {
          if (alive) setMod(module);
        })
        .catch(() => {});
    };
    if (hasLines) {
      load();
      return () => {
        alive = false;
      };
    }
    const cancel = afterLoadIdle(load);
    return () => {
      alive = false;
      cancel();
    };
  }, [hasLines]);

  // The drawer belongs to the price list: on screen only while #prices is.
  useEffect(() => {
    const section = document.getElementById("prices");
    if (!section) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (!entry.isIntersecting) setOpen(false);
      },
      { rootMargin: "-12% 0px -22% 0px" },
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const drawer: DrawerState = hasLines && inView ? (open ? "open" : "closed") : "hidden";
  const total = est.hasRanges ? moneyRange(est.rangeLow, est.rangeHigh) : money(est.exactTotal);
  const Live = mod?.YourEstimate;

  return (
    <aside className="est-aside" aria-label={copy.title} data-drawer={drawer}>
      <button
        type="button"
        className="est-handle"
        aria-expanded={drawer === "open"}
        aria-controls="est-panel"
        tabIndex={drawer === "hidden" ? -1 : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <span>
          {copy.title} · <span className="font-mono tabular-nums">{total}</span>
        </span>
        <span className="est-caret" aria-hidden="true" />
      </button>
      <div id="est-panel" className="est-panel" data-lenis-prevent="" inert={phone && drawer !== "open"}>
        {Live ? <Live copy={copy} onBook={() => setOpen(false)} still={phone && drawer !== "open"} /> : <EmptyEstimate copy={copy} />}
      </div>
    </aside>
  );
}

/** The empty sheet, drawn exactly as the live one draws it. */
function EmptyEstimate({ copy }: { copy: EstimateCopy }) {
  return (
    <CarbonPeel
      state="none"
      copy={
        <Sheet tone="canary" imprint={IMPRINTS.estimate} slip={false} className="est-sheet" bodyClassName="est-body">
          <span />
        </Sheet>
      }
      top={
        <Sheet imprint={IMPRINTS.estimate} slip={false} className="est-sheet" bodyClassName="est-body">
          <header className="est-head">
            <h3 className="est-title">{copy.title}</h3>
            <p className="est-draft">{copy.draft}</p>
          </header>
          <div className="est-scroll">
            <p className="est-empty">{copy.empty}</p>
          </div>
        </Sheet>
      }
    />
  );
}
