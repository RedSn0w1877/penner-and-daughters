// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * "Getting around while we work": the six ways to get through the day without your car, as ruled
 * line items on the day sheet, with a print of the waiting room. Server-rendered.
 */
import { Print } from "@/components/ui/print";
import { Sheet } from "@/components/ui/sheet";
import { IMPRINTS } from "@/data/copy";
import { GETTING_AROUND_COPY, MEDIA_LABEL } from "@/data/day";
import { PHOTOS } from "@/data/media";
import { cx } from "@/lib/cx";

export function GettingAround({ className }: { className?: string }) {
  const photo = PHOTOS["waiting-room"];
  const small = photo.small!;
  return (
    <Sheet as="article" imprint={IMPRINTS.day} className={className} aria-labelledby="getting-around-title">
      <h3 id="getting-around-title" className="type-h3 [--wdth:80]">
        {GETTING_AROUND_COPY.title}
      </h3>
      <div className="mt-6 grid gap-x-10 gap-y-8 md:grid-cols-[minmax(0,1fr)_minmax(0,0.66fr)] md:items-start">
        <ul className="border-t-[1.5px] border-ink">
          {GETTING_AROUND_COPY.items.map((item) => (
            <li key={item.id} className="border-b border-dashed border-rule py-[0.95rem]">
              <p className="text-[17px] font-bold leading-snug [--wdth:92]">{item.title}</p>
              <p className="mt-1 max-w-[52ch] text-[16px] leading-[1.5] text-graphite">{item.body}</p>
            </li>
          ))}
        </ul>
        <Print
          tilt={-1.2}
          caption={<span>Waiting room · {MEDIA_LABEL.image}</span>}
          className={cx("mx-auto w-full max-w-[380px] md:mt-3 md:max-w-none")}
        >
          <picture>
            <source type="image/avif" srcSet={`${small.avif} ${small.width}w, ${photo.avif} ${photo.width}w`} sizes="(min-width: 768px) 360px, 90vw" />
            <img
              src={photo.webp}
              srcSet={`${small.webp} ${small.width}w, ${photo.webp} ${photo.width}w`}
              sizes="(min-width: 768px) 360px, 90vw"
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              loading="lazy"
              decoding="async"
              className="block h-auto w-full"
            />
          </picture>
        </Print>
      </div>
    </Sheet>
  );
}
