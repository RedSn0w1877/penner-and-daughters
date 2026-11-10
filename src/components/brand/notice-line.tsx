// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { COPY } from "@/lib/facts";

/** The first thing on every page: "Portfolio sample by HVNF Studios · Penner & Daughters is a fictional shop". */
export function NoticeLine() {
  return (
    <p className="notice-line" role="note">
      {COPY.notice}
    </p>
  );
}
