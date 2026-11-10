// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { CallButton } from "@/components/ui/buttons";
import { Sheet } from "@/components/ui/sheet";
import { IMPRINTS } from "@/data/copy";

export const metadata: Metadata = {
  title: "Part not found",
};

/** The 404, as a return tag. GitHub Pages serves it for any unknown path under the site. */
export default function NotFound() {
  return (
    <div className="counter-wrap pb-24 pt-10 lg:pt-20">
      <Sheet imprint={IMPRINTS.returnTag} className="mx-auto max-w-2xl" slip={false} bodyClassName="lg:px-14 lg:py-14">
        <h1 className="type-h1 overflow-x-clip">Part not found.</h1>
        <p className="type-lead mt-6 max-w-[40ch] text-graphite">That page isn&apos;t on the shelf. It may have moved.</p>
        <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
          <CallButton size="lg" />
          <Link href="/" className="text-link text-[17px]">
            Back to the front counter
          </Link>
        </div>
      </Sheet>
    </div>
  );
}
