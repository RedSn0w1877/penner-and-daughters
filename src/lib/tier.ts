"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Three experience tiers (spec §9), decided once per page load:
 *
 *   lite  = prefers-reduced-motion, Save-Data, a 3G-or-slower connection, or ≤ 2 GB device memory.
 *   full  = not lite, a fine pointer, ≥ 1024px wide, WebGL2 in the browser, ≥ 4 cores and
 *           (unknown or ≥ 4 GB) memory. Only full gets Lenis, the pins and the WebGL diagram.
 *   touch = everything else.
 *
 * The server render and the hydrating render see `null`, so markup is always the lite-safe
 * version (posters, stills, static text); enhancements mount on the next commit.
 *
 * WebGL2 is checked by the presence of the API, never by creating a context: exactly one
 * WebGL context may exist on the page (the inspection diagram), and a probe would be a second.
 * A failed context creation is handled where the canvas lives (it falls back to frames).
 *
 * QA override: ?tier=full|touch|lite in the URL forces a tier for this load.
 */
import { useSyncExternalStore } from "react";
import { useMedia } from "./use-media";

export type Tier = "full" | "touch" | "lite";

type NavigatorExtras = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string };
  deviceMemory?: number;
};

let cached: Tier | null = null;

function override(): Tier | null {
  try {
    const t = new URLSearchParams(window.location.search).get("tier")?.replace(/\W+$/, "");
    return t === "full" || t === "touch" || t === "lite" ? t : null;
  } catch {
    return null;
  }
}

function compute(): Tier {
  const forced = override();
  if (forced) return forced;

  const nav = navigator as NavigatorExtras;
  const mq = (q: string) => window.matchMedia(q).matches;
  const memory = nav.deviceMemory;
  const conn = nav.connection;

  const slowNet = Boolean(conn && (conn.saveData || ["slow-2g", "2g", "3g"].includes(conn.effectiveType ?? "")));
  if (mq("(prefers-reduced-motion: reduce)") || slowNet || (memory !== undefined && memory <= 2)) return "lite";

  const webgl2 = typeof window.WebGL2RenderingContext !== "undefined";
  const cores = nav.hardwareConcurrency ?? 8;
  if (
    mq("(pointer: fine)") &&
    mq("(min-width: 1024px)") &&
    webgl2 &&
    cores >= 4 &&
    (memory === undefined || memory >= 4)
  ) {
    return "full";
  }
  return "touch";
}

/** The tier for this page load. Client only; on the server it answers "lite". */
export function getTier(): Tier {
  if (typeof window === "undefined") return "lite";
  cached ??= compute();
  return cached;
}

const subscribeNever = () => () => {};

/** null before hydration, then the page's tier. Stable for the life of the page. */
export function useTier(): Tier | null {
  return useSyncExternalStore(subscribeNever, getTier, () => null);
}

/** Live prefers-reduced-motion. False on the server and during hydration. */
export function useReducedMotion(): boolean {
  return useMedia("(prefers-reduced-motion: reduce)");
}
