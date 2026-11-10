// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The price list: one long white sheet, server-rendered so it reads complete with JavaScript off
 * (only the vehicle tabs and the Add buttons need JS, and they hide without it).
 *
 *   diagnosis box · vehicle tabs + caption · nine groups (title → service page, a labelled
 *   log-scale ruler, ruled rows: name, figures (a † where the bill can get big), sentence, time,
 *   range bar, Add; long groups show three rows and "Show all … (n)") · what changes the price ·
 *   the † footnote · payment · what we don't do
 */
import { Clock } from "lucide-react";
import Link from "@/components/ui/link";
import { ViewTransition, type CSSProperties } from "react";
import { Print } from "@/components/ui/print";
import { Sheet } from "@/components/ui/sheet";
import { IMPRINTS } from "@/data/copy";
import { PHOTOS } from "@/data/media";
import {
  ESTIMATE_COPY,
  PRICE_LIST_COPY,
  SERVICE_GROUPS,
  priceText,
  servicesIn,
  type Service,
  type ServiceGroup,
} from "@/data/services";
import { AddButton } from "./add-button";
import { MoneyText, RangeFigure, RangeTrack, RulerDefs, ScaleRow, bigBillOn } from "./range-bar";
import { VehicleScope, VehicleTabs } from "./vehicle-tabs";

/**
 * The view-transition name a price-list group title shares with its service page's H1, so the
 * title morphs into the heading when you follow "More about brakes". The service page uses the
 * same name: serviceTitleTransition(slug).
 */
export function serviceTitleTransition(slug: string): string {
  return `service-title-${slug}`;
}

/** Accessible name of the vehicle tablist. */
const VEHICLE_TABS_LABEL = "Kind of car";

export function RateSheet() {
  return (
    <Sheet imprint={IMPRINTS.prices} className="rs" bodyClassName="rs-body">
      <RulerDefs />
      <p className="rs-diag">
        <MoneyText text={PRICE_LIST_COPY.diagnosisBox} />
      </p>
      <VehicleTabs label={VEHICLE_TABS_LABEL} />
      <VehicleScope>
        <p className="rs-caption">{PRICE_LIST_COPY.vehicleCaption}</p>
        {SERVICE_GROUPS.map((group) => (
          <Group key={group.id} group={group} />
        ))}
      </VehicleScope>
      <Footers />
    </Sheet>
  );
}

/** Groups longer than this show their first SHOWN_ROWS jobs, and the rest on "Show all". */
const COLLAPSE_OVER = 4;
const SHOWN_ROWS = 3;

/** "Show all brakes jobs (6)" */
function showAllLabel(group: ServiceGroup, count: number): string {
  return `Show all ${group.title.toLowerCase()} jobs (${count})`;
}

function Group({ group }: { group: ServiceGroup }) {
  const titleId = `rs-group-${group.id}`;
  const services = servicesIn(group.id);
  const collapse = services.length > COLLAPSE_OVER;
  const shown = collapse ? services.slice(0, SHOWN_ROWS) : services;
  const rest = collapse ? services.slice(SHOWN_ROWS) : [];
  const title = (
    <h3 id={titleId} className="rs-group-title">
      {group.title}
    </h3>
  );
  return (
    <section className="rs-group" aria-labelledby={titleId}>
      <header className="rs-group-head">
        {group.page ? (
          <ViewTransition name={serviceTitleTransition(group.page.slug)} share="auto" default="none">
            {title}
          </ViewTransition>
        ) : (
          title
        )}
        {group.page && (
          <Link href={`/services/${group.page.slug}/`} className="text-link rs-more">
            {group.page.link}
          </Link>
        )}
      </header>
      <ScaleRow />
      <ul className="rs-rows">
        {shown.map((service, i) => (
          <Row key={service.id} service={service} index={i} />
        ))}
      </ul>
      {rest.length > 0 && (
        // The rest of the group behind a ruled "Show all" row: plain <details>, so it works without JS.
        <details className="rs-rest">
          <summary className="rs-rest-summary">
            <span>{showAllLabel(group, services.length)}</span>
            <span aria-hidden="true" className="rs-rest-plus">
              +
            </span>
          </summary>
          <ul className="rs-rows">
            {rest.map((service, i) => (
              <Row key={service.id} service={service} index={i} />
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function Row({ service, index }: { service: Service; index: number }) {
  const p = service.price;
  const base = p.kind === "range" ? ([p.low, p.high] as const) : null;
  const bigBill = base ? bigBillOn(base) : "";
  return (
    <li className="rs-row" data-kind={p.kind} style={{ "--r": index } as CSSProperties}>
      <div className="rs-row-head">
        <p className="rs-name">{service.name}</p>
        {base ? (
          <span className="rs-fig-wrap">
            <RangeFigure base={base} />
            {/* Rows that can reach a big bill for the class you picked point to the one footnote. */}
            {bigBill && (
              <sup className="rs-dagger" data-on={bigBill} aria-hidden="true">
                †
              </sup>
            )}
          </span>
        ) : (
          <span className="rs-flat">
            <MoneyText text={priceText(service)} />
          </span>
        )}
      </div>
      <p className="rs-sentence">{service.sentence}</p>
      {service.photo === "filters" && <FilterPhoto />}
      <div className="rs-row-foot rs-grid">
        <span className="rs-time">
          <Clock aria-hidden="true" size={16} strokeWidth={2.2} />
          {service.time}
        </span>
        <RangeTrack base={base} at={p.kind === "flat" ? p.amount : undefined} />
        <span className="rs-add-cell">
          <AddButton id={service.id} name={service.name} price={p} />
        </span>
      </div>

    </li>
  );
}

/** P5: the old filter next to a new one, as a print that opens on tap (no JS needed). */
function FilterPhoto() {
  const photo = PHOTOS.filters;
  const small = photo.small!;
  return (
    <details className="rs-photo">
      <summary className="rs-photo-thumb">
        <picture>
          <source type="image/avif" srcSet={small.avif} />
          <img src={small.webp} alt={photo.alt} width={small.width} height={small.height} loading="lazy" decoding="async" />
        </picture>
      </summary>
      <Print className="rs-photo-print" tilt={-0.8} clip={false}>
        <picture>
          <source
            type="image/avif"
            srcSet={`${small.avif} ${small.width}w, ${photo.avif} ${photo.width}w`}
            sizes="(min-width: 640px) 440px, 90vw"
          />
          <img
            src={photo.webp}
            srcSet={`${small.webp} ${small.width}w, ${photo.webp} ${photo.width}w`}
            sizes="(min-width: 640px) 440px, 90vw"
            alt=""
            width={photo.width}
            height={photo.height}
            loading="lazy"
            decoding="async"
          />
        </picture>
      </Print>
    </details>
  );
}

/** "Your car: on some engines…": the lead-in before the colon is set in ink, the rest in graphite. */
function LeadIn({ text }: { text: string }) {
  const i = text.indexOf(":");
  if (i < 0) return <>{text}</>;
  return (
    <>
      <strong className="font-semibold text-ink">{text.slice(0, i + 1)}</strong>
      {text.slice(i + 1)}
    </>
  );
}

function Footers() {
  return (
    <div className="rs-foot">
      <div>
        <h3 className="rs-foot-title">{PRICE_LIST_COPY.changesTitle}</h3>
        <ul className="rs-foot-list">
          {PRICE_LIST_COPY.changes.map((line) => (
            <li key={line}>
              <LeadIn text={line} />
            </li>
          ))}
        </ul>
      </div>
      <div className="rs-foot-notes">
        <p className="rs-footnote">
          <span aria-hidden="true" className="rs-dagger-mark">† </span>
          <MoneyText text={ESTIMATE_COPY.bigBill} />
        </p>
        <p>{PRICE_LIST_COPY.payment}</p>
        <p>
          <LeadIn text={PRICE_LIST_COPY.notDone} />
        </p>
      </div>
    </div>
  );
}
