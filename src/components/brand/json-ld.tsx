// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { SERVICE_BY_ID, type ServiceId } from "@/data/services";
import { SHOP } from "@/lib/facts";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Services offered in the structured data (min/max for ranges, a single price for flat ones). */
const OFFERS: ServiceId[] = ["brake-pads", "diagnosis", "battery", "ac-check", "coolant", "alignment", "oil", "pre-purchase"];

function offer(id: ServiceId) {
  const s = SERVICE_BY_ID[id];
  const p = s.price;
  const priceSpecification =
    p.kind === "range"
      ? { "@type": "PriceSpecification", minPrice: p.low, maxPrice: p.high, priceCurrency: "USD" }
      : { "@type": "PriceSpecification", price: p.kind === "flat" ? p.amount : 0, priceCurrency: "USD" };
  return { "@type": "Offer", itemOffered: { "@type": "Service", name: s.name }, priceSpecification };
}

/**
 * schema.org AutoRepair for the fictional shop: honest about being fictional (the description says
 * so), with no geo, no star scores, no customer quotes and no sameAs. One script tag, from the layout.
 */
export function JsonLd() {
  const weekdays = [1, 2, 3, 4, 5].filter((d) => SHOP.hours[d]);
  const wd = SHOP.hours[1]!;
  const sat = SHOP.hours[6]!;
  const data = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    name: SHOP.name,
    description:
      "Fictional auto repair shop created by HVNF Studios as a portfolio sample. Brakes, check-engine diagnosis, batteries, cooling, AC, suspension, tires and maintenance, with photos and a written price before any work.",
    url: SHOP.siteUrl,
    telephone: SHOP.phone.schema,
    image: `${SHOP.siteUrl}opengraph-image.jpg`,
    address: {
      "@type": "PostalAddress",
      streetAddress: SHOP.street,
      addressLocality: SHOP.town,
      addressCountry: "US",
    },
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: weekdays.map((d) => DAY_NAMES[d]), opens: wd.open, closes: wd.close },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: sat.open, closes: sat.close },
    ],
    specialOpeningHoursSpecification: SHOP.holidays.map((h) => ({
      "@type": "OpeningHoursSpecification",
      validFrom: h.date,
      validThrough: h.date,
      opens: "00:00",
      closes: "00:00",
    })),
    priceRange: "$$",
    areaServed: SHOP.towns.map((name) => ({ "@type": "City", name })),
    paymentAccepted: "Cash, Check, Credit Card, Debit Card, Apple Pay, Google Pay",
    currenciesAccepted: "USD",
    makesOffer: OFFERS.map(offer),
  };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify doesn't escape "<"; this does, so the payload can't close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
