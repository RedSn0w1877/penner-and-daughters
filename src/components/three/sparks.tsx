// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Grind sparks (spec §11.3/§14): when the wear ruler reaches 0 mm, ≤ 120 points burst from the
 * pad's contact anchor for 1.2 s, thrown along the rotor's spin, falling, and cooling from hot
 * amber to ink with normal blending (no additive glow). One Points object, one draw call, hidden
 * (zero draws) whenever no burst is running. Reduced motion never fires it (lite tier).
 */
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  Points,
  PointsMaterial,
  Vector3,
} from "three";

export const SPARK_COUNT = 120;
export const SPARK_SECONDS = 1.2;

const HOT = new Color("#FFE3A3");
const AMBER = new Color("#F4B43A");
const INK = new Color("#121417");
const FAR = 1e5;

export class SparkBurst {
  readonly points: Points;
  private readonly geometry: BufferGeometry;
  private readonly pos: Float32Array;
  private readonly col: Float32Array;
  private readonly vel: Float32Array;
  private readonly life: Float32Array;
  private readonly delay: Float32Array;
  private readonly origin = new Vector3();
  private gravity = 1;
  private age = Infinity;
  private readonly tmp = new Color();

  constructor(count = SPARK_COUNT) {
    const n = Math.min(count, SPARK_COUNT);
    this.pos = new Float32Array(n * 3).fill(FAR);
    this.col = new Float32Array(n * 3);
    this.vel = new Float32Array(n * 3);
    this.life = new Float32Array(n);
    this.delay = new Float32Array(n);

    this.geometry = new BufferGeometry();
    const position = new BufferAttribute(this.pos, 3).setUsage(DynamicDrawUsage);
    const color = new BufferAttribute(this.col, 3).setUsage(DynamicDrawUsage);
    this.geometry.setAttribute("position", position);
    this.geometry.setAttribute("color", color);

    const material = new PointsMaterial({
      name: "Sparks",
      size: 3,
      sizeAttenuation: false,
      vertexColors: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    this.points = new Points(this.geometry, material);
    this.points.name = "Sparks";
    this.points.frustumCulled = false;
    this.points.renderOrder = 20;
    this.points.visible = false;
    this.points.raycast = () => {};
  }

  get active(): boolean {
    return this.age < SPARK_SECONDS;
  }

  /**
   * Throw a burst from `origin` (world space) along `tangent` (the rotor's spin at that point).
   * `scale` is the size of the part on screen in world units (the view's ortho width), so the
   * sparks travel the same distance in pixels on every part and canvas size.
   */
  fire(origin: Vector3, tangent: Vector3, scale: number) {
    this.origin.copy(origin);
    this.gravity = 1.1 * scale;
    const t = tangent.clone().normalize();
    const n = this.life.length;
    for (let i = 0; i < n; i++) {
      const speed = scale * (0.32 + Math.random() * 0.62);
      // Mostly along the spin, spread ±35°, a little toward the viewer.
      const spread = (Math.random() - 0.5) * 1.2;
      const lift = (Math.random() - 0.35) * 0.9;
      const vx = t.x + spread * -t.y + (Math.random() - 0.5) * 0.25;
      const vy = t.y + spread * t.x + lift * 0.6;
      const vz = t.z + (Math.random() - 0.5) * 0.5;
      const len = Math.hypot(vx, vy, vz) || 1;
      this.vel[i * 3] = (vx / len) * speed;
      this.vel[i * 3 + 1] = (vy / len) * speed;
      this.vel[i * 3 + 2] = (vz / len) * speed;
      this.life[i] = 0.35 + Math.random() * (SPARK_SECONDS - 0.45);
      this.delay[i] = Math.random() * 0.3;
      this.pos[i * 3] = FAR;
      this.pos[i * 3 + 1] = FAR;
      this.pos[i * 3 + 2] = FAR;
    }
    this.age = 0;
    this.points.visible = true;
  }

  /** Advance the burst; returns true while it still needs frames. */
  update(dt: number): boolean {
    if (!this.active) {
      this.points.visible = false;
      return false;
    }
    this.age += Math.min(dt, 1 / 20);
    const n = this.life.length;
    for (let i = 0; i < n; i++) {
      const local = this.age - this.delay[i];
      const k = local / this.life[i];
      const o = i * 3;
      if (local < 0 || k >= 1) {
        this.pos[o] = FAR;
        this.pos[o + 1] = FAR;
        this.pos[o + 2] = FAR;
        continue;
      }
      // Ballistic arc with a little drag.
      const drag = Math.exp(-1.6 * local);
      this.pos[o] = this.origin.x + this.vel[o] * local * drag;
      this.pos[o + 1] = this.origin.y + this.vel[o + 1] * local * drag - 0.5 * this.gravity * local * local;
      this.pos[o + 2] = this.origin.z + this.vel[o + 2] * local * drag;
      // Hot → amber in the first third of its life, then amber → ink.
      if (k < 0.33) this.tmp.copy(HOT).lerp(AMBER, k / 0.33);
      else this.tmp.copy(AMBER).lerp(INK, (k - 0.33) / 0.67);
      this.col[o] = this.tmp.r;
      this.col[o + 1] = this.tmp.g;
      this.col[o + 2] = this.tmp.b;
    }
    (this.geometry.getAttribute("position") as BufferAttribute).needsUpdate = true;
    (this.geometry.getAttribute("color") as BufferAttribute).needsUpdate = true;
    const running = this.active;
    this.points.visible = running;
    return running;
  }

  /** Stop at once (the visitor dragged off 0 mm, or the item changed). */
  stop() {
    this.age = Infinity;
    this.points.visible = false;
  }

  dispose() {
    this.geometry.dispose();
    (this.points.material as PointsMaterial).dispose();
  }
}
