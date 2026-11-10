"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * THE one WebGL context on the site (spec §14): the transparent R3F canvas inside "What did you
 * find?" on the desktop full tier.
 *
 *   frameloop "demand" while the stage is near the screen, "never" otherwise, so an idle page draws
 *   nothing · dpr [1, 1.5] · Neutral tone mapping · sRGB out · no shadows · orthographic camera
 *   from each GLB's view · hemisphere + one key light · two softbox "lightformers" captured once
 *   into a 64 px PMREM at intensity 0.5, so iron reads as iron, never chrome.
 *
 * All four parts load before anything shows, every shader is compiled with compileAsync and every
 * buffer uploaded once, so nothing compiles or uploads on the scroll path. Only the active part is
 * visible. A renderer that can't start, a scene that throws or a lost context hands the stage to
 * the pre-rendered frames for the rest of the visit.
 */
import { Canvas, addAfterEffect, useFrame, useThree, type RootState } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  Color,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  NeutralToneMapping,
  OrthographicCamera,
  PMREMGenerator,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
  type LineBasicMaterial,
  type ShaderMaterial,
  type Texture,
  type WebGLRenderTarget,
} from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ITEMS, RATING_TONE, smootherstep, type Tone } from "@/data/inspection";
import type { PartId } from "@/data/media";
import { createCreaseMaterial, createInkMaterial, setInkResolution } from "./ink";
import type { DiagramDrive, DiagramStats } from "./lazy-diagram";
import { PART_ORDER, PART_URL, preloadParts, useGLTF, useRotorScored } from "./loaders";
import { PartRig } from "./part-model";
import { NO_INSETS, fitOrthoCamera, projectAnchors, type AnchorPoint, type Insets } from "./projector";
import { SparkBurst } from "./sparks";

// Start every fetch the moment this chunk runs (no suspense waterfall, brake first).
preloadParts();

/* ---- lighting (tuned against the EEVEE pre-renders) -------------------------------------
 * three ≥ r155 divides diffuse light by π, so the spec's "hemisphere 0.6" (a legacy-units figure)
 * is 0.6π here. QA: ?pdlight=hemi,key,env,roomHex overrides these for one load (tuning only).
 */
const HEMI_SKY = "#ffffff";
const HEMI_GROUND = "#d5d9dd";
const LIGHT = { hemi: 0.6 * Math.PI, key: 3.2, env: 0.5, room: "#c3c8ce" };

function lightOverride() {
  if (typeof window === "undefined") return;
  try {
    const raw = new URLSearchParams(window.location.search).get("pdlight");
    if (!raw) return;
    const [h, k, e, room] = raw.replace(/\/+$/, "").split(",");
    if (Number.isFinite(+h)) LIGHT.hemi = +h;
    if (Number.isFinite(+k)) LIGHT.key = +k;
    if (Number.isFinite(+e)) LIGHT.env = +e;
    if (room && /^[0-9a-f]{6}$/i.test(room)) LIGHT.room = `#${room}`;
  } catch {
    /* keep the defaults */
  }
}
lightOverride();

/** Pixels of camera shake when the grind sparks fire. */
const SHAKE_PX = 2;
const SHAKE_SECONDS = 0.28;
/** Seconds for the rotor to blend to scored / back to clean. */
const SCORE_SECONDS = 0.45;

const TONE_BY_PART = Object.fromEntries(ITEMS.map((i) => [i.part, RATING_TONE[i.rating]])) as Record<PartId, Tone>;
const ITEM_OF_PART = Object.fromEntries(ITEMS.map((i, index) => [i.part, index])) as Record<PartId, number>;

let sharedInk: ShaderMaterial | null = null;
let sharedCrease: LineBasicMaterial | null = null;

/** The softbox "lightformers" (two emissive planes in a grey bay), captured once at 64 px. */
function buildEnvironment(gl: WebGLRenderer): WebGLRenderTarget {
  const room = new Scene();
  room.background = new Color(LIGHT.room);
  const plane = new PlaneGeometry(1, 1);
  const materials: MeshBasicMaterial[] = [];
  const softbox = (intensity: number, w: number, h: number, x: number, y: number, z: number) => {
    const material = new MeshBasicMaterial({ color: new Color(intensity, intensity, intensity), side: DoubleSide, toneMapped: false });
    materials.push(material);
    const mesh = new Mesh(plane, material);
    mesh.scale.set(w, h, 1);
    mesh.position.set(x, y, z);
    mesh.lookAt(0, 0, 0);
    room.add(mesh);
  };
  softbox(3.2, 7, 4, -3.5, 5, 4); // key: wide, upper left, in front
  softbox(1.5, 3.5, 6, 6, 1.2, -2); // rim: tall, right, behind
  const pmrem = new PMREMGenerator(gl);
  const target = pmrem.fromScene(room, 0, 0.1, 100, { size: 64 });
  pmrem.dispose();
  plane.dispose();
  materials.forEach((m) => m.dispose());
  return target;
}

interface ControllerInit {
  gl: WebGLRenderer;
  scene: Scene;
  camera: OrthographicCamera;
  drive: DiagramDrive;
  invalidate: () => void;
  gltfs: Record<PartId, GLTF>;
  scored: Texture;
}

const _buffer = new Vector2();
const _right = new Vector3();
const _v = new Vector3();

/** Owns every three.js object in the diagram and runs one update per rendered frame. */
class DiagramController {
  private readonly rigs: Record<PartId, PartRig>;
  private readonly sparks = new SparkBurst();
  private readonly lights = new Group();
  private readonly key = new DirectionalLight("#ffffff", LIGHT.key);
  private env: WebGLRenderTarget | null = null;
  private ready = false;
  private disposed = false;
  private active: PartId | null = null;
  private litFor: PartId | null = null;
  private yaw = 0;
  private scored = 0;
  private burstSeen: number;
  private shakeT = SHAKE_SECONDS;
  private readonly anchors: AnchorPoint[] = [];
  private layout: AnchorPoint[] = [];
  private layoutKey = "";
  private frames = 0;
  private maxCalls = 0;
  private maxTriangles = 0;

  constructor(private readonly init: ControllerInit) {
    sharedInk ??= createInkMaterial();
    sharedCrease ??= createCreaseMaterial();
    const ink = sharedInk;
    const crease = sharedCrease;
    this.rigs = Object.fromEntries(
      PART_ORDER.map((id) => [
        id,
        PartRig.for(init.gltfs[id], id, { ink, crease, scored: id === "brake" ? init.scored : null, tone: TONE_BY_PART[id] }),
      ]),
    ) as Record<PartId, PartRig>;
    this.burstSeen = init.drive.burst;
    // Already at the grind when the diagram first draws: start scored, no blend.
    this.scored = init.drive.wear <= 0 ? 1 : 0;
    this.lights.name = "lights";
    this.lights.add(new HemisphereLight(HEMI_SKY, HEMI_GROUND, LIGHT.hemi), this.key, this.key.target);
  }

  start() {
    const { gl, scene, camera, drive } = this.init;
    // R3F's first configure() sets ACES on whatever renderer it's handed; the spec wants Neutral,
    // and it must be set before compileAsync (tone mapping is part of every program's key).
    gl.toneMapping = NeutralToneMapping;
    gl.outputColorSpace = SRGBColorSpace;
    scene.add(this.lights, this.sparks.points, ...PART_ORDER.map((id) => this.rigs[id].pivot));
    this.env = buildEnvironment(gl);
    scene.environment = this.env.texture;
    scene.environmentIntensity = LIGHT.env;
    drive.setStatus("loading");
    for (const id of PART_ORDER) for (const texture of this.rigs[id].textures) gl.initTexture(texture);
    this.aim("brake", 960, 600, NO_INSETS);
    gl.compileAsync(scene, camera)
      .then(() => {
        if (this.disposed) return;
        this.warmup();
        this.ready = true;
        drive.connect(this.init.invalidate);
        drive.setStatus("ready");
        this.init.invalidate();
      })
      .catch((error: unknown) => drive.fail(error instanceof Error ? error.message : "compile failed"));
  }

  /** Draw each part once into a 1 px scissor so every buffer is on the GPU before the pin. */
  private warmup() {
    const { gl, scene, camera } = this.init;
    gl.setScissorTest(true);
    gl.setScissor(0, 0, 1, 1);
    for (const id of PART_ORDER) {
      for (const other of PART_ORDER) this.rigs[other].visible = other === id;
      this.rigs[id].setProgress(1, ITEM_OF_PART[id]);
      this.aim(id, 960, 600, NO_INSETS);
      gl.render(scene, camera);
    }
    gl.setScissorTest(false);
    for (const id of PART_ORDER) this.rigs[id].visible = false;
    gl.clear();
  }

  /** Fit the camera to a part's view and put the key light upper left, in front of it. */
  private aim(part: PartId, width: number, height: number, insets: Insets, shake = { x: 0, y: 0 }) {
    const rig = this.rigs[part];
    fitOrthoCamera(this.init.camera, rig.view, width, height, insets, shake);
    if (this.litFor !== part) {
      this.litFor = part;
      const { dir, up, target } = rig.view;
      const d = _v.set(dir[0], dir[1], dir[2]).normalize();
      const u = new Vector3(up[0], up[1], up[2]).normalize();
      _right.crossVectors(u, d).normalize();
      this.key.target.position.set(target[0], target[1], target[2]);
      this.key.position
        .copy(this.key.target.position)
        .addScaledVector(d, 1.6)
        .addScaledVector(u, 1.9)
        .addScaledVector(_right, -1.3);
    }
  }

  private fireSparks(rig: PartRig) {
    const { anchor, rotor } = rig.contact();
    if (!anchor) return;
    this.init.scene.updateMatrixWorld();
    const origin = new Vector3().setFromMatrixPosition(anchor.matrixWorld);
    const center = rotor ? new Vector3().setFromMatrixPosition(rotor.matrixWorld) : origin.clone().add(new Vector3(-0.1, 0, 0));
    const axis = rotor ? new Vector3(0, 0, 1).transformDirection(rotor.matrixWorld) : new Vector3(0, 0, 1);
    const tangent = new Vector3().crossVectors(axis, origin.clone().sub(center));
    if (tangent.lengthSq() < 1e-8) tangent.set(1, -1, 0);
    if (tangent.y > 0) tangent.negate();
    this.sparks.fire(origin, tangent, rig.view.orthoWidth);
  }

  recordStats() {
    if (!this.ready || this.disposed) return;
    const info = this.init.gl.info.render;
    this.maxCalls = Math.max(this.maxCalls, info.calls);
    this.maxTriangles = Math.max(this.maxTriangles, info.triangles);
    const stats: DiagramStats & { maxCalls: number; maxTriangles: number } = {
      calls: info.calls,
      triangles: info.triangles,
      frames: this.frames,
      part: this.active ?? "",
      maxCalls: this.maxCalls,
      maxTriangles: this.maxTriangles,
    };
    (window as Window & { __pdDiagram?: typeof stats }).__pdDiagram = stats;
  }

  frame(state: RootState, rawDt: number) {
    if (!this.ready || this.disposed) return;
    // On demand the first frame after a pause reports the whole pause; ease from where we were.
    const dt = Math.min(rawDt, 1 / 30);
    const { drive, gl, scene, camera } = this.init;

    const { item, p } = drive.state;
    const part = ITEMS[item]?.part ?? "brake";
    if (part !== this.active) {
      for (const id of PART_ORDER) this.rigs[id].visible = id === part;
      this.active = part;
      this.sparks.stop();
      this.shakeT = SHAKE_SECONDS;
      this.layoutKey = "";
    }
    const rig = this.rigs[part];
    rig.setProgress(p, item);
    let more = false;

    if (part === "brake") {
      rig.setWear(drive.wear);
      const target = drive.wear <= 0 ? 1 : 0;
      if (this.scored !== target) {
        const step = dt / SCORE_SECONDS;
        this.scored = target > this.scored ? Math.min(target, this.scored + step) : Math.max(target, this.scored - step);
        more = true;
      }
      rig.rotorWear?.set(smootherstep(this.scored));
      if (drive.burst !== this.burstSeen) {
        this.burstSeen = drive.burst;
        if (!drive.reducedMotion) {
          this.fireSparks(rig);
          this.shakeT = 0;
        }
      }
    } else if (part === "battery") {
      // Cleaned as it comes apart: the crust on the + clamp scales away during EXPLODE.
      rig.setClean(smootherstep((p - 0.2) / 0.35));
    }

    // Pointer yaw, damped; keep drawing only while it settles.
    const target = drive.reducedMotion ? 0 : drive.yaw;
    this.yaw += (target - this.yaw) * (1 - Math.exp(-dt * 7));
    if (Math.abs(target - this.yaw) > 1e-4) more = true;
    else this.yaw = target;
    rig.setYaw(this.yaw);

    if (this.sparks.update(dt)) more = true;

    let shake = { x: 0, y: 0 };
    if (this.shakeT < SHAKE_SECONDS) {
      const a = SHAKE_PX * (1 - this.shakeT / SHAKE_SECONDS);
      shake = { x: (Math.random() * 2 - 1) * a, y: (Math.random() * 2 - 1) * a };
      this.shakeT += dt;
      more = true;
    }

    const { width, height } = state.size;
    const insets = drive.insets;
    gl.getDrawingBufferSize(_buffer);
    setInkResolution(sharedInk!, _buffer.x, _buffer.y, gl.getPixelRatio());

    // Callout label layout: fully exploded and square on, only when the part, size or gutters change.
    const key = `${part}:${width}x${height}:${insets.left},${insets.right},${insets.top},${insets.bottom}`;
    if (key !== this.layoutKey) {
      this.layoutKey = key;
      this.aim(part, width, height, insets);
      this.layout = rig.withLayoutPose(() => {
        scene.updateMatrixWorld();
        return projectAnchors(rig.anchors, camera, width, height, []).map((a) => ({ ...a }));
      });
    }

    this.aim(part, width, height, insets, shake);
    scene.updateMatrixWorld();
    projectAnchors(rig.anchors, camera, width, height, this.anchors);
    drive.publish({ item, p, anchors: this.anchors, layout: this.layout, width, height, source: "webgl" });

    this.frames += 1;
    if (more) state.invalidate();
  }

  dispose() {
    this.disposed = true;
    const { scene, drive, invalidate } = this.init;
    drive.disconnect(invalidate);
    scene.remove(this.lights, this.sparks.points, ...PART_ORDER.map((id) => this.rigs[id].pivot));
    if (this.env && scene.environment === this.env.texture) scene.environment = null;
    this.env?.dispose();
    this.sparks.dispose();
  }
}

/** Inside the canvas: loads the four parts (suspends), then hands everything to the controller. */
function Diagram({ drive }: { drive: DiagramDrive }) {
  const brake = useGLTF(PART_URL.brake);
  const tire = useGLTF(PART_URL.tire);
  const belt = useGLTF(PART_URL.belt);
  const battery = useGLTF(PART_URL.battery);
  const scored = useRotorScored();
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera) as OrthographicCamera;
  const invalidate = useThree((s) => s.invalidate);
  const controller = useRef<DiagramController | null>(null);
  const snapshot = useSyncExternalStore(drive.subscribe, drive.snapshot, () => "idle:0");

  useLayoutEffect(() => {
    const ctl = new DiagramController({ gl, scene, camera, drive, invalidate, gltfs: { brake, tire, belt, battery }, scored });
    controller.current = ctl;
    ctl.start();
    return () => {
      ctl.dispose();
      if (controller.current === ctl) controller.current = null;
    };
  }, [gl, scene, camera, drive, invalidate, brake, tire, belt, battery, scored]);

  // Coming back on screen (frameloop never → demand) needs one fresh frame. Only then: an
  // invalidate while leaving the screen would draw one frame nobody sees.
  const onScreen = snapshot.endsWith(":1");
  useEffect(() => {
    if (onScreen) invalidate();
  }, [onScreen, invalidate]);

  useFrame((state, delta) => controller.current?.frame(state, delta));
  // Renderer stats for the frame that was just drawn (QA: window.__pdDiagram).
  useEffect(() => addAfterEffect(() => controller.current?.recordStats()), []);
  return null;
}

/** Builds the renderer ourselves so a failure becomes "use the frames", not an unhandled error. */
function rendererFactory(drive: DiagramDrive) {
  // (R3F passes its default props; only the canvas is used. Typed loosely: R3F's OffscreenCanvas
  // type and the DOM lib's differ.)
  return async (defaults: { canvas: unknown }): Promise<WebGLRenderer> => {
    const canvas = defaults.canvas as HTMLCanvasElement;
    try {
      const renderer = new WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        stencil: false,
      });
      canvas.addEventListener("webglcontextlost", () => drive.fail("context lost"), { once: true });
      renderer.toneMapping = NeutralToneMapping;
      renderer.outputColorSpace = SRGBColorSpace;
      renderer.shadowMap.enabled = false;
      return renderer;
    } catch (error) {
      drive.fail(error instanceof Error ? error.message : "webgl unavailable");
      // Never resolves: R3F waits quietly while the stage swaps to the frame player.
      return new Promise<WebGLRenderer>(() => {});
    }
  };
}

const noEvents = () => ({ enabled: false, priority: 0 });

export default function DiagramCanvas({ drive }: { drive: DiagramDrive }) {
  const snapshot = useSyncExternalStore(drive.subscribe, drive.snapshot, () => "idle:0");
  const visible = snapshot.endsWith(":1");
  const failed = snapshot.startsWith("failed");
  const [camera] = useState(() => Object.assign(new OrthographicCamera(-1, 1, 1, -1, 0.05, 12), { manual: true }));
  const [gl] = useState(() => rendererFactory(drive));

  if (failed) return null;
  return (
    <Canvas
      camera={camera}
      frameloop={visible ? "demand" : "never"}
      dpr={[1, 1.5]}
      gl={gl}
      events={noEvents}
      resize={{ scroll: false, debounce: { scroll: 0, resize: 80 } }}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <Diagram drive={drive} />
      </Suspense>
    </Canvas>
  );
}
