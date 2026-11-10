// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { ServicePage } from "@/components/services/service-page";
import { SERVICE_PAGES, SERVICE_PAGE_BY_SLUG, type ServicePageSlug } from "@/data/services";

/** The eight service pages are the whole set: a static export can't render unknown slugs on demand. */
export const dynamicParams = false;

export function generateStaticParams() {
  return SERVICE_PAGES.map((page) => ({ slug: page.slug }));
}

type Params = Promise<{ slug: string }>;

function pageFor(slug: string) {
  return SERVICE_PAGE_BY_SLUG[slug as ServicePageSlug] ?? null;
}

export async function generateMetadata(
  { params }: { params: Params },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const page = pageFor((await params).slug);
  if (!page) return {};
  // openGraph merges shallowly, so carry the root opengraph-image.jpg through explicitly.
  const images = (await parent).openGraph?.images ?? [];
  return {
    title: page.metaTitle,
    description: page.intro,
    openGraph: {
      type: "website",
      siteName: "Penner & Daughters Auto Repair (portfolio sample)",
      title: `${page.metaTitle} | Penner & Daughters (portfolio sample)`,
      description: page.intro,
      images,
    },
  };
}

export default async function ServiceRoute({ params }: { params: Params }) {
  const page = pageFor((await params).slug);
  if (!page) notFound();
  return <ServicePage page={page} />;
}
