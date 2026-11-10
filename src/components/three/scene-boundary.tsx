"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * Error boundary around the one WebGL canvas. Anything that throws inside the diagram (a model
 * that fails to load or decode, a shader that won't compile, R3F re-throwing a scene error) lands
 * here: the boundary renders its fallback (nothing, by default) and calls onError once, and the
 * inspection switches to the pre-rendered frames for the rest of the visit.
 */
export class SceneBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode; onError?: (error: unknown) => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    void info;
    this.props.onError?.(error);
  }

  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}
