"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * "What's wrong?" quick picks under the hero's buttons (phones and tablets; desktop has the nav).
 * Brakes come first because that's what most drivers search for, each with its usual price, and
 * the check-engine row says what the check costs. Ruled line items like the price list, never
 * cards. Each is a plain link to the symptom guide; with JS it also carries the symptom through
 * the shared store, so the guide opens on that answer. The server (hero-sheet) builds the rows from
 * the price data, so the price list never ships in the hero's JavaScript.
 */
import { ArrowDown } from "lucide-react";
import type { SymptomId } from "@/data/symptoms";
import { cx } from "@/lib/cx";
import { symptom } from "@/lib/stores";

export interface QuickPick {
  label: string;
  /** Mono, right-aligned: the usual price or what the check costs. */
  price?: string;
  id?: SymptomId;
}

export function QuickPicks({ picks, className }: { picks: readonly QuickPick[]; className?: string }) {
  return (
    <nav aria-labelledby="hero-picks-title" className={cx(className)}>
      <p id="hero-picks-title" className="type-label">
        What&apos;s wrong?
      </p>
      <ul className="mt-1.5 border-t-[1.5px] border-ink">
        {picks.map((p) => (
          <li key={p.label} className="border-b border-rule">
            <a
              href="#whats-wrong"
              onClick={p.id ? () => symptom.set(p.id!, "link") : undefined}
              className="group -mx-1.5 flex min-h-[46px] items-center gap-3 rounded-[2px] px-1.5 py-2 text-[17px] leading-[1.3] font-semibold text-ink no-underline transition-colors duration-100 active:bg-paper-shade"
            >
              <span className="min-w-0 flex-1 underline decoration-transparent decoration-[1.5px] underline-offset-[3px] transition-[text-decoration-color] duration-150 group-hover:decoration-ink">
                {p.label}
              </span>
              {p.price && <span className="font-mono text-[15px] font-medium whitespace-nowrap text-graphite tabular-nums">{p.price}</span>}
              <ArrowDown aria-hidden="true" size={16} strokeWidth={2.2} className="shrink-0 text-ink" />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
