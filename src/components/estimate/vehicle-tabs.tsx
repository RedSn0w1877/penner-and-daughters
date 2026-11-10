"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Which kind of car the price list is quoting for. A four-tab sliding pill (PaperTabs) sets it;
 * VehicleScope writes it to data-vehicle on the list, and CSS does the rest (see range-bar.tsx).
 *
 * The choice lives in a tiny module store so the Add buttons can scale their ranges, and so range
 * lines already in the estimate follow the car when it changes.
 */
import { useSyncExternalStore, type ReactNode } from "react";
import { PaperTabs, tabPanelProps } from "@/components/ui/paper-tabs";
import { VEHICLE_CLASSES, classRange, type VehicleClass } from "@/lib/pricing";
import { estimate } from "@/lib/stores";

const ID_PREFIX = "vehicle";
const TABS = VEHICLE_CLASSES.map((c) => ({ id: c.id, label: c.label }));

let current: VehicleClass = "compact";
const listeners = new Set<() => void>();
/** Compact-car base ranges of the price-list lines in the estimate. */
const bases = new Map<string, readonly [number, number]>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getVehicle(): VehicleClass {
  return current;
}

export function vehicleLabel(id: VehicleClass): string {
  return VEHICLE_CLASSES.find((c) => c.id === id)?.label ?? "";
}

/** The Add buttons register a line's compact range so a later class change can rescale it. */
export function rememberBase(id: string, base: readonly [number, number]): void {
  bases.set(id, base);
}

export function useVehicle(): VehicleClass {
  return useSyncExternalStore(subscribe, getVehicle, () => "compact");
}

export function setVehicle(next: VehicleClass): void {
  if (next === current) return;
  current = next;
  listeners.forEach((l) => l());
  // One car per visit: range lines added from the price list follow the class you pick.
  for (const line of estimate.get().lines) {
    if (line.kind !== "range" || line.source !== "price-list") continue;
    const base = bases.get(line.id);
    if (!base) continue;
    const [low, high] = classRange(base, next);
    estimate.add({
      kind: "range",
      id: line.id,
      name: line.name,
      low,
      high,
      vehicle: vehicleLabel(next),
      approved: line.approved,
      source: "price-list",
    });
  }
}

/** The tablist. Hidden without JavaScript (the list then shows compact-car prices). */
export function VehicleTabs({ label }: { label: string }) {
  const value = useVehicle();
  return (
    <div className="rs-vehicle" data-lenis-prevent="">
      <PaperTabs variant="pill" idPrefix={ID_PREFIX} label={label} tabs={TABS} value={value} onChange={setVehicle} />
    </div>
  );
}

/** The tab panel: the whole price list, keyed to the chosen class by data-vehicle. */
export function VehicleScope({ children }: { children: ReactNode }) {
  const value = useVehicle();
  return (
    <div className="rs-scope" data-vehicle={value} {...tabPanelProps(ID_PREFIX, value)}>
      {children}
    </div>
  );
}
