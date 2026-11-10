"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Islands: big below-the-fold parts of the home page that keep complete server HTML (no-JS,
 * search, first paint) without shipping that HTML a second time as RSC data in index.html, and
 * without putting their code in the first load.
 *
 * A server component normally ships twice: once as HTML and again in the inline RSC payload, so
 * React can hydrate it. An island is a client component whose RSC entry is just a reference. On
 * the server it renders its content synchronously (a server-only require, dead code in the
 * browser bundle). In the browser, hydration keeps the server DOM as it is: the wrapper hydrates
 * with an empty dangerouslySetInnerHTML, which React never compares or patches, and it doesn't
 * walk or delete the children it can't see. Then:
 *
 *   static     nothing else happens on first load (the symptom guide, the street map: plain HTML
 *              whose only interactivity is CSS, <details> and links).
 *   activate   the live component's chunk loads when the island comes within reach of the
 *              viewport (or is pointed at, touched or focused; or at load + idle on the desktop
 *              full tier when asked), and it replaces the server DOM with the same markup, now
 *              interactive, in a transition.
 *
 * After a client-side navigation there is no server DOM to keep, so both kinds load their chunk
 * and render normally.
 *
 * No Suspense boundary is involved on the server on purpose: React streams any boundary past the
 * first ~12 KB out of line (hidden, revealed by an inline script), which would hide it without JS.
 */
import { startTransition, useEffect, useRef, useState, useSyncExternalStore, type ComponentType } from "react";
import { useTier } from "@/lib/tier";
import { afterLoadIdle } from "@/lib/use-media";

const noopSubscribe = () => () => {};

/** True while React is hydrating (and on the server); false in a plain client render. */
function useHydrating(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => false,
    () => true,
  );
}

const KEEP_SERVER_HTML = { __html: "" };

interface IslandOptions<P> {
  /** Server only: the component itself (a require behind typeof window, so the browser never bundles it). */
  server: ComponentType<P> | null;
  /** Browser: the component's chunk (islands of one section share one import, so shared code ships once). */
  load: () => Promise<ComponentType<P>>;
  mode: "static" | "activate";
  /** activate: how far ahead of the viewport to start (IntersectionObserver rootMargin). */
  margin?: string;
  /** activate: on the desktop full tier, also start at load + idle (the day chapter's film upgrade). */
  idleOnFull?: boolean;
}

function island<P extends object>({ server: Server, load, mode, margin = "150% 0px", idleOnFull = false }: IslandOptions<P>) {
  let pending: Promise<ComponentType<P>> | null = null;
  const get = () =>
    (pending ??= load().catch((error: unknown) => {
      pending = null;
      throw error;
    }));

  function Island(props: P) {
    const hydrating = useHydrating();
    // Decided on the first render and kept: an island that hydrated over server HTML keeps it until
    // it activates, even after hydration ends (when useHydrating flips to false).
    const [kept] = useState(hydrating);
    const [Live, setLive] = useState<ComponentType<P> | null>(null);
    const ref = useRef<HTMLDivElement>(null);
    const tier = useTier();

    useEffect(() => {
      if (Live) return;
      // Static islands that kept their server HTML never need the chunk.
      if (kept && mode === "static") return;
      let alive = true;
      let started = false;
      const el = ref.current;
      const wake = ["pointerover", "touchstart", "focusin"] as const;
      let io: IntersectionObserver | null = null;
      let cancelIdle = () => {};
      const stop = () => {
        io?.disconnect();
        cancelIdle();
        wake.forEach((type) => el?.removeEventListener(type, go));
      };
      function go() {
        if (started) return;
        started = true;
        stop();
        void get()
          .then((component) => {
            if (alive) startTransition(() => setLive(() => component));
          })
          .catch(() => {
            started = false;
          });
      }
      if (!kept) {
        go();
      } else if (el) {
        io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && go(), { rootMargin: margin });
        // The wrapper is display: contents (no box, so it never intersects): watch the server
        // DOM's own top-level elements instead.
        for (const child of Array.from(el.children)) io.observe(child);
        wake.forEach((type) => el.addEventListener(type, go, { passive: true }));
        if (idleOnFull && tier === "full") cancelIdle = afterLoadIdle(go);
      }
      return () => {
        alive = false;
        stop();
      };
    }, [Live, kept, tier]);

    if (Server) {
      return (
        <div className="contents" data-island="">
          <Server {...props} />
        </div>
      );
    }
    if (Live) {
      return (
        <div ref={ref} className="contents" data-island="">
          <Live {...props} />
        </div>
      );
    }
    // Hydrating over server HTML (kept) or waiting for the chunk after a client navigation.
    return <div ref={ref} className="contents" data-island="" dangerouslySetInnerHTML={KEEP_SERVER_HTML} suppressHydrationWarning />;
  }
  return Island;
}

/* eslint-disable @typescript-eslint/no-require-imports -- server-only requires: `typeof window` is
   a build-time constant, so the browser bundle drops each branch (and the module) entirely. */
const onServer = typeof window === "undefined";

/** The full symptom guide (35 entries). The triage tool replaces it after load + idle. */
export const SymptomGuideIsland = island({
  server: onServer ? (require("@/components/triage/symptom-guide-ssr") as typeof import("@/components/triage/symptom-guide-ssr")).SymptomGuideSSR : null,
  load: () => import("@/components/triage/symptom-guide-ssr").then((m) => m.SymptomGuideSSR),
  mode: "static",
});

/** The inspection as plain paper (no-JS, and until the tier's stage swaps in after load + idle). */
export const InspectionStaticIsland = island({
  server: onServer ? (require("@/components/inspection/static-sheet") as typeof import("@/components/inspection/static-sheet")).InspectionStatic : null,
  load: () => import("@/components/inspection/static-sheet").then((m) => m.InspectionStatic),
  mode: "static",
});

/** The ink street map: its hover, focus and tap loops are pure CSS. */
export const StreetMapIsland = island({
  server: onServer ? (require("@/components/location/street-map") as typeof import("@/components/location/street-map")).StreetMap : null,
  load: () => import("@/components/location/street-map").then((m) => m.StreetMap),
  mode: "static",
});

/** The price list (nine groups of rows, the vehicle tabs, the Add buttons). */
export const RateSheetIsland = island({
  server: onServer ? (require("@/components/estimate/rate-sheet") as typeof import("@/components/estimate/rate-sheet")).RateSheet : null,
  load: () => import("@/components/estimate/prices-parts").then((m) => m.RateSheet),
  mode: "activate",
});

/** The stacked day sheet (the night, the dawn, the seven steps), and its desktop film upgrade. */
export const StackedDayIsland = island({
  server: onServer ? (require("@/components/day/stacked-day") as typeof import("@/components/day/stacked-day")).StackedDayUpgrade : null,
  load: () => import("@/components/day/day-parts").then((m) => m.StackedDayUpgrade),
  mode: "activate",
  idleOnFull: true,
});

/** "Your estimate": the sticky sheet on desktop, the drawer on phones (it lives inside #prices). */
export const EstimateDrawerIsland = island({
  server: onServer ? (require("@/components/estimate/estimate-drawer") as typeof import("@/components/estimate/estimate-drawer")).EstimateDrawer : null,
  load: () => import("@/components/estimate/prices-parts").then((m) => m.EstimateDrawer),
  mode: "activate",
});

/** "Track my car" (the home page card; /track/ renders the tracker directly). */
export const TrackerIsland = island({
  server: onServer ? (require("@/components/day/tracker") as typeof import("@/components/day/tracker")).Tracker : null,
  load: () => import("@/components/day/day-parts").then((m) => m.Tracker),
  mode: "activate",
});

/** The warranty card (tilt and flip) and the ratcheting promise lines. */
export const WarrantyCardIsland = island({
  server: onServer ? (require("@/components/warranty/warranty-card") as typeof import("@/components/warranty/warranty-card")).WarrantyCard : null,
  load: () => import("@/components/warranty/warranty-parts").then((m) => m.WarrantyCard),
  mode: "activate",
});
export const RatchetLinesIsland = island({
  server: onServer ? (require("@/components/warranty/ratchet-lines") as typeof import("@/components/warranty/ratchet-lines")).RatchetLines : null,
  load: () => import("@/components/warranty/warranty-parts").then((m) => m.RatchetLines),
  mode: "activate",
});

/** The hours table (today circled) and Directions / Copy address on the location sheet. */
export const HoursTableIsland = island({
  server: onServer ? (require("@/components/location/hours-table") as typeof import("@/components/location/hours-table")).HoursTable : null,
  load: () => import("@/components/location/location-parts").then((m) => m.HoursTable),
  mode: "activate",
});
export const DirectionsActionsIsland = island({
  server: onServer
    ? (require("@/components/location/directions-actions") as typeof import("@/components/location/directions-actions")).DirectionsActions
    : null,
  load: () => import("@/components/location/location-parts").then((m) => m.DirectionsActions),
  mode: "activate",
});
/* eslint-enable @typescript-eslint/no-require-imports */
