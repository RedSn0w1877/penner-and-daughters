// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Production serves this site under /penner-and-daughters (a GitHub Pages project path).
 * next/link, next/font and the build's own chunks get that prefix for free; raw strings
 * do not (an <img src>, a <video> <source>, a fetch() URL, a GLB path). So every runtime
 * URL that points into public/ goes through withBase().
 *
 * The value comes from next.config.ts (env NEXT_PUBLIC_BASE_PATH): "" in dev, the repo path
 * in production. Next inlines NEXT_PUBLIC_* at build time, so this costs nothing at runtime.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const ABSOLUTE = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

export function withBase(path: string): string {
  if (!path) return BASE_PATH || "/";
  // Leave full URLs (https:, data:, blob:, tel:, sms:) and in-page hashes alone.
  if (ABSOLUTE.test(path) || path.startsWith("#")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  // Already prefixed (someone passed a withBase() result back in): don't double it.
  if (BASE_PATH && (p === BASE_PATH || p.startsWith(`${BASE_PATH}/`))) return p;
  return `${BASE_PATH}${p}`;
}
