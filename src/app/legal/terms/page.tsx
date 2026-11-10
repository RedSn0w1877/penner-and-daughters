// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { IMPRINTS } from "@/data/copy";
import { SHOP } from "@/lib/facts";

export const metadata: Metadata = {
  title: "Terms",
  description: `Terms of use for the ${SHOP.name} portfolio sample by HVNF Studios.`,
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      updated="Last updated October 31, 2026."
      imprint={IMPRINTS.terms}
      sections={[
        {
          heading: "This is a portfolio sample.",
          body: (
            <p>
              {SHOP.name} is a fictional business. HVNF Studios made this site to show the kind of website we build for
              independent repair shops. No real shop, address, phone number or staff is behind it.
            </p>
          ),
        },
        {
          heading: "Nothing here is a service or an offer.",
          body: (
            <p>
              Prices, hours, warranty terms and availability on this site are part of the sample. You can&apos;t book, buy
              or arrange anything here, and the 555 phone numbers don&apos;t connect.
            </p>
          ),
        },
        {
          heading: "Car advice is general.",
          body: (
            <p>
              The symptom guide gives general information and can&apos;t see your car. If anything feels unsafe, pull over
              and call a real repair shop or roadside assistance.
            </p>
          ),
        },
        {
          heading: "AI-generated and stock media.",
          body: (
            <p>
              The photos and videos of the shop on this site are AI-generated for the sample and labeled that way. One clip,
              a torque wrench on a wheel, is stock footage from Pexels (Pexels License) and is labeled as stock footage. The
              parts diagrams are 3D renders. None of it shows a real {SHOP.shortName}, because there isn&apos;t one.
            </p>
          ),
        },
        {
          heading: "Who owns this.",
          body: (
            <p>
              © 2026 HVNF Studios. All rights reserved. The design, code, 3D models, images, footage and words are
              proprietary. Don&apos;t copy, redistribute or reuse any part of this site, including as a template or as
              training data, without written permission from HVNF Studios.
            </p>
          ),
        },
        {
          heading: "No warranty.",
          body: <p>The site is provided as is, for demonstration only.</p>,
        },
      ]}
    />
  );
}
