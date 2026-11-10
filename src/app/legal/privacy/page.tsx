// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { IMPRINTS } from "@/data/copy";
import { SHOP } from "@/lib/facts";

export const metadata: Metadata = {
  title: "Privacy",
  description: `Privacy notice for the ${SHOP.name} portfolio sample by HVNF Studios: it collects nothing.`,
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      updated="Last updated October 31, 2026."
      imprint={IMPRINTS.privacy}
      sections={[
        {
          heading: "This sample collects nothing.",
          body: <p>No cookies, no analytics, no trackers, no ads. There&apos;s no server behind the booking form.</p>,
        },
        {
          heading: "What stays in your browser.",
          body: (
            <p>
              If you start a booking, your draft is kept in this tab&apos;s session storage so a reload doesn&apos;t lose
              it. It&apos;s deleted when you close the tab. Your estimate lives in the page&apos;s memory and is gone when
              you leave.
            </p>
          ),
        },
        {
          heading: "Calls and texts.",
          body: (
            <p>
              Call and text buttons open your own phone or messaging app. The 555 numbers are fictional and won&apos;t
              connect.
            </p>
          ),
        },
        {
          heading: "Fonts and media.",
          body: (
            <p>
              Fonts, images, video and 3D models are served from this site. Nothing loads from third-party servers.
            </p>
          ),
        },
      ]}
      closing="© 2026 HVNF Studios. Portfolio sample — do not redistribute."
    />
  );
}
