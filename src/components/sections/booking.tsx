"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * "Book a time." (#book on the home page, and the body of /book/).
 *
 * The appointment-book sheet is server-rendered with the call-or-text line for anyone without
 * JavaScript. On the home page the flow itself loads after load + idle (or as soon as #book comes
 * within reach, if someone taps Book first), so it costs nothing up front; /book/ passes the flow
 * in as children so it renders with the page and its estimate figure can morph across the
 * navigation.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import "@/components/booking/booking.css";
import { Sheet } from "@/components/ui/sheet";
import { IMPRINTS } from "@/data/copy";
import { PHONE_TEXT, SHOP } from "@/lib/facts";
import { afterLoadIdle } from "@/lib/use-media";

type FlowComponent = (typeof import("@/components/booking/booking-flow"))["BookingFlow"];

let flowModule: Promise<typeof import("@/components/booking/booking-flow")> | null = null;
const loadFlow = () => (flowModule ??= import("@/components/booking/booking-flow"));

const TITLE = "Book a time.";
/** The /book/ H1. The shop name never breaks, so the "&" can't strand at a line end. */
const PAGE_TITLE = (
  <>
    Book a time at <span className="whitespace-nowrap">{SHOP.shortName}</span>
  </>
);
const LEAD = "Four short steps. No account, no VIN. You'll see the price before you confirm.";

/** The call-or-text fallback line from facts.ts, with the number as a live tel: link. */
function CallToBook() {
  const [before, after] = PHONE_TEXT.bookFallback.split(SHOP.phone.display);
  return (
    <>
      {before}
      <a href={SHOP.phone.tel} className="whitespace-nowrap font-mono font-semibold text-ink">
        {SHOP.phone.display}
      </a>
      {after}
    </>
  );
}

export function Booking({ variant = "section", children }: { variant?: "section" | "page"; children?: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [Flow, setFlow] = useState<FlowComponent | null>(null);
  const [failed, setFailed] = useState(false);
  const eager = children !== undefined;

  useEffect(() => {
    if (eager) return;
    let alive = true;
    const load = () => {
      loadFlow()
        .then((m) => {
          if (alive) setFlow(() => m.BookingFlow);
        })
        .catch(() => {
          if (alive) setFailed(true);
        });
    };
    const cancelIdle = afterLoadIdle(load);
    const section = sectionRef.current;
    const io = section
      ? new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && load(), {
          rootMargin: "1200px 0px",
        })
      : null;
    if (section) io?.observe(section);
    return () => {
      alive = false;
      cancelIdle();
      io?.disconnect();
    };
  }, [eager]);

  const page = variant === "page";
  const Title = page ? "h1" : "h2";

  return (
    <section ref={sectionRef} id="book" className="bk" data-variant={variant} aria-labelledby="book-title">
      <div className="counter-wrap">
        <header className="bk-head">
          <Title id="book-title" className="type-h2">
            {page ? PAGE_TITLE : TITLE}
          </Title>
          <p className="type-lead bk-lead">{LEAD}</p>
        </header>
        <Sheet imprint={IMPRINTS.book} className="bk-sheet" bodyClassName="bk-body" slip={!page}>
          <p className="bk-nojs" data-show={failed ? "" : undefined}>
            <CallToBook />
          </p>
          {children ?? (Flow ? <Flow variant={variant} /> : !failed && <div className="bk-placeholder" aria-hidden="true" />)}
        </Sheet>
      </div>
    </section>
  );
}
