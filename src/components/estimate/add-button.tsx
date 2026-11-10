"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * "Add" on a price-list row: a toggle. Pressed (a blue pen tick, the row's bar turns blue) means
 * the job is in your estimate; pressing again takes it out. Ranges are scaled for the vehicle
 * class picked above the list. Hidden without JavaScript.
 */
import { notify } from "@/components/providers/lazy-toaster";
import { PenTick } from "@/components/ui/pen-tick";
import { LABELS, TOASTS } from "@/data/copy";
import { classRange, money } from "@/lib/pricing";
import { estimate, useInEstimate } from "@/lib/stores";
import { getVehicle, rememberBase, vehicleLabel } from "./vehicle-tabs";

/** The row's price as the price list stores it (compact-car base for ranges). */
export type AddPrice =
  | { kind: "range"; low: number; high: number }
  | { kind: "flat"; amount: number; note?: string }
  | { kind: "free" };

export function AddButton({ id, name, price }: { id: string; name: string; price: AddPrice }) {
  const added = useInEstimate(id);

  const onClick = () => {
    if (added) {
      estimate.remove(id);
      notify(TOASTS.removed(name));
      return;
    }
    if (price.kind === "range") {
      const vehicle = getVehicle();
      const [low, high] = classRange([price.low, price.high], vehicle);
      rememberBase(id, [price.low, price.high]);
      estimate.add({ kind: "range", id, name, low, high, vehicle: vehicleLabel(vehicle), source: "price-list" });
      notify(TOASTS.added(name));
      return;
    }
    const amount = price.kind === "flat" ? price.amount : 0;
    estimate.add({
      kind: "flat",
      id,
      name,
      amount,
      note: price.kind === "flat" ? price.note : undefined,
      source: "price-list",
    });
    notify(amount > 0 ? TOASTS.added(name, money(amount)) : TOASTS.added(name));
  };

  return (
    <button
      type="button"
      className="rs-add"
      aria-pressed={added}
      aria-label={`${LABELS.add} ${name} to your estimate`}
      onClick={onClick}
    >
      <span>{LABELS.add}</span>
      <PenTick active={added} size={18} className="rs-add-tick" />
    </button>
  );
}
