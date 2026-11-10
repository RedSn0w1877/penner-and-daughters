// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Every media file the site loads (spec §15), already run through withBase() so the URLs work
 * under the /penner-and-daughters base path. The assets stream ships exactly these names; the
 * "-v1" suffix versions them, because GitHub Pages caches for 10 minutes.
 *
 * All stills and clips are Blender renders of one fictional shop (lead's media override),
 * each carrying a burned-in "HVNF Studios · portfolio sample" mark.
 */
import { withBase } from "@/lib/base-path";

/* =============================================================================================
 * Video
 * =========================================================================================== */

export type ClipId = "hero" | "night-drop" | "door-rise" | "lift-rise" | "pad-gauge" | "torque" | "road-test" | "pickup-box";

/** print = a photo print on a sheet · fullbleed = the night film (1600 w) · band = a 16:9 band on phones. */
export type ClipVariant = "print" | "fullbleed" | "band";

export interface VideoSource {
  src: string;
  /** MIME type with codecs, so the browser skips what it can't decode without fetching it. */
  type: string;
}

export interface Poster {
  avif: string;
  webp: string;
  width: number;
  height: number;
}

export interface ClipRendition {
  width: number;
  height: number;
  /** Source order: AV1 MP4 → VP9 WebM (where present) → H.264 MP4. */
  sources: readonly VideoSource[];
  poster: Poster;
}

export interface Clip {
  id: ClipId;
  /** Only the hero, the night drop and the pad gauge loop; the rest play once and hold. */
  loop: boolean;
  /** Seconds. Autoplaying clips over 5 s get a visible Pause control. */
  duration: number;
  /** On the touch tier only these play (one at a time); the rest stay posters. */
  touchPlays: boolean;
  alt: string;
  variants: Partial<Record<ClipVariant, ClipRendition>>;
}

const AV1_HD = 'video/mp4; codecs="av01.0.08M.08"';
const AV1_SD = 'video/mp4; codecs="av01.0.05M.08"';
const VP9 = 'video/webm; codecs="vp09.00.40.08"';
const H264 = 'video/mp4; codecs="avc1.640028"';

const m = (file: string) => withBase(`/media/${file}`);

function rendition(
  name: string,
  width: number,
  height: number,
  opts: { vp9?: boolean; vp9First?: boolean; hd?: boolean; poster?: { name: string; width: number; height: number } } = {},
): ClipRendition {
  // Browsers take the first source they can play, so the smallest encode goes first. That's AV1
  // everywhere except where the VP9 file came out smaller (vp9First).
  const av1: VideoSource = { src: m(`${name}.av1.mp4`), type: opts.hd ? AV1_HD : AV1_SD };
  const vp9: VideoSource | null = opts.vp9 || opts.vp9First ? { src: m(`${name}.vp9.webm`), type: VP9 } : null;
  const sources: VideoSource[] = opts.vp9First && vp9 ? [vp9, av1] : vp9 ? [av1, vp9] : [av1];
  sources.push({ src: m(`${name}.h264.mp4`), type: H264 });
  const p = opts.poster ?? { name, width, height };
  return {
    width,
    height,
    sources,
    poster: { avif: m(`${p.name}.avif`), webp: m(`${p.name}.webp`), width: p.width, height: p.height },
  };
}

/** 960 × 540 prints: AV1 + H.264 and a poster of the same name. */
const print540 = (name: string) => rendition(name, 960, 540);

export const CLIPS: Record<ClipId, Clip> = {
  hero: {
    id: "hero",
    loop: true,
    duration: 8,
    touchPlays: true,
    alt: "A silver sedan up on the lift in a bright repair bay, the roll-up door open to the morning.",
    variants: {
      print: rendition("hero-4x5-v1", 864, 1080, { vp9First: true, hd: true }),
      band: rendition("hero-16x9-v1", 1280, 720, { poster: { name: "hero-16x9-v1", width: 828, height: 466 } }),
    },
  },
  "night-drop": {
    id: "night-drop",
    loop: true,
    duration: 8,
    touchPlays: true,
    alt: "The shop's side door at night in the rain: the blue office door, the steel key slot and the porch light.",
    variants: {
      fullbleed: rendition("night-drop-v1", 1600, 900, { vp9: true, hd: true }),
      band: rendition("night-drop-720-v1", 1280, 720, { poster: { name: "night-drop-828-v1", width: 828, height: 466 } }),
    },
  },
  "door-rise": {
    id: "door-rise",
    loop: false,
    duration: 8,
    touchPlays: true,
    alt: "At dawn the white roll-up door rises on the bay, with the silver sedan waiting on the lift.",
    variants: {
      fullbleed: rendition("door-rise-v1", 1600, 900, { vp9: true, hd: true }),
      band: rendition("door-rise-720-v1", 1280, 720, { poster: { name: "door-rise-828-v1", width: 828, height: 466 } }),
    },
  },
  "lift-rise": {
    id: "lift-rise",
    loop: false,
    duration: 8,
    touchPlays: false,
    alt: "The two-post lift raises the silver sedan to full height.",
    variants: { print: print540("lift-rise-v1") },
  },
  "pad-gauge": {
    id: "pad-gauge",
    loop: true,
    duration: 8,
    touchPlays: true,
    alt: "A brake-pad gauge slides along the edge of the worn inner pad.",
    variants: { print: print540("pad-gauge-v1") },
  },
  torque: {
    id: "torque",
    loop: false,
    duration: 4,
    touchPlays: false,
    alt: "A torque wrench clicks on a lug nut, then moves across the wheel in a star pattern.",
    variants: { print: print540("torque-v1") },
  },
  "road-test": {
    id: "road-test",
    loop: false,
    duration: 4,
    touchPlays: false,
    alt: "Tracking alongside the sedan's front wheel on a quiet street, leaf shadows sliding over the car.",
    variants: { print: print540("road-test-v1") },
  },
  "pickup-box": {
    id: "pickup-box",
    loop: false,
    duration: 4,
    touchPlays: false,
    alt: "A steel pickup locker door swings shut and latches on the brick wall.",
    variants: { print: print540("pickup-box-v1") },
  },
};

/** The rendition for a variant, or the clip's first one when that variant doesn't exist. */
export function clipRendition(id: ClipId, variant: ClipVariant): ClipRendition {
  const v = CLIPS[id].variants;
  return v[variant] ?? v.print ?? v.fullbleed ?? v.band!;
}

/* =============================================================================================
 * Stills (public/img/photos): AVIF + WebP, 960 × 720 with 480-wide variants
 * =========================================================================================== */

export type PhotoId = "pads" | "bulge" | "belt" | "battery" | "filters" | "parts" | "waiting-room";

export interface Photo {
  id: string;
  avif: string;
  webp: string;
  width: number;
  height: number;
  /** 480-wide variants for srcset. */
  small?: { avif: string; webp: string; width: number; height: number };
  alt: string;
}

const img = (file: string) => withBase(`/img/photos/${file}`);

function photo(id: PhotoId, alt: string): Photo {
  return {
    id,
    avif: img(`${id}-v1.avif`),
    webp: img(`${id}-v1.webp`),
    width: 960,
    height: 720,
    small: { avif: img(`${id}-v1-480.avif`), webp: img(`${id}-v1-480.webp`), width: 480, height: 360 },
    alt,
  };
}

export const PHOTOS: Record<PhotoId, Photo> = {
  pads: photo("pads", "The worn inner brake pad, 3 mm of material left, next to a new 10 mm pad on a steel workbench."),
  bulge: photo("bulge", "A bulge in the sidewall of the left front tire."),
  belt: photo("belt", "Small cracks across the ribs of the serpentine belt."),
  battery: photo("battery", "The battery terminals, cleaned and coated."),
  filters: photo("filters", "A dirty air filter next to a new one."),
  parts: photo("parts", "New brake pads in their box next to a new tire, ready to go on."),
  "waiting-room": photo("waiting-room", "The waiting room: a desk with outlets and a window into Bay 1."),
};

export const STOREFRONT = {
  wide: { avif: img("storefront-16x9-v1.avif"), webp: img("storefront-16x9-v1.webp"), width: 1280, height: 720 },
  tall: { avif: img("storefront-4x5-v1.avif"), webp: img("storefront-4x5-v1.webp"), width: 864, height: 1080 },
  alt: "The shop from Cooper Mill Road: red brick, two white roll-up doors and the blue office door.",
} as const;

/** The worn pad cut out on a transparent background (the inspection lift-out). */
export const PAD_CUTOUT = { webp: img("pad-cutout-v1.webp"), width: 600 } as const;

/* =============================================================================================
 * Props and line art
 * =========================================================================================== */

export const PROPS = {
  keyTag: { webp: withBase("/img/props/key-tag-v1.webp"), width: 240, height: 360 },
  binderClip: { webp: withBase("/img/props/binder-clip-v1.webp"), width: 160, height: 120 },
} as const;

export const CAR_ART = {
  side: withBase("/img/car/side-v1.svg"),
  top: withBase("/img/car/top-v1.svg"),
  zones: withBase("/img/car/zones-v1.json"),
  /** Default viewBox of each drawing; zones-v1.json may override with "viewBox": { side: [w, h], top: [w, h] }. */
  viewBox: { side: [2400, 800], top: [2400, 1100] },
} as const;

/* =============================================================================================
 * Pre-rendered diagram frames (touch tier) and stills (lite tier)
 * =========================================================================================== */

export type PartId = "brake" | "tire" | "belt" | "battery";

export const FRAME_COUNT = 24;

const frame = (part: PartId, file: string) => withBase(`/frames/v1/${part}/${file}`);

export const FRAMES: Record<
  PartId,
  { frames: string[]; anchors: string; still: string; width: number; height: number; stillWidth: number; stillHeight: number }
> = Object.fromEntries(
  (["brake", "tire", "belt", "battery"] as const).map((part) => [
    part,
    {
      frames: Array.from({ length: FRAME_COUNT }, (_, i) => frame(part, `f${String(i).padStart(2, "0")}.avif`)),
      anchors: frame(part, "anchors.json"),
      still: frame(part, "still.avif"),
      width: 960,
      height: 600,
      stillWidth: 1200,
      stillHeight: 750,
    },
  ]),
) as Record<PartId, { frames: string[]; anchors: string; still: string; width: number; height: number; stillWidth: number; stillHeight: number }>;

/** Brake pad wear stills for the ruler on touch / lite, keyed by millimetres left. */
export const WEAR_STILLS: Record<10 | 7 | 5 | 3 | 1 | 0, string> = {
  10: frame("brake", "wear-10.avif"),
  7: frame("brake", "wear-7.avif"),
  5: frame("brake", "wear-5.avif"),
  3: frame("brake", "wear-3.avif"),
  1: frame("brake", "wear-1.avif"),
  0: frame("brake", "wear-0.avif"),
};

/* =============================================================================================
 * 3D models (desktop full tier only)
 * =========================================================================================== */

export const MODELS = {
  brake: withBase("/models/brake-corner-v1.glb"),
  tire: withBase("/models/tire-section-v1.glb"),
  belt: withBase("/models/belt-drive-v1.glb"),
  battery: withBase("/models/battery-v1.glb"),
  rotorScored: withBase("/models/tex/rotor-scored-v1.webp"),
  /** Directory for useGLTF's Draco decoder (draco_decoder.wasm + draco_wasm_wrapper.js). */
  draco: withBase("/draco/"),
} as const satisfies Record<string, string>;
