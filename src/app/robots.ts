// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import type { MetadataRoute } from "next";

// Static export: this route has no request-time input.
export const dynamic = "force-static";

/**
 * Crawling is allowed on purpose: a crawler has to read a page to see its noindex, nofollow
 * robots meta (every page carries one). Blocking here would let URLs be indexed without content.
 * No sitemap: nothing here should be listed.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
  };
}
