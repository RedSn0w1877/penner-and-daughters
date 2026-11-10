// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Service-manual ink for the 3D parts (spec §14):
 *
 * - Outlines: an inverted hull behind every part, pushed out in screen space by a fixed number
 *   of pixels (the technique of drei's <Outlines> with `thickness` in px), ink #121417. One hull
 *   per glTF node with its primitives merged, welded and given smooth normals, so a hard edge
 *   never opens a gap in the line and a multi-material part costs one extra draw, not three.
 *   (drei's component adds one hull per primitive, which puts the brake over the 48-draw budget.)
 * - Creases: EdgesGeometry at 35° as LineSegments at 28% ink, one per node, so the lines follow
 *   the node through EXPLODE and pad wear.
 *
 * Parts that carry lines get polygonOffset on their surfaces so the creases win the depth test.
 */
import {
  BackSide,
  BufferGeometry,
  Color,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  ShaderMaterial,
  Vector2,
  type Object3D,
} from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export const INK = "#121417";
/** Outline width in CSS pixels. */
export const INK_PX = 1.4;
export const CREASE_DEG = 35;
export const CREASE_OPACITY = 0.28;

const HULL_VERTEX = /* glsl */ `
uniform float thickness;
uniform vec2 size;
void main() {
  vec4 clipPosition = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vec4 clipNormal = projectionMatrix * modelViewMatrix * vec4(normal, 0.0);
  float len = length(clipNormal.xy);
  vec2 dir = len > 1e-6 ? clipNormal.xy / len : vec2(0.0);
  clipPosition.xy += dir * thickness / size * clipPosition.w * 2.0;
  gl_Position = clipPosition;
}
`;

const HULL_FRAGMENT = /* glsl */ `
uniform vec3 color;
void main() {
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
`;

/** One shared outline material for every hull (one program, one set of uniforms). */
export function createInkMaterial(): ShaderMaterial {
  const material = new ShaderMaterial({
    name: "Ink",
    uniforms: {
      thickness: { value: INK_PX },
      size: { value: new Vector2(1, 1) },
      color: { value: new Color(INK) },
    },
    vertexShader: HULL_VERTEX,
    fragmentShader: HULL_FRAGMENT,
    side: BackSide,
  });
  return material;
}

/** Keep the outline at INK_PX CSS pixels whatever the canvas size and pixel ratio. */
export function setInkResolution(material: ShaderMaterial, bufferWidth: number, bufferHeight: number, pixelRatio: number) {
  (material.uniforms.size.value as Vector2).set(Math.max(1, bufferWidth), Math.max(1, bufferHeight));
  material.uniforms.thickness.value = INK_PX * pixelRatio;
}

export function createCreaseMaterial(): LineBasicMaterial {
  return new LineBasicMaterial({
    name: "Crease",
    color: INK,
    transparent: true,
    opacity: CREASE_OPACITY,
    depthWrite: false,
    toneMapped: false,
  });
}

/** Position-only, non-indexed copies of a node's primitives, merged into one geometry. */
function positionsOnly(geometries: readonly BufferGeometry[]): BufferGeometry {
  const parts = geometries.map((g) => {
    const flat = g.index ? g.toNonIndexed() : g;
    const out = new BufferGeometry();
    out.setAttribute("position", flat.getAttribute("position").clone());
    if (flat !== g) flat.dispose();
    return out;
  });
  if (parts.length === 1) return parts[0];
  const merged = mergeGeometries(parts, false);
  parts.forEach((g) => g.dispose());
  return merged ?? new BufferGeometry();
}

export interface InkedNode {
  hull: Mesh;
  lines: LineSegments;
  /** Triangles the hull adds to every frame the node is drawn. */
  hullTriangles: number;
}

/**
 * Give a node its ink: a welded, smooth-normal hull and its crease lines, both added as children
 * so they inherit every transform (explode, explodeRot, wear scale).
 */
export function inkNode(
  node: Object3D,
  geometries: readonly BufferGeometry[],
  ink: ShaderMaterial,
  crease: LineBasicMaterial,
): InkedNode {
  const merged = positionsOnly(geometries);

  const welded = mergeVertices(merged, 1e-4);
  welded.computeVertexNormals();
  const hull = new Mesh(welded, ink);
  hull.name = `${node.name}__ink`;
  hull.raycast = () => {};
  hull.userData.ink = true;

  const lines = new LineSegments(new EdgesGeometry(merged, CREASE_DEG), crease);
  lines.name = `${node.name}__crease`;
  lines.raycast = () => {};
  lines.userData.ink = true;
  merged.dispose();

  node.add(hull, lines);
  const hullTriangles = (welded.index ? welded.index.count : welded.getAttribute("position").count) / 3;
  return { hull, lines, hullTriangles };
}
