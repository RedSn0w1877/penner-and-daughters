// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import type { Metadata, Viewport } from "next";
import { Archivo, Atkinson_Hyperlegible_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { JsonLd } from "@/components/brand/json-ld";
import { NoticeLine } from "@/components/brand/notice-line";
import { SkipLinks } from "@/components/chrome/skip-links";
import { TearOffBar } from "@/components/chrome/tear-off-bar";
import { LazyToaster } from "@/components/providers/lazy-toaster";
import { SlipController } from "@/components/providers/slip";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll";
import { SiteFooter } from "@/components/sections/site-footer";
import { SiteHeader } from "@/components/sections/site-header";
import { BASE_PATH, withBase } from "@/lib/base-path";
import { COPYRIGHT_NOTICE, STUDIO } from "@/lib/copyright";
import { SHOP } from "@/lib/facts";

// Two faces: Archivo (variable weight and width) for words, Atkinson Hyperlegible Mono for figures.
// Both self-hosted by next/font at build time and preloaded; nothing loads from Google at runtime.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], display: "swap", variable: "--font-archivo", fallback: ["Arial", "sans-serif"] });
const mono = Atkinson_Hyperlegible_Mono({ subsets: ["latin"], display: "swap", variable: "--font-atkinson-mono", fallback: ["ui-monospace", "monospace"] });

const TITLE = "Auto Repair in Halden Crossing | Penner & Daughters (portfolio sample)";
const DESCRIPTION =
  "Brakes, check-engine lights, AC, batteries and more in Halden Crossing. Photos and a written price before any work. A fictional shop: HVNF Studios portfolio sample.";

export const metadata: Metadata = {
  // Next already prefixes file-based metadata URLs (opengraph-image.jpg, icon.svg) with the basePath,
  // then joins them onto metadataBase's path. With the base path in both, og:image would read
  // /penner-and-daughters/penner-and-daughters/…, so production uses the bare origin.
  metadataBase: new URL(BASE_PATH ? new URL(SHOP.siteUrl).origin : SHOP.siteUrl),
  title: { default: TITLE, template: "%s | Penner & Daughters (portfolio sample)" },
  description: DESCRIPTION,
  applicationName: SHOP.name,
  authors: [{ name: STUDIO }],
  creator: STUDIO,
  publisher: STUDIO,
  // A demonstration: crawlers may read the pages (robots.txt allows it) but must not index them.
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  openGraph: {
    type: "website",
    siteName: "Penner & Daughters Auto Repair (portfolio sample)",
    title: TITLE,
    description: DESCRIPTION,
  },
  other: {
    copyright: COPYRIGHT_NOTICE,
    "dcterms.rightsHolder": STUDIO,
  },
};

export const viewport: Viewport = {
  themeColor: "#C9CDD1",
  colorScheme: "light",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${mono.variable}`} suppressHydrationWarning>
      <body>
        {/* Before first paint: lets CSS start pen strokes unwritten only when JS will write them. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        {/* Machine-readable pointer to the license terms (a raw <link> needs the base path by hand). */}
        <link rel="license" href={withBase("/legal/terms/")} />
        <SmoothScrollProvider>
          <SkipLinks />
          <NoticeLine />
          <SiteHeader />
          {/* overflow-x: clip (not hidden): tilted prints and carbon copies can't widen the page,
              and sticky elements and GSAP pins inside still work. */}
          <main id="main" tabIndex={-1} className="overflow-x-clip outline-none">
            {children}
          </main>
          <SiteFooter />
          <TearOffBar />
        </SmoothScrollProvider>
        <SlipController />
        <LazyToaster />
        <JsonLd />
      </body>
    </html>
  );
}
