// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Three paper tags on string, each hung from its own nail, the way a shop tags a part. They sway a
 * little when the pointer passes over them (hover only, never on their own). The owner's tag carries
 * her direct line as a tel: link. Server-rendered; the sway is CSS.
 */
import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { PHONE_TEXT, SHOP } from "@/lib/facts";

const STYLES = `
@layer properties, theme, base, components, utilities;
@layer components {
  @keyframes tag-sway {
    0% { rotate: var(--tilt); }
    16% { rotate: calc(var(--tilt) + 3.4deg); }
    36% { rotate: calc(var(--tilt) - 2.4deg); }
    56% { rotate: calc(var(--tilt) + 1.4deg); }
    76% { rotate: calc(var(--tilt) - 0.6deg); }
    100% { rotate: var(--tilt); }
  }
  .promise-tag-swing { rotate: var(--tilt); }
  @media (hover: hover) and (prefers-reduced-motion: no-preference) {
    .promise-tag:hover .promise-tag-swing { animation: tag-sway 1300ms cubic-bezier(0.3, 0.6, 0.3, 1); }
  }
}`;

/** The owner's line, with the number as a link. */
function OwnerLine() {
  const [before, after = ""] = PHONE_TEXT.ownerTag.split(SHOP.ownerPhone.display);
  return (
    <>
      {before}
      <a href={SHOP.ownerPhone.tel} className="whitespace-nowrap font-mono font-semibold underline decoration-[1.5px] underline-offset-[3px] hover:text-blue">
        {SHOP.ownerPhone.display}
      </a>
      {after}
    </>
  );
}

const TAGS: ReadonlyArray<{ id: string; body: ReactNode; drop: number; tilt: number }> = [
  { id: "road-test", body: "Road-tested before you get the keys.", drop: 18, tilt: -1.6 },
  { id: "old-parts", body: "Your old parts back. Just ask.", drop: 34, tilt: 1.2 },
  { id: "owner", body: <OwnerLine />, drop: 24, tilt: -0.8 },
];

export function PromiseTags({ className }: { className?: string }) {
  return (
    <>
      <style href="warranty-tags" precedence="default">
        {STYLES}
      </style>
      <ul className={cx("flex flex-wrap items-start justify-center gap-x-6 gap-y-6 sm:justify-start", className)}>
        {TAGS.map((tag) => (
          <li key={tag.id} className="promise-tag relative w-[min(100%,15rem)] pt-[3px]" style={{ "--drop": `${tag.drop}px`, "--tilt": `${tag.tilt}deg` } as CSSProperties}>
            {/* The nail. */}
            <span className="absolute left-1/2 top-0 z-[2] size-[9px] -translate-x-1/2 rounded-full bg-steel shadow-[0_1px_1px_rgb(18_20_23/0.35),inset_0_1px_0_rgb(255_255_255/0.5)]" aria-hidden="true" />
            {/* flow-root: the tag's margin-top (its drop) must not collapse through this box, or the
                whole swing (string included) slides down to the tag and the string runs through the text. */}
            <div className="promise-tag-swing relative flow-root origin-[50%_0]">
              {/* The string, from the nail into the tag's hole. */}
              <svg
                className="pointer-events-none absolute left-1/2 top-[1px] z-[1] w-4 -translate-x-1/2 overflow-visible"
                style={{ height: "calc(var(--drop) + 19px)" }}
                viewBox="0 0 16 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M8 0 C 5 30, 11 66, 8 100" fill="none" stroke="var(--graphite)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              </svg>
              <div className="relative mt-[var(--drop)] rounded-[6px] border border-rule bg-paper px-5 pb-5 pt-9 shadow-paper">
                {/* The reinforced hole. */}
                <span className="absolute left-1/2 top-[11px] size-[14px] -translate-x-1/2 rounded-full border-[3px] border-rule bg-counter" aria-hidden="true" />
                <p className="text-[16px] font-semibold leading-[1.4] text-ink [--wdth:94]">{tag.body}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
