"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The lazy edge of the one WebGL context.
 *
 * - DiagramDrive: a small bus between the page and the diagram. The pinned stage (or a touch
 *   sticky stage) writes scroll progress, pointer yaw, pad wear and the callout gutters into it;
 *   the renderer (WebGL, or the pre-rendered frame player) reads them on its next frame and
 *   publishes where every callout anchor landed. Nothing on the scroll path re-renders React.
 * - LazyDiagram: next/dynamic (ssr: false) around the R3F canvas, inside an error boundary.
 *   This file imports no three.js; the three/R3F chunk loads only when the canvas mounts or when
 *   the inspection enhancer prefetches it (once "What's it doing?" reaches mid-screen, or an
 *   #inspection link is clicked).
 */
import dynamic from "next/dynamic";
import { WEAR, stageAt, type StageState } from "@/data/inspection";
import type { AnchorPoint, Insets } from "./projector";
import { SceneBoundary } from "./scene-boundary";

export type { AnchorPoint, Insets };

export interface DiagramFrame {
  /** Item index (0–3) and its local progress this frame shows. */
  item: number;
  p: number;
  /** Callout anchors this frame, in CSS px from the canvas' top-left corner. */
  anchors: readonly AnchorPoint[];
  /** The same anchors with the part fully exploded and square on: where labels are laid out. */
  layout: readonly AnchorPoint[];
  width: number;
  height: number;
  source: "webgl" | "frames";
}

export type DiagramStatus = "idle" | "loading" | "ready" | "failed";

/** Renderer stats from the last WebGL frame (QA: window.__pdDiagram). */
export interface DiagramStats {
  calls: number;
  triangles: number;
  frames: number;
  part: string;
}

export class DiagramDrive {
  private _state: StageState = { item: 0, p: -0.25 };
  private _yaw = 0;
  private _wear: number = WEAR.asFound;
  private _burst = 0;
  private _insets: Insets = { left: 0, right: 0, top: 0, bottom: 0 };
  private _visible = false;
  private _reduced = false;
  private _status: DiagramStatus = "idle";
  private _failure: string | null = null;
  private _last: DiagramFrame | null = null;
  private invalidateFn: (() => void) | null = null;
  private readonly frameListeners = new Set<(frame: DiagramFrame) => void>();
  private readonly tickListeners = new Set<() => void>();
  private readonly statusListeners = new Set<() => void>();

  /* ---- inputs (page → renderer) ---------------------------------------------------------- */

  get state(): StageState {
    return this._state;
  }
  get yaw() {
    return this._yaw;
  }
  get wear() {
    return this._wear;
  }
  /** Bumps each time the wear ruler reaches 0 mm from above (one spark burst per bump). */
  get burst() {
    return this._burst;
  }
  get insets(): Insets {
    return this._insets;
  }
  get visible() {
    return this._visible;
  }
  get reducedMotion() {
    return this._reduced;
  }

  /** Pinned stage: overall pin progress 0–1. */
  setProgress(progress: number) {
    this.setLocal(stageAt(progress));
  }

  /** A single item's stage (touch): its index and local progress. */
  setLocal(next: StageState) {
    if (next.item === this._state.item && next.p === this._state.p) return;
    this._state = next;
    this.tick();
  }

  /** Pointer yaw target in radians (±12° on the desktop stage). */
  setYaw(radians: number) {
    if (radians === this._yaw) return;
    this._yaw = radians;
    this.tick();
  }

  setWear(mm: number) {
    if (mm === this._wear) return;
    if (mm === 0 && this._wear > 0) this._burst += 1;
    this._wear = mm;
    this.tick();
  }

  setInsets(insets: Insets) {
    const a = this._insets;
    if (a.left === insets.left && a.right === insets.right && a.top === insets.top && a.bottom === insets.bottom) return;
    this._insets = insets;
    this.tick();
  }

  /** True while the stage is on (or near) screen: the renderer may draw. */
  setVisible(visible: boolean) {
    if (visible === this._visible) return;
    this._visible = visible;
    this.emitStatus();
    this.tick();
  }

  setReducedMotion(reduced: boolean) {
    this._reduced = reduced;
  }

  /* ---- renderer side --------------------------------------------------------------------- */

  /** The WebGL renderer registers its invalidate() so inputs schedule exactly one frame. */
  connect(invalidate: () => void) {
    this.invalidateFn = invalidate;
  }

  disconnect(invalidate: () => void) {
    if (this.invalidateFn === invalidate) this.invalidateFn = null;
  }

  /** Ask for one more frame (inputs changed). */
  tick() {
    // Off screen nothing draws; coming back on screen ticks once (setVisible).
    if (this._visible) this.invalidateFn?.();
    this.tickListeners.forEach((l) => l());
  }

  onTick(listener: () => void): () => void {
    this.tickListeners.add(listener);
    return () => this.tickListeners.delete(listener);
  }

  publish(frame: DiagramFrame) {
    this._last = frame;
    this.frameListeners.forEach((l) => l(frame));
  }

  /** Called with every rendered frame's anchor positions. */
  onFrame(listener: (frame: DiagramFrame) => void): () => void {
    this.frameListeners.add(listener);
    if (this._last) listener(this._last);
    return () => this.frameListeners.delete(listener);
  }

  get lastFrame(): DiagramFrame | null {
    return this._last;
  }

  /* ---- status (React reads it with useSyncExternalStore) -------------------------------- */

  get status(): DiagramStatus {
    return this._status;
  }
  get failure(): string | null {
    return this._failure;
  }

  setStatus(status: DiagramStatus) {
    if (this._status === "failed" || status === this._status) return;
    this._status = status;
    this.emitStatus();
  }

  /** WebGL failed to start, threw, or lost its context: switch to frames and stay there. */
  fail(reason: string) {
    if (this._status === "failed") return;
    this._failure = reason;
    this._status = "failed";
    this.invalidateFn = null;
    this.emitStatus();
    this.tick();
  }

  private emitStatus() {
    this.statusListeners.forEach((l) => l());
  }

  readonly subscribe = (listener: () => void) => {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  };

  /** Snapshot for useSyncExternalStore: status plus visibility, as one string. */
  readonly snapshot = () => `${this._status}:${this._visible ? 1 : 0}`;
}

const DiagramCanvas = dynamic(() => import("./diagram-canvas"), { ssr: false, loading: () => null });

/** The one R3F canvas, loaded on demand, failing over to the frame player through `drive`. */
export function LazyDiagram({ drive }: { drive: DiagramDrive }) {
  return (
    <SceneBoundary onError={(error) => drive.fail(error instanceof Error ? error.message : "scene error")}>
      <DiagramCanvas drive={drive} />
    </SceneBoundary>
  );
}
