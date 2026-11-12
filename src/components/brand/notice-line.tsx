// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { COPY } from "@/lib/facts";

/**
 * The first thing on every page: "Portfolio sample by HVNF Studios · Penner & Daughters is a
 * fictional shop". Under 480px the short form ("… · fictional shop") keeps it to one line.
 */
export function NoticeLine() {
  return (
    <p className="notice-line" role="note">
      <span className="min-[480px]:hidden">{COPY.noticeShort}</span>
      <span className="hidden min-[480px]:inline">{COPY.notice}</span>
    </p>
  );
}
