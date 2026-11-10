// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Loading the four inspection parts (desktop full tier only).
 *
 * useGLTF / useGLTF.preload have drei's shape, but run on R3F's own useLoader cache with
 * three's GLTFLoader + DRACOLoader. (drei's wrapper would add three-stdlib's second copy of the
 * glTF loader and the Meshopt decoder, which these files don't use, to a chunk with a hard
 * 230 KB budget.) The Draco decoder is served from /draco/ under the base path, never a CDN.
 */
import { useLoader } from "@react-three/fiber";
import { SRGBColorSpace, TextureLoader, type Texture } from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MODELS, type PartId } from "@/data/media";

/** Item order on the page; the brake is on screen first. */
export const PART_ORDER: readonly PartId[] = ["brake", "tire", "belt", "battery"];

export const PART_URL: Record<PartId, string> = {
  brake: MODELS.brake,
  tire: MODELS.tire,
  belt: MODELS.belt,
  battery: MODELS.battery,
};

let draco: DRACOLoader | null = null;

function withDraco(loader: GLTFLoader) {
  if (!draco) {
    draco = new DRACOLoader();
    draco.setDecoderPath(MODELS.draco);
    // Two workers decode four small files quickly and keep memory down on a busy laptop.
    draco.setWorkerLimit(2);
  }
  loader.setDRACOLoader(draco);
}

/** Suspends until the GLB is loaded (Draco-decoded), then returns the cached result. */
export function useGLTF(url: string): GLTF {
  return useLoader(GLTFLoader, url, withDraco) as GLTF;
}

useGLTF.preload = (url: string) => useLoader.preload(GLTFLoader, url, withDraco);

/**
 * The scored, heat-tinted rotor face (base colour, roughness in alpha). Same UV layout as the
 * clean face inside the GLB, so it follows glTF's convention: sRGB, no vertical flip.
 */
class RotorTextureLoader extends TextureLoader {
  override load(
    url: string,
    onLoad?: (texture: Texture<HTMLImageElement>) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (err: unknown) => void,
  ): Texture<HTMLImageElement> {
    return super.load(
      url,
      (texture) => {
        texture.colorSpace = SRGBColorSpace;
        texture.flipY = false;
        texture.needsUpdate = true;
        onLoad?.(texture);
      },
      onProgress,
      onError,
    );
  }
}

export function useRotorScored(): Texture {
  return useLoader(RotorTextureLoader, MODELS.rotorScored) as Texture;
}

let preloaded = false;

/**
 * Fetch every part (and the scored rotor texture) into the cache, brake first. Call it at idle
 * when #whats-wrong comes into view; safe to call more than once.
 */
export function preloadParts(): void {
  if (preloaded || typeof window === "undefined") return;
  preloaded = true;
  useGLTF.preload(PART_URL.brake);
  useLoader.preload(RotorTextureLoader, MODELS.rotorScored);
  for (const id of PART_ORDER) if (id !== "brake") useGLTF.preload(PART_URL[id]);
}
