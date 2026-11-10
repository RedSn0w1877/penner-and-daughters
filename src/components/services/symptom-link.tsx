"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * A "Signs it's time" link on a service page. It goes to the symptom guide on the front page
 * (/#whats-wrong) and carries the symptom with it through the shared symptom store, so the guide
 * opens on that answer. Without JS it is a plain link to the guide.
 */
import Link from "@/components/ui/link";
import type { ReactNode } from "react";
import type { SymptomId } from "@/data/symptoms";
import { cx } from "@/lib/cx";
import { symptom } from "@/lib/stores";

export function SymptomLink({ id, className, children }: { id: SymptomId; className?: string; children: ReactNode }) {
  return (
    <Link href="/#whats-wrong" className={cx(className)} onClick={() => symptom.set(id, "service-page")}>
      {children}
    </Link>
  );
}
