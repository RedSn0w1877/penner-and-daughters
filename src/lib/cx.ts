// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/** Join class names, skipping falsy ones. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
