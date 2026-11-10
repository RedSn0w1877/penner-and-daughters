// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * next/link with prefetching off by default. Every page here is a full static HTML file, so a plain
 * navigation already works; prefetching only spent bytes (the home page fetched its own ~340 KB RSC
 * payload through the logo link) and, on a plain static host, asked for segment files the export
 * doesn't write under those names. Pass prefetch explicitly to opt a link back in.
 */
import NextLink from "next/link";
import type { ComponentProps } from "react";

export default function Link({ prefetch = false, ...props }: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={prefetch} {...props} />;
}
