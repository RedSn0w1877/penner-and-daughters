"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The carbon moment. "Your estimate" is a two-part form: a white top sheet you work on, over a
 * canary copy that takes everything you write. When every line is approved and the estimate is on
 * screen, a blue APPROVED BY YOU stamp lands ("stamped"), then the top sheet slides away (700 ms)
 * and leaves the canary copy: "Your copy. Take it to any shop." ("peeled"). Reduced motion swaps
 * the two with a 150 ms cross-fade instead. Add or un-approve a line and the top sheet is back.
 */
import { useEffect, useState, type ReactNode, type Ref, type RefObject } from "react";
import { useInView } from "@/lib/use-media";

export type PeelState = "none" | "stamped" | "peeled";

/** Stamp → peel, played once the stack is at least a third on screen. */
export function usePeel(allApproved: boolean, ref: RefObject<HTMLElement | null>, reduced: boolean): PeelState {
  const inView = useInView(ref, { threshold: 0.3 });
  const [state, setState] = useState<PeelState>("none");
  const [approvedBefore, setApprovedBefore] = useState(allApproved);

  // A line was added or un-approved: back to the top sheet for next time.
  if (approvedBefore !== allApproved) {
    setApprovedBefore(allApproved);
    if (!allApproved) setState("none");
  }

  useEffect(() => {
    if (!allApproved) return;
    if (state === "none" && inView) {
      const t = setTimeout(() => setState("stamped"), 180);
      return () => clearTimeout(t);
    }
    if (state === "stamped") {
      // Let the stamp land and sit for a beat before the sheet goes.
      const t = setTimeout(() => setState("peeled"), reduced ? 260 : 950);
      return () => clearTimeout(t);
    }
  }, [allApproved, inView, state, reduced]);

  return allApproved ? state : "none";
}

/** The two layers in one grid cell: the canary copy underneath, the top sheet above it. */
export function CarbonPeel({
  state,
  top,
  copy,
  ref,
}: {
  state: PeelState;
  top: ReactNode;
  copy: ReactNode;
  ref?: Ref<HTMLDivElement>;
}) {
  const peeled = state === "peeled";
  return (
    <div ref={ref} className="est-stack" data-peel={state}>
      <div className="est-layer est-copy" data-motion-ok="" inert={!peeled} aria-hidden={peeled ? undefined : true}>
        {copy}
      </div>
      <div className="est-layer est-top" data-motion-ok="" inert={peeled} aria-hidden={peeled ? true : undefined}>
        {top}
      </div>
    </div>
  );
}
