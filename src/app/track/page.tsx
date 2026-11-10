// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import type { Metadata } from "next";
import { Tracker } from "@/components/day/tracker";
import { TRACKER_COPY } from "@/data/day";

export const metadata: Metadata = {
  title: TRACKER_COPY.title,
};

/** /track/: the Track my car card on its own, with the card's title as the page's H1. */
export default function TrackPage() {
  return (
    <div className="counter-wrap pb-24 pt-8 lg:pb-32 lg:pt-14">
      <Tracker standalone className="mx-auto max-w-2xl" />
    </div>
  );
}
