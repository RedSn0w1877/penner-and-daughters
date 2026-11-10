"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The only piece of "What did you find?" in the first-load JS. It shows the server-rendered
 * inspection (the no-JS / lite-safe markup it's given as children) until it knows the tier, then
 * swaps in the right stage, loaded on demand: at idle, or as soon as the section comes within two
 * viewports. On the desktop full tier it also starts the three.js chunk and the four part models
 * once "What's it doing?" reaches mid-screen (or an #inspection link is clicked), so the diagram is
 * ready before the pin.
 */
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { useTier, type Tier } from "@/lib/tier";
import { afterLoadIdle } from "@/lib/use-media";
import { whenHeadingToInspection } from "./engaged";

type StageComponent = ComponentType<{ tier: Tier }>;

export function InspectionEnhance({ children }: { children: ReactNode }) {
  const tier = useTier();
  const [Stage, setStage] = useState<StageComponent | null>(null);

  useEffect(() => {
    if (!tier) return;
    let alive = true;
    let requested = false;
    const load = () => {
      if (requested) return;
      requested = true;
      void import("./stage")
        .then((m) => {
          if (alive) setStage(() => m.InspectionStage);
        })
        .catch(() => {
          requested = false;
        });
    };
    const cancelIdle = afterLoadIdle(load);
    const root = document.getElementById("inspection");
    const io = root
      ? new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) load();
          },
          { rootMargin: "200% 0px" },
        )
      : null;
    if (root) io?.observe(root);
    return () => {
      alive = false;
      cancelIdle();
      io?.disconnect();
    };
  }, [tier]);

  // Full tier: fetch the 3D chunk (which also preloads the GLBs) once the visitor heads this way
  // ("What's it doing?" mid-screen, or a click on any #inspection link, before the jump begins),
  // so the diagram is ready before the pin. Not at load + idle: parsing three.js and decoding the
  // models would land in the idle-at-the-top window.
  useEffect(() => {
    if (tier !== "full") return;
    return whenHeadingToInspection(() => {
      void import("@/components/three/diagram-canvas").catch(() => {});
    });
  }, [tier]);

  return Stage && tier ? <Stage tier={tier} /> : <>{children}</>;
}
