// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { COPY } from "@/lib/facts";

type SheetProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  /** Paper is white; canary is the carbon copy you keep. */
  tone?: "paper" | "canary";
  /** Carbon copies peeking out underneath: true = pink + canary (the repair order), or just one. */
  carbon?: boolean | "pink" | "canary";
  /** The 3% "SAMPLE · HVNF STUDIOS" security pattern (hero repair order, estimate, warranty card). */
  pantograph?: boolean;
  /** Left side of the perforated foot: the document's name, e.g. "Repair order 4471". */
  imprint: string;
  /**
   * SLIP in from under the previous sheet when it scrolls into view (default on). Turn it off for
   * sheets inside a GSAP pin; the pin owns their transform.
   */
  slip?: boolean;
  as?: "div" | "section" | "article" | "aside";
  /** Classes for the padded body (the outer element takes `className`). */
  bodyClassName?: string;
  children: ReactNode;
};

/**
 * A paper sheet on the counter: white (or canary) paper, the paper shadow, optional carbon
 * copies underneath, and a perforated foot with the imprint. Text sheets always sit at 0°;
 * only prints and carbon underlayers tilt.
 */
export function Sheet({
  tone = "paper",
  carbon,
  pantograph,
  imprint,
  slip = true,
  as: Tag = "div",
  className,
  bodyClassName,
  children,
  ...rest
}: SheetProps) {
  const copies: Array<"canary" | "pink"> = carbon === true ? ["canary", "pink"] : carbon ? [carbon] : [];
  return (
    <Tag
      className={cx("sheet", className)}
      data-tone={tone}
      data-carbon={carbon === true ? "both" : carbon || undefined}
      data-slip={slip ? "" : undefined}
      {...rest}
    >
      {copies.map((copy) => (
        <span key={copy} className="sheet-carbon" data-copy={copy} aria-hidden="true" />
      ))}
      <div className="sheet-paper">
        {pantograph && <span className="pantograph" aria-hidden="true" />}
        <div className={cx("sheet-body", bodyClassName)}>{children}</div>
        <div className="sheet-foot">
          <span>{imprint}</span>
          <span>{COPY.imprint}</span>
        </div>
      </div>
    </Tag>
  );
}
