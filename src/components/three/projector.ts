// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Camera fit and anchor projection for the ink diagrams.
 *
 * Each GLB's root carries the view the pre-rendered frames were shot with (extras.view: dir, up,
 * target, orthoWidth, aspect 1.6), so the WebGL diagram and the touch frames frame a part the same
 * way. The fit puts that 1.6 box inside the canvas minus the callout gutters (insets), and the
 * projector turns every Anchor_n empty into canvas pixels for the HTML dots and leader lines.
 */
import { Box3, Vector3, type Object3D, type OrthographicCamera } from "three";

export type Vec3 = [number, number, number];

export interface ViewSpec {
  dir: Vec3;
  up: Vec3;
  target: Vec3;
  orthoWidth: number;
  aspect: number;
}

/** Pixels reserved around the part (callout gutters). */
export interface Insets {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export const NO_INSETS: Insets = { left: 0, right: 0, top: 0, bottom: 0 };

/** One callout anchor on screen, in CSS pixels from the canvas' top-left corner. */
export interface AnchorPoint {
  n: number;
  x: number;
  y: number;
  visible: boolean;
}

/** The part's view box on screen (CSS px). */
export interface ViewBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

const isVec3 = (v: unknown): v is Vec3 => Array.isArray(v) && v.length === 3 && v.every((n) => typeof n === "number");

/**
 * The view from the GLB root extras; if a file ships without one, frame its bounding box from a
 * three-quarter angle instead (graceful for placeholder models).
 */
export function readView(root: Object3D): ViewSpec {
  const raw = (root.userData?.view ?? null) as Partial<ViewSpec> | null;
  if (raw && isVec3(raw.dir) && isVec3(raw.target) && typeof raw.orthoWidth === "number") {
    return {
      dir: raw.dir,
      up: isVec3(raw.up) ? raw.up : [0, 1, 0],
      target: raw.target,
      orthoWidth: raw.orthoWidth,
      aspect: typeof raw.aspect === "number" && raw.aspect > 0 ? raw.aspect : 1.6,
    };
  }
  const box = new Box3().setFromObject(root);
  const center = box.getCenter(new Vector3());
  const size = box.getSize(new Vector3());
  return {
    dir: [0.5, 0.35, 0.79],
    up: [0, 1, 0],
    target: [center.x, center.y, center.z],
    orthoWidth: Math.max(size.x, size.y, size.z) * 1.9 || 1,
    aspect: 1.6,
  };
}

/** Where the view's 1.6 box lands inside a canvas of width × height with these insets. */
export function viewBox(view: ViewSpec, width: number, height: number, insets: Insets): ViewBox {
  const innerW = Math.max(1, width - insets.left - insets.right);
  const innerH = Math.max(1, height - insets.top - insets.bottom);
  const boxW = Math.min(innerW, innerH * view.aspect);
  const boxH = boxW / view.aspect;
  return {
    left: insets.left + (innerW - boxW) / 2,
    top: insets.top + (innerH - boxH) / 2,
    width: boxW,
    height: boxH,
  };
}

const _dir = new Vector3();
const _target = new Vector3();

/**
 * Point the orthographic camera along the view and size its frustum so one world unit is the same
 * number of pixels as in the pre-rendered frames. `shake` nudges the frame by a few pixels.
 * Returns world units per CSS pixel.
 */
export function fitOrthoCamera(
  camera: OrthographicCamera,
  view: ViewSpec,
  width: number,
  height: number,
  insets: Insets,
  shake: { x: number; y: number } = { x: 0, y: 0 },
): number {
  const box = viewBox(view, width, height, insets);
  const s = view.orthoWidth / box.width;
  const cx = box.left + box.width / 2 + shake.x;
  const cy = box.top + box.height / 2 + shake.y;
  camera.left = -cx * s;
  camera.right = (width - cx) * s;
  camera.top = cy * s;
  camera.bottom = -(height - cy) * s;
  camera.near = 0.05;
  camera.far = 12;
  camera.zoom = 1;
  _target.set(view.target[0], view.target[1], view.target[2]);
  _dir.set(view.dir[0], view.dir[1], view.dir[2]).normalize();
  camera.position.copy(_target).addScaledVector(_dir, 4);
  camera.up.set(view.up[0], view.up[1], view.up[2]);
  camera.lookAt(_target);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return s;
}

const _v = new Vector3();

/** Project anchors (world matrices must be current) into canvas pixels, reusing `out`. */
export function projectAnchors(
  anchors: ReadonlyArray<{ n: number; object: Object3D }>,
  camera: OrthographicCamera,
  width: number,
  height: number,
  out: AnchorPoint[],
): AnchorPoint[] {
  out.length = anchors.length;
  for (let i = 0; i < anchors.length; i++) {
    const a = anchors[i];
    _v.setFromMatrixPosition(a.object.matrixWorld).project(camera);
    const point = out[i] ?? { n: a.n, x: 0, y: 0, visible: false };
    point.n = a.n;
    point.x = ((_v.x + 1) / 2) * width;
    point.y = ((1 - _v.y) / 2) * height;
    point.visible = _v.z > -1 && _v.z < 1 && point.x > -40 && point.x < width + 40 && point.y > -40 && point.y < height + 40;
    out[i] = point;
  }
  return out;
}
