"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The day section's small client islands. Everything else in the section is server-rendered.
 *
 * - DayUpgrade: on the desktop full tier, swaps the stacked day sheet (its children, the server
 *   markup every other tier keeps) for the pinned film chapter. The chapter's code (and GSAP) loads
 *   only after window load + idle, and the swap waits until the stacked sheet is off screen, so
 *   nothing jumps under the reader.
 * - DawnFilm: the door-rise band on phones and tablets, played once when half of it is in view.
 * - NightDropButton: "Book a night drop" carries the arrival into the booking flow.
 */
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { BookButton } from "@/components/ui/buttons";
import { FilmClip } from "@/components/ui/film-clip";
import { DAY_SHEET } from "@/data/day";
import { booking } from "@/lib/stores";
import { useTier } from "@/lib/tier";
import { afterLoadIdle, useInView } from "@/lib/use-media";

export function DayUpgrade({ children }: { children: ReactNode }) {
  const tier = useTier();
  const holdRef = useRef<HTMLDivElement>(null);
  const [Chapter, setChapter] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (tier !== "full") return;
    let alive = true;
    let io: IntersectionObserver | null = null;
    const cancel = afterLoadIdle(() => {
      void import("./night-film").then(({ DayChapter }) => {
        const el = holdRef.current;
        if (!alive || !el) return;
        io = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting || !alive) return;
          io?.disconnect();
          setChapter(() => DayChapter);
        });
        io.observe(el);
      });
    });
    return () => {
      alive = false;
      cancel();
      io?.disconnect();
    };
  }, [tier]);

  if (Chapter) return <Chapter />;
  return <div ref={holdRef}>{children}</div>;
}

export function DawnFilm({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const half = useInView(ref, { threshold: 0.5 });
  return (
    <div ref={ref} className={className}>
      <FilmClip id="door-rise" variant="band" playOnce active={half} />
    </div>
  );
}

export function NightDropButton({ className }: { className?: string }) {
  return <BookButton label={DAY_SHEET.nightDrop} className={className} onClick={() => booking.prefill({ arrival: "nightdrop" })} />;
}
