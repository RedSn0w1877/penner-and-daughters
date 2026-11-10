// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import Link from "@/components/ui/link";
import type { ReactNode } from "react";
import { Sheet } from "@/components/ui/sheet";

export interface LegalSection {
  heading: string;
  body: ReactNode;
}

/** Terms and Privacy: one plain sheet on the counter, headings as short sentences. */
export function LegalPage({
  title,
  updated,
  sections,
  imprint,
  closing,
}: {
  title: string;
  updated: string;
  sections: readonly LegalSection[];
  imprint: string;
  closing?: ReactNode;
}) {
  return (
    <div className="counter-wrap pb-24 pt-8 lg:pt-14">
      <Sheet as="article" imprint={imprint} className="mx-auto max-w-3xl" slip={false} bodyClassName="lg:px-14 lg:py-14">
        <Link href="/" className="text-link text-[15px]">
          Back to the front counter
        </Link>
        <h1 className="type-h2 mt-8">{title}</h1>
        <p className="type-label mt-3">{updated}</p>
        <div className="mt-10 flex flex-col">
          {sections.map((s) => (
            <section key={s.heading} className="border-t border-dashed border-rule py-6 first:border-t-0 first:pt-0">
              <h2 className="type-h3">{s.heading}</h2>
              <div className="mt-2 max-w-[68ch] space-y-3 text-graphite">{s.body}</div>
            </section>
          ))}
        </div>
        {closing && <p className="mt-4 text-[15px] text-graphite">{closing}</p>}
      </Sheet>
    </div>
  );
}
