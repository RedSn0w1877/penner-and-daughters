// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * One inspection part, rigged from its GLB (spec §14 + the assets' node extras):
 *
 *   explode [x,y,z] m · explodeRot [x,y,z] rad · order · label · finding
 *   brake:   wearGroup / wearAdvance / thicknessAxis / newThickness, root asFound {inner, outer}
 *   battery: Corrosion carries cleanScale (scaled away: "cleaned, no charge")
 *   root:    view {dir, up, target, orthoWidth, aspect}
 *
 * position = base + explode × factor, rotation = explodeRot × factor. The part assembles in from
 * 1.6× its vectors, then EXPLODE runs as a staggered teardown in each node's `order` (lug nuts
 * first, rotor last), every node landing on its full vector by the end of the window. Missing
 * extras degrade gracefully: a node without a vector stays put; a file without a view is framed
 * from its bounding box.
 *
 * This is plain three.js driven by the diagram controller (no React state), so the scroll path
 * never re-renders a component.
 */
import {
  Color,
  Euler,
  Group,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
  type BufferGeometry,
  type LineBasicMaterial,
  type Material,
  type Object3D,
  type ShaderMaterial,
  type Texture,
} from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { TIMING, explodeAt, smootherstep, type Tone } from "@/data/inspection";
import type { PartId } from "@/data/media";
import { inkNode } from "./ink";
import { readView, type ViewSpec } from "./projector";
import { applyRotorWear, type RotorWear } from "./rotor-wear";

/** Finding fills (spec §14): pad friction and belt amber, tire bulge red, battery terminals 30% green. */
const FILL: Record<Tone, string> = { soon: "#F4B43A", stop: "#C3261A", ok: "#1E7A3E" };
const OK_TINT = 0.3;
/** Latest start of a node in the staggered teardown, as a share of the EXPLODE window. */
const MAX_DELAY = 0.4;

type Axis = "x" | "y" | "z";

interface NodeRig {
  object: Object3D;
  basePos: Vector3;
  baseQuat: Quaternion;
  baseScale: Vector3;
  explode: Vector3;
  explodeRot: Vector3 | null;
  delay: number;
  /** The tire's gauge would be pushed into the tread at 1.6×; it waits at 1× while the rest flies in. */
  clampAssemble: boolean;
  wearGroup: string | null;
  wearAdvance: Vector3 | null;
  thickness: { axis: Axis; full: number } | null;
  cleanScale: number | null;
}

export interface PartAnchor {
  n: number;
  label: string;
  object: Object3D;
}

const vec = (v: unknown): Vector3 | null =>
  Array.isArray(v) && v.length === 3 && v.every((n) => typeof n === "number") ? new Vector3(v[0], v[1], v[2]) : null;

const _euler = new Euler();
const _quat = new Quaternion();
const _axis = new Vector3();

/** Rigs are built once per loaded GLB (the loader cache is shared; StrictMode may ask twice). */
const rigCache = new WeakMap<Group, PartRig>();

export class PartRig {
  readonly id: PartId;
  readonly view: ViewSpec;
  /** Add this to the scene: a pivot at the view target, so pointer yaw turns the part in place. */
  readonly pivot = new Group();
  readonly anchors: PartAnchor[] = [];
  readonly materials = new Set<Material>();
  readonly textures = new Set<Texture>();
  /** Triangles drawn per frame while this part is visible (meshes + ink hulls). */
  readonly triangles: number;
  /** Draw calls per frame while visible (primitives + hulls + crease lines). */
  readonly drawCalls: number;
  readonly rotorWear: RotorWear | null = null;

  private readonly nodes: NodeRig[] = [];
  private readonly upAxis: Vector3;
  private p = 1;
  private item = 0;
  private innerMM = 3;
  private outerMM = 4;
  private clean = 1;
  private readonly asFound: { inner: number; outer: number };

  static for(gltf: GLTF, id: PartId, shared: { ink: ShaderMaterial; crease: LineBasicMaterial; scored: Texture | null; tone: Tone }) {
    let rig = rigCache.get(gltf.scene);
    if (!rig) {
      rig = new PartRig(gltf, id, shared);
      rigCache.set(gltf.scene, rig);
    }
    return rig;
  }

  private constructor(
    gltf: GLTF,
    id: PartId,
    shared: { ink: ShaderMaterial; crease: LineBasicMaterial; scored: Texture | null; tone: Tone },
  ) {
    this.id = id;
    const scene = gltf.scene;
    const partRoot = scene.children.find((c) => c.userData && (c.userData.view || c.userData.part)) ?? scene;
    this.view = readView(partRoot);
    this.upAxis = new Vector3(...this.view.up).normalize();

    const found = (partRoot.userData?.asFound ?? {}) as Record<string, number>;
    this.asFound = {
      inner: typeof found.PadInner_Friction === "number" ? found.PadInner_Friction * 1000 : 3,
      outer: typeof found.PadOuter_Friction === "number" ? found.PadOuter_Friction * 1000 : 4,
    };
    this.innerMM = this.asFound.inner;
    this.outerMM = this.asFound.outer;

    // Pivot about the view target: pivot at +target, scene at −target.
    const [tx, ty, tz] = this.view.target;
    this.pivot.name = `${id}-pivot`;
    this.pivot.position.set(tx, ty, tz);
    scene.position.set(-tx, -ty, -tz);
    this.pivot.add(scene);

    // ---- nodes with extras -----------------------------------------------------------------
    const orders: number[] = [];
    const rigNodes: Array<{ object: Object3D; order: number }> = [];
    partRoot.traverse((object) => {
      if (object === partRoot) return;
      const data = object.userData ?? {};
      const anchorMatch = /^Anchor_(\d+)$/.exec(object.name);
      if (anchorMatch || typeof data.anchor === "number") {
        const n = typeof data.anchor === "number" ? data.anchor : Number(anchorMatch![1]);
        this.anchors.push({ n, label: String(data.label ?? object.name), object });
        return;
      }
      if (object.parent !== partRoot) return;
      const order = typeof data.order === "number" ? data.order : 0;
      orders.push(order);
      rigNodes.push({ object, order });
    });
    this.anchors.sort((a, b) => a.n - b.n);

    const distinct = [...new Set(orders)].sort((a, b) => a - b);
    const rank = (o: number) => (distinct.length > 1 ? distinct.indexOf(o) / (distinct.length - 1) : 0);

    for (const { object, order } of rigNodes) {
      const data = object.userData ?? {};
      const axis = data.thicknessAxis === "x" || data.thicknessAxis === "y" || data.thicknessAxis === "z" ? (data.thicknessAxis as Axis) : null;
      this.nodes.push({
        object,
        basePos: object.position.clone(),
        baseQuat: object.quaternion.clone(),
        baseScale: object.scale.clone(),
        explode: vec(data.explode) ?? new Vector3(),
        explodeRot: vec(data.explodeRot),
        delay: rank(order) * MAX_DELAY,
        clampAssemble: /^Gauge_/.test(object.name),
        wearGroup: typeof data.wearGroup === "string" ? data.wearGroup : null,
        wearAdvance: vec(data.wearAdvance),
        thickness: axis ? { axis, full: typeof data.newThickness === "number" ? data.newThickness : 0.01 } : null,
        cleanScale: typeof data.cleanScale === "number" ? data.cleanScale : null,
      });
    }

    // ---- materials: finding fills, rotor wear, polygon offset for the creases ---------------
    const fillColor = new Color(FILL[shared.tone]);
    const fill = new MeshStandardMaterial({
      name: `${id}-finding`,
      color: fillColor,
      roughness: 0.8,
      metalness: 0,
      emissive: fillColor,
      emissiveIntensity: 0.16,
    });
    let tinted: MeshStandardMaterial | null = null;
    let rotorWear: RotorWear | null = null;

    let triangles = 0;
    let draws = 0;
    for (const node of this.nodes) {
      const primitives: Mesh[] = [];
      if ((node.object as Mesh).isMesh) primitives.push(node.object as Mesh);
      else node.object.children.forEach((c) => (c as Mesh).isMesh && primitives.push(c as Mesh));
      if (!primitives.length) continue;

      const finding = node.object.userData?.finding === true;
      for (const mesh of primitives) {
        let material = mesh.material as MeshStandardMaterial;
        if (finding && !/crack/i.test(material.name)) {
          if (shared.tone === "ok") {
            tinted ??= (() => {
              const t = material.clone();
              t.name = `${material.name}-tint`;
              t.color.lerp(fillColor, OK_TINT);
              return t;
            })();
            material = tinted;
          } else {
            material = fill;
          }
          mesh.material = material;
        }
        if (material.name === "RotorFace" && shared.scored && !rotorWear) {
          rotorWear = applyRotorWear(material, shared.scored);
          this.textures.add(shared.scored);
        }
        material.polygonOffset = true;
        material.polygonOffsetFactor = 1;
        material.polygonOffsetUnits = 1;
        this.materials.add(material);
        if (material.map) this.textures.add(material.map);
        const g = mesh.geometry as BufferGeometry;
        triangles += (g.index ? g.index.count : g.getAttribute("position").count) / 3;
        draws += 1;
      }

      const inked = inkNode(
        node.object,
        primitives.map((m) => m.geometry as BufferGeometry),
        shared.ink,
        shared.crease,
      );
      triangles += inked.hullTriangles;
      draws += 2;
    }
    this.rotorWear = rotorWear;
    this.triangles = triangles;
    this.drawCalls = draws;
    this.pivot.visible = false;
    this.apply();
  }

  /** Factor for one node at local progress p (assemble-in is uniform; EXPLODE is staggered). */
  private factor(node: NodeRig): number {
    const { assembleEnd, explodeEnd } = TIMING;
    if (this.p < assembleEnd) {
      const f = explodeAt(this.p, this.item);
      return node.clampAssemble ? Math.min(f, 1) : f;
    }
    const u = (this.p - assembleEnd) / (explodeEnd - assembleEnd);
    return smootherstep((u - node.delay) / (1 - MAX_DELAY));
  }

  private apply() {
    const innerGap = (10 - this.innerMM) / 1000;
    const outerGap = (10 - this.outerMM) / 1000;
    for (const node of this.nodes) {
      const f = this.factor(node);
      const o = node.object;
      o.position.copy(node.basePos).addScaledVector(node.explode, f);
      if (node.wearAdvance && node.wearGroup) {
        const gap = node.wearGroup === "PadInner" ? innerGap : node.wearGroup === "PadOuter" ? outerGap : 0;
        o.position.addScaledVector(node.wearAdvance, gap);
      }
      o.quaternion.copy(node.baseQuat);
      if (node.explodeRot) {
        _euler.set(node.explodeRot.x * f, node.explodeRot.y * f, node.explodeRot.z * f, "XYZ");
        o.quaternion.multiply(_quat.setFromEuler(_euler));
      }
      o.scale.copy(node.baseScale);
      if (node.thickness) {
        const mm = node.wearGroup === "PadOuter" ? this.outerMM : this.innerMM;
        const k = Math.max(0.001, mm / 1000 / node.thickness.full);
        o.scale[node.thickness.axis] = node.baseScale[node.thickness.axis] * k;
        o.visible = mm > 0.05;
      }
      if (node.cleanScale !== null) {
        const s = 1 + (node.cleanScale - 1) * this.clean;
        o.scale.multiplyScalar(Math.max(0.0001, s));
        o.visible = s > 0.002;
      }
    }
  }

  get visible() {
    return this.pivot.visible;
  }

  set visible(v: boolean) {
    this.pivot.visible = v;
  }

  /** Pose for the item's local progress (stage timing in data/inspection). */
  setProgress(p: number, item: number) {
    if (p === this.p && item === this.item) return;
    this.p = p;
    this.item = item;
    this.apply();
  }

  /** Brake only: millimetres of friction left on the inner pad (the outer pad keeps 1 mm more). */
  setWear(innerMM: number) {
    const inner = Math.max(0, Math.min(10, innerMM));
    const outer = Math.min(10, inner + (this.asFound.outer - this.asFound.inner));
    if (inner === this.innerMM && outer === this.outerMM) return;
    this.innerMM = inner;
    this.outerMM = outer;
    this.apply();
  }

  /** Battery only: 0 = as found (crusty clamp), 1 = cleaned. */
  setClean(k: number) {
    const c = Math.max(0, Math.min(1, k));
    if (c === this.clean) return;
    this.clean = c;
    this.apply();
  }

  setYaw(radians: number) {
    this.pivot.quaternion.setFromAxisAngle(_axis.copy(this.upAxis), radians);
  }

  /** The node the grind sparks come from (the inner pad's face) and the rotor centre. */
  contact(): { anchor: Object3D | null; rotor: Object3D | null } {
    const anchor = this.anchors.find((a) => a.n === 2)?.object ?? null;
    const rotor = this.nodes.find((n) => n.object.name === "Rotor")?.object ?? null;
    return { anchor, rotor };
  }

  /** Run `fn` with the part fully exploded and square to the camera (callout label layout). */
  withLayoutPose<T>(fn: () => T): T {
    const saved = { p: this.p, item: this.item, q: this.pivot.quaternion.clone() };
    this.p = 1;
    this.apply();
    this.pivot.quaternion.identity();
    this.pivot.updateMatrixWorld(true);
    try {
      return fn();
    } finally {
      this.p = saved.p;
      this.item = saved.item;
      this.pivot.quaternion.copy(saved.q);
      this.apply();
      this.pivot.updateMatrixWorld(true);
    }
  }
}
