// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * One service page (/services/[slug]/): a breadcrumb, the H1, the intro, "Signs it's time" (symptom
 * links into the guide on the front page), "Typical prices" (the price-list rows), "What's included",
 * Book and Call, and a link back to all prices. Server-rendered, with a BreadcrumbList for search.
 *
 * The H1 shares a view-transition name with the price list's group title on the front page, so the
 * title morphs from the list into the page (and back). Use serviceTransitionName() on both sides.
 */
import Link from "@/components/ui/link";
import { ViewTransition } from "react";
import { SymptomLink } from "@/components/services/symptom-link";
import { BookButton, CallButton } from "@/components/ui/buttons";
import { PenTick } from "@/components/ui/pen-tick";
import { Sheet } from "@/components/ui/sheet";
import { Stamp } from "@/components/ui/stamp";
import { PRICE_LIST_COPY, SERVICE_BY_ID, priceText, type ServicePage as ServicePageData, type ServicePageSlug } from "@/data/services";
import { SYMPTOM_BY_ID } from "@/data/symptoms";
import { SHOP } from "@/lib/facts";

/** The shared view-transition name for a service's title (price-list group title ↔ page H1). */
export function serviceTransitionName(slug: ServicePageSlug): string {
  return `service-title-${slug}`;
}

const COPY = {
  home: "Home",
  services: "Services",
  signs: "Signs it's time",
  prices: "Typical prices",
  included: "What's included",
  allPrices: "All prices",
} as const;

function BreadcrumbJsonLd({ page }: { page: ServicePageData }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: COPY.home, item: SHOP.siteUrl },
      { "@type": "ListItem", position: 2, name: COPY.services, item: `${SHOP.siteUrl}#prices` },
      { "@type": "ListItem", position: 3, name: page.name, item: `${SHOP.siteUrl}services/${page.slug}/` },
    ],
  };
  return (
    <script
      type="application/ld+json"
      // "<" is escaped so the payload can never close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function ServicePage({ page }: { page: ServicePageData }) {
  const sectionTitle = "type-h3 text-[clamp(21px,1.8vw,26px)] [--wdth:82]";
  return (
    <div className="counter-wrap pb-24 pt-6 lg:pb-32 lg:pt-10">
      <BreadcrumbJsonLd page={page} />

      <nav aria-label="Breadcrumb" className="mb-5 px-1 lg:mb-7">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-graphite">
          <li>
            <Link href="/" className="font-semibold text-ink underline decoration-[1.5px] underline-offset-[3px] hover:text-blue">
              {COPY.home}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/#prices" className="font-semibold text-ink underline decoration-[1.5px] underline-offset-[3px] hover:text-blue">
              {COPY.services}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{page.name}</li>
        </ol>
      </nav>

      <Sheet as="article" imprint={page.name} slip={false} bodyClassName="lg:px-14 lg:py-14">
        <ViewTransition name={serviceTransitionName(page.slug)}>
          <h1 className="type-h2 max-w-[18ch]">{page.h1}</h1>
        </ViewTransition>
        <p className="type-lead mt-5 max-w-[52ch] text-graphite">{page.intro}</p>

        <div className="mt-12 grid gap-14 lg:grid-cols-12 lg:gap-x-14">
          <div className="flex flex-col gap-14 lg:col-span-7">
            <section aria-labelledby="service-signs">
              <h2 id="service-signs" className={sectionTitle}>
                {COPY.signs}
              </h2>
              <ul className="mt-4 border-t-[1.5px] border-ink">
                {page.symptoms.map((id) => {
                  const s = SYMPTOM_BY_ID[id];
                  return (
                    <li key={id} className="border-b border-dashed border-rule">
                      <SymptomLink
                        id={id}
                        className="group flex min-h-[52px] flex-wrap items-center gap-x-4 gap-y-2 py-3 no-underline"
                      >
                        <Stamp level={s.verdict} size="sm" seed={id} className="flex-none" />
                        <span className="text-[17px] font-semibold text-ink underline decoration-transparent decoration-[1.5px] underline-offset-[3px] transition-colors group-hover:decoration-current">
                          {s.label}
                        </span>
                      </SymptomLink>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section aria-labelledby="service-prices">
              <h2 id="service-prices" className={sectionTitle}>
                {COPY.prices}
              </h2>
              <ul className="mt-4 border-t-[1.5px] border-ink">
                {page.rows.map((id) => {
                  const row = SERVICE_BY_ID[id];
                  return (
                    <li key={id} className="grid gap-x-6 gap-y-1 border-b border-dashed border-rule py-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <div>
                        <p className="text-[18px] font-bold leading-snug [--wdth:90]">{row.name}</p>
                        <p className="mt-1 max-w-[52ch] text-[16px] leading-[1.5] text-graphite">{row.sentence}</p>
                        <p className="mono-measure mt-1 text-graphite">{row.time}</p>
                      </div>
                      <p className="mono-price whitespace-nowrap text-ink sm:pt-[2px] sm:text-right">{priceText(row)}</p>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-[15px] text-graphite">{PRICE_LIST_COPY.servicePageNote}</p>
            </section>
          </div>

          <div className="lg:col-span-5">
            <section aria-labelledby="service-included" className="rounded-[2px] bg-paper-shade px-6 py-6 lg:px-8 lg:py-8">
              <h2 id="service-included" className={sectionTitle}>
                {COPY.included}
              </h2>
              <ul className="mt-5 flex flex-col gap-4">
                {page.included.map((item, i) => (
                  <li key={item} className="flex items-start gap-3 text-[17px] leading-[1.45]">
                    <PenTick delay={300 + i * 120} className="mt-[1px]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row lg:flex-col">
              <BookButton size="lg" />
              <CallButton size="lg" />
            </div>
            <Link href="/#prices" className="text-link mt-6 inline-flex min-h-[44px] items-center text-[17px]">
              {COPY.allPrices}
            </Link>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
