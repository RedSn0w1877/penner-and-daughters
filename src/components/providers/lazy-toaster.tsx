"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { useEffect, useState, type ComponentType } from "react";
import type { ToasterProps } from "sonner";
import { afterLoadIdle } from "@/lib/use-media";

/**
 * Paper-slip toasts. sonner stays out of the first load: the Toaster mounts at load + idle, and
 * notify() loads it on demand if something fires earlier. Slips sit top-center, 80px down,
 * on paper with ink text, a 1px rule and the paper shadow (no blur, no glass).
 *
 *   notify(TOASTS.added("Front brake pads", "{price}"))
 */

type SonnerModule = typeof import("sonner");

let sonner: Promise<SonnerModule> | null = null;
const loadSonner = () => (sonner ??= import("sonner"));

let mounted = false;
let requestMount: (() => void) | null = null;
const mountWaiters: Array<() => void> = [];

function whenMounted(): Promise<void> {
  if (mounted) return Promise.resolve();
  requestMount?.();
  return new Promise((resolve) => mountWaiters.push(resolve));
}

/** Show a paper slip. Safe to call any time on the client. */
export function notify(message: string, options: { duration?: number } = {}): void {
  if (typeof window === "undefined") return;
  void loadSonner()
    .then(async ({ toast }) => {
      await whenMounted();
      toast(message, { duration: options.duration });
    })
    .catch(() => {});
}

/** Runs after the Toaster's own effects (sibling order), so its store subscription is live. */
function MountedSignal() {
  useEffect(() => {
    mounted = true;
    mountWaiters.splice(0).forEach((resolve) => resolve());
    return () => {
      mounted = false;
    };
  }, []);
  return null;
}

export function LazyToaster() {
  const [Toaster, setToaster] = useState<ComponentType<ToasterProps> | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      loadSonner()
        .then((m) => {
          if (alive) setToaster(() => m.Toaster);
        })
        .catch(() => {});
    requestMount = load;
    const cancel = afterLoadIdle(load);
    return () => {
      alive = false;
      cancel();
      if (requestMount === load) requestMount = null;
    };
  }, []);

  if (!Toaster) return null;
  return (
    <>
      <Toaster
        position="top-center"
        offset={{ top: 80 }}
        mobileOffset={{ top: 80 }}
        gap={8}
        visibleToasts={3}
        duration={4200}
        toastOptions={{ unstyled: true, classNames: { toast: "paper-slip" } }}
      />
      <MountedSignal />
    </>
  );
}
