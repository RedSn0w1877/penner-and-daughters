"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * "What did you find?" after hydration, one layout per tier (spec §9, §11.3):
 *
 *   full   ONE GSAP pin (20vh intro + 4 × 80vh, "Skip to booking"): the CSS phone receives Ana's
 *          texts, the inspection sheet shows the walk-around, the one WebGL ink diagram with
 *          numbered callouts, and the active line to approve. Scroll drives the diagram through a
 *          DiagramDrive (no React re-render per frame); the pointer adds ±12° of damped yaw.
 *          If WebGL can't run, the same stage plays the pre-rendered frames.
 *   touch  the thread as a stack, then one CSS sticky stage per item playing its frame sequence,
 *          with the line scrolling under it; the wear ruler swaps the wear stills.
 *   lite   one exploded still per item with Previous / Next, the wear stills, no motion.
 *
 * Every tier keeps #inspection-item-1…4 as targets for the symptom guide's links.
 */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type PointerEvent } from "react";
import { DiagramDrive, LazyDiagram } from "@/components/three/lazy-diagram";
import { useCarZones } from "@/components/ui/line-car";
import { Sheet } from "@/components/ui/sheet";
import { IMPRINTS, LABELS } from "@/data/copy";
import {
  ITEMS,
  ITEM_BY_ID,
  PIN_VH,
  TIMING,
  THREAD,
  WEAR,
  arrivedAt,
  nearestWearStill,
  progressAt,
  stageAt,
  type InspectionItem,
} from "@/data/inspection";
import { FRAMES, FRAME_COUNT, WEAR_STILLS } from "@/data/media";
import { cx } from "@/lib/cx";
import { useReducedMotion, type Tier } from "@/lib/tier";
import { Callouts } from "./callouts";
import { whenHeadingToInspection } from "./engaged";
import { CalloutNumber, InspectionStyles, ItemHeading, ItemStill, PartsList, PrevNext, calloutTone } from "./item-static";
import { ItemRow, useApproved, useDeclined } from "./item-row";
import { Lightbox, openLightbox } from "./lightbox";
import { liftOut } from "./lift-out";
import { PhoneThread } from "./phone-thread";
import { SequencePlayer, loadAnchors, type NormAnchors } from "./sequence-player";
import { InspectionSummary } from "./summary";
import { Walkaround } from "./walkaround";
import { WearRuler } from "./wear-ruler";

/** ±12° of pointer yaw on the desktop diagram. */
const YAW_MAX = (12 * Math.PI) / 180;
/** Where a jump link lands inside an item: callouts drawn, holding. */
const LAND_AT = 0.88;

const headerHeight = () =>
  parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 64;

/**
 * Starting pad wear: as found (3 mm). QA: ?pdwear=0…10 starts the ruler elsewhere for one load,
 * so a screenshot can show the grind state. (The stage only mounts on the client.)
 */
function initialWear(): number {
  try {
    const raw = new URLSearchParams(window.location.search).get("pdwear")?.replace(/\D+$/, "");
    const mm = raw ? Number(raw) : NaN;
    if (Number.isInteger(mm) && mm >= 0 && mm <= WEAR.newMM) return mm;
  } catch {
    /* as found */
  }
  return WEAR.asFound;
}

function newDrive() {
  const drive = new DiagramDrive();
  drive.setWear(initialWear());
  return drive;
}

export function InspectionStage({ tier }: { tier: Tier }) {
  return (
    <>
      <InspectionStyles />
      {tier === "full" ? <PinnedStage /> : tier === "touch" ? <TouchStage /> : <LiteStage />}
      {/* The summary sits in the sheet's columns with the walk-around beside it on desktop, so the
          left column is a recap of where she looked, not bare counter. */}
      <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-x-6">
        <div className="hidden lg:col-span-4 lg:flex lg:justify-center">
          <SummaryWalkaround />
        </div>
        <InspectionSummary className="lg:col-span-8" />
      </div>
      <Lightbox />
    </>
  );
}

/** The walk-around beside the summary: every finding's dot, refined by zones-v1.json. */
function SummaryWalkaround() {
  const zones = useCarZones();
  return <Walkaround positions={zones.findings} width={260} />;
}

/* =============================================================================================
 * Desktop full tier: the pin
 * =========================================================================================== */

function PinnedStage() {
  const [drive] = useState(newDrive);
  const snapshot = useSyncExternalStore(drive.subscribe, drive.snapshot, () => "idle:0");
  const status = snapshot.slice(0, snapshot.indexOf(":"));
  const wrapRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ item: 0, arrived: 1 });
  const [mounted, setMounted] = useState(false);
  const [wear, setWear] = useState<number>(() => drive.wear);
  const zones = useCarZones();
  const approved = useApproved();
  const declined = useDeclined();
  const reduced = useReducedMotion();
  const item = ITEMS[view.item];

  // Texts that ask for an answer and haven't had one yet.
  const badge = THREAD.messages
    .slice(0, view.arrived)
    .filter((m) => m.item && !ITEM_BY_ID[m.item].noAction && !approved[m.item] && !declined[m.item]).length;

  useEffect(() => {
    drive.setReducedMotion(reduced);
    if (reduced) drive.setYaw(0);
  }, [drive, reduced]);

  // Mount the canvas once the visitor heads this way ("What's it doing?" mid-screen, or a click on
  // an #inspection link), or once the section is within 1.5 viewports, and never unmount it.
  // Mounting compiles the shaders and warms every part up off the scroll path (it draws nothing
  // visible until the stage is on screen), so a jump straight into the pin is warm. Never at load
  // + idle: a page left alone at the top must draw nothing and run no frames.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        setMounted(true);
      },
      { rootMargin: "150% 0px" },
    );
    io.observe(el);
    const cancelHeading = whenHeadingToInspection(() => setMounted(true));
    return () => {
      io.disconnect();
      cancelHeading();
    };
  }, []);

  // frameloop: "demand" while the stage is on screen, "never" otherwise.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => drive.setVisible(entry.isIntersecting), { rootMargin: "20% 0px" });
    io.observe(el);
    return () => {
      io.disconnect();
      drive.setVisible(false);
    };
  }, [drive]);

  // The pin (one ScrollTrigger, no tween: Lenis already smooths the scroll).
  useEffect(() => {
    let alive = true;
    let kill = () => {};
    let lifted = false;
    const distance = () => (PIN_VH / 100) * window.innerHeight;

    const placeMarkers = () => {
      const box = markersRef.current;
      if (!box) return;
      const d = distance();
      Array.from(box.children).forEach((el, i) => {
        (el as HTMLElement).style.top = `${Math.round(progressAt(i, LAND_AT) * d + 8)}px`;
      });
    };

    const lift = () => {
      const tile = pinRef.current?.querySelector<HTMLElement>('[data-thread-media="pads"]');
      const frame = drive.lastFrame;
      const stage = stageRef.current;
      if (!tile || !frame || !stage || frame.item !== 0) return;
      const pad = frame.layout.find((a) => a.n === 2);
      if (!pad) return;
      const r = stage.getBoundingClientRect();
      liftOut(tile, { x: r.left + pad.x, y: r.top + pad.y });
    };

    const onProgress = (progress: number) => {
      drive.setProgress(progress);
      const s = stageAt(progress);
      const arrived = arrivedAt(progress);
      setView((v) => (v.item === s.item && v.arrived === arrived ? v : { item: s.item, arrived }));
      if (!lifted && s.item === 0 && s.p >= 0.5 && s.p < 0.8) {
        lifted = true;
        requestAnimationFrame(lift);
      }
    };

    void import("@/lib/gsap").then(({ ScrollTrigger }) => {
      const pin = pinRef.current;
      if (!alive || !pin) return;
      const st = ScrollTrigger.create({
        trigger: pin,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        // Above the day chapter's pin: measure first, so pins below include this spacer.
        refreshPriority: 1,
        start: () => `top top+=${headerHeight()}`,
        end: () => `+=${distance()}`,
        onUpdate: (self) => onProgress(self.progress),
        onRefresh: (self) => {
          placeMarkers();
          onProgress(self.progress);
        },
      });
      placeMarkers();
      onProgress(st.progress);
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
      kill = () => st.kill(true);
    });

    return () => {
      alive = false;
      kill();
    };
  }, [drive]);

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / Math.max(1, r.width)) * 2 - 1;
    drive.setYaw(Math.max(-1, Math.min(1, x)) * YAW_MAX);
  };

  const changeWear = useCallback(
    (mm: number) => {
      setWear(mm);
      drive.setWear(mm);
    },
    [drive],
  );

  const failed = status === "failed";
  const ready = status === "ready";
  // Reached the stage before the models were ready (slow network): show the still meanwhile.
  const waiting = mounted && !ready && !failed && snapshot.endsWith(":1");

  return (
    <div ref={wrapRef} className="relative mt-10">
      <div ref={pinRef} data-no-slip="" className="relative h-[calc(100svh-var(--header-h))]">
        <div className="grid h-full grid-cols-12 gap-x-6 py-4">
          <div className="col-span-4 flex min-h-0 items-center justify-center xl:col-span-3">
            <PhoneThread
              variant="phone"
              arrived={view.arrived}
              activeItem={item.id}
              approved={approved}
              badge={badge}
              height="min(600px, calc(100svh - var(--header-h) - 48px))"
              onOpen={openLightbox}
            />
          </div>

          <Sheet
            slip={false}
            imprint={IMPRINTS.inspection}
            className="col-span-8 min-h-0 xl:col-span-9 [&>.sheet-paper]:flex [&>.sheet-paper]:h-full [&>.sheet-paper]:flex-col"
            bodyClassName="@container flex min-h-0 flex-1 flex-col gap-4 p-6 xl:px-8"
          >
            <div className="flex items-start justify-between gap-6">
              <div key={item.id} className="min-w-0 animate-[pd-row-in_260ms_var(--ease-slip)_both]">
                <ItemHeading item={item} />
              </div>
              <div className="flex flex-none flex-col items-end gap-1.5">
                <a href="#book" className="text-link inline-flex min-h-11 items-center text-[15px]">
                  {LABELS.skipToBooking}
                </a>
                <Walkaround active={item.n} positions={zones.findings} width={232} dot={22} caption />
              </div>
            </div>

            <div
              ref={stageRef}
              className="relative min-h-[240px] flex-1"
              onPointerMove={onPointerMove}
              onPointerLeave={() => drive.setYaw(0)}
            >
              {waiting && (
                // eslint-disable-next-line @next/next/no-img-element -- static export: plain <img> through withBase()
                <img
                  src={FRAMES[item.part].still}
                  alt=""
                  aria-hidden="true"
                  width={FRAMES[item.part].stillWidth}
                  height={FRAMES[item.part].stillHeight}
                  decoding="async"
                  className="absolute inset-0 size-full object-contain px-[18%] opacity-70"
                />
              )}
              {failed ? (
                <SequencePlayer drive={drive} />
              ) : (
                mounted && (
                  <div className={cx("absolute inset-0 transition-opacity duration-500", ready ? "opacity-100" : "opacity-0")}>
                    <LazyDiagram drive={drive} />
                  </div>
                )
              )}
              <Callouts key={item.id} item={item} drive={drive} mode="leaders" />
            </div>
            {/* Wide stages label every callout in the gutters; narrower ones list the words here. */}
            <PartsList item={item} columns={2} className="text-[14px] @min-[720px]:sr-only" />

            <div className="flex flex-wrap items-start gap-x-8 gap-y-4 border-t border-rule pt-4">
              <div key={item.id} className="min-w-[min(100%,27rem)] flex-1 animate-[pd-row-in_260ms_var(--ease-slip)_both]">
                <ItemRow item={item} />
              </div>
              {/* The ruler's slot stays for every item (invisible and inert off the pads), so the
                  stage above keeps one size and changing items shifts nothing. */}
              <div className={cx("w-full max-w-[25rem]", item.id !== "pads" && "invisible")} inert={item.id !== "pads"}>
                <WearRuler value={wear} onChange={changeWear} />
              </div>
            </div>
          </Sheet>
        </div>
      </div>

      {/* Jump targets inside the pin: each lands on its item with the callouts drawn. */}
      <div ref={markersRef} aria-hidden="true">
        {ITEMS.map((it) => (
          <span key={it.id} id={it.domId} className="pointer-events-none absolute left-0 h-px w-px" />
        ))}
      </div>
    </div>
  );
}

/* =============================================================================================
 * Touch: sticky stages with frame sequences
 * =========================================================================================== */

function TouchItem({ item }: { item: InspectionItem }) {
  const [drive] = useState(newDrive);
  const ref = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [wear, setWear] = useState<number>(() => drive.wear);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const stuck = stickyRef.current?.offsetHeight ?? 0;
      const travel = Math.max(1, r.height - stuck - 24);
      const stickAt = headerHeight() + 8;
      // The part assembles in (0 → 15%) while the stage rises from the lower quarter of the screen
      // to where it sticks, so it's never an empty frame when it lands; EXPLODE, the callouts and
      // the hold (15 → 100%) play while the line scrolls under the stuck stage.
      const enterAt = Math.max(stickAt + 1, window.innerHeight * 0.75);
      const p =
        r.top > stickAt
          ? TIMING.assembleEnd * (1 - (r.top - stickAt) / (enterAt - stickAt))
          : TIMING.assembleEnd + (1 - TIMING.assembleEnd) * ((stickAt - r.top) / travel);
      drive.setLocal({ item: item.n - 1, p: Math.max(0, Math.min(1, p)) });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const io = new IntersectionObserver(([entry]) => {
      drive.setVisible(entry.isIntersecting);
      if (entry.isIntersecting) {
        window.addEventListener("scroll", onScroll, { passive: true });
        update();
      } else {
        window.removeEventListener("scroll", onScroll);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [drive, item.n]);

  const changeWear = (mm: number) => {
    setWear(mm);
    drive.setWear(mm);
  };

  return (
    <article id={item.domId} ref={ref} className="relative mt-12 first-of-type:mt-8">
      <div ref={stickyRef} className="sticky top-[calc(var(--header-h)+8px)] z-10 bg-paper pb-3 pt-1">
        <ItemHeading item={item} />
        <div className="relative mt-3 aspect-[16/10] w-full overflow-hidden rounded-[2px] border border-rule bg-paper">
          <SequencePlayer part={item.part} drive={drive} />
          <Callouts item={item} drive={drive} mode="dots" />
        </div>
      </div>
      <div className="relative z-0 pt-[42svh]">
        <ItemRow item={item} />
        {item.id === "pads" && <WearRuler value={wear} onChange={changeWear} className="mt-7" />}
        <PartsList item={item} className="mt-7" />
      </div>
    </article>
  );
}

function TouchStage() {
  const zones = useCarZones();
  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <PhoneThread variant="stack" onOpen={openLightbox} className="mx-auto max-w-[420px] lg:sticky lg:top-[calc(var(--header-h)+16px)]" />
      </div>
      <Sheet imprint={IMPRINTS.inspection} slip={false} className="lg:col-span-8 [&>.sheet-paper]:overflow-visible">
        <Walkaround positions={zones.findings} width={260} />
        {ITEMS.map((item) => (
          <TouchItem key={item.id} item={item} />
        ))}
      </Sheet>
    </div>
  );
}

/* =============================================================================================
 * Lite: one exploded still per item, Previous / Next, the wear stills
 * =========================================================================================== */

/** Keep numbered dots at least `min` px apart on a w × h still (anchors that nearly coincide). */
function nudgeApart(points: NormAnchors[number], w: number, h: number, min: number): NormAnchors[number] {
  if (!w || !h) return points;
  const p = points.map((a) => ({ ...a, px: a.x * w, py: a.y * h }));
  for (let pass = 0; pass < 24; pass++) {
    let moved = false;
    for (let i = 0; i < p.length; i++) {
      for (let j = i + 1; j < p.length; j++) {
        let dx = p[j].px - p[i].px;
        let dy = p[j].py - p[i].py;
        let d = Math.hypot(dx, dy);
        if (d >= min) continue;
        if (d < 0.01) {
          dx = 1;
          dy = -1;
          d = Math.SQRT2;
        }
        const push = (min - d) / 2 + 0.25;
        p[i].px -= (dx / d) * push;
        p[i].py -= (dy / d) * push;
        p[j].px += (dx / d) * push;
        p[j].py += (dy / d) * push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return p.map(({ px, py, ...a }) => ({ ...a, x: px / w, y: py / h }));
}

function StillDots({ item }: { item: InspectionItem }) {
  const ref = useRef<HTMLDivElement>(null);
  const [points, setPoints] = useState<NormAnchors[number] | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let alive = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        void loadAnchors(item.part).then((frames) => {
          if (alive) setPoints(nudgeApart(frames[FRAME_COUNT - 1] ?? [], el.clientWidth, el.clientHeight, 26));
        });
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => {
      alive = false;
      io.disconnect();
    };
  }, [item.part]);

  return (
    <div ref={ref} aria-hidden="true" className="absolute inset-0">
      {points?.map((p) => {
        const c = item.callouts.find((x) => x.n === p.n);
        if (!c || p.hidden) return null;
        return (
          <span key={p.n} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}>
            <CalloutNumber n={c.n} tone={calloutTone(item, c)} size={22} className="shadow-[0_0_0_2px_var(--paper)]" />
          </span>
        );
      })}
    </div>
  );
}

function LiteItem({ item }: { item: InspectionItem }) {
  const [wear, setWear] = useState<number>(initialWear);
  const worn =item.id === "pads" && wear !== WEAR.asFound ? WEAR_STILLS[nearestWearStill(wear)] : undefined;
  return (
    <article id={item.domId} className="mt-10 border-t border-rule pt-8 first-of-type:mt-8 first-of-type:border-t-0 first-of-type:pt-0">
      <ItemHeading item={item} />
      <div className="mt-4">
        <ItemStill item={item} src={worn} overlay={<StillDots item={item} />} />
      </div>
      <PartsList item={item} className="mt-5" />
      <ItemRow item={item} className="mt-6" />
      {item.id === "pads" && <WearRuler value={wear} onChange={setWear} className="mt-6" />}
      <PrevNext item={item} className="mt-4" />
    </article>
  );
}

function LiteStage() {
  const zones = useCarZones();
  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <PhoneThread variant="stack" onOpen={openLightbox} className="mx-auto max-w-[420px]" />
      </div>
      <Sheet imprint={IMPRINTS.inspection} className="lg:col-span-8">
        <Walkaround positions={zones.findings} width={260} />
        {ITEMS.map((item) => (
          <LiteItem key={item.id} item={item} />
        ))}
      </Sheet>
    </div>
  );
}
