// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Rotor wear (spec §14): at 0 mm of pad left the rotor face blends from the clean machined map in
 * the GLB to /models/tex/rotor-scored-v1.webp (scored grooves and a straw-to-blue heat tint, with
 * roughness in alpha), driven by one uniform, uWear 0 → 1. The material keeps its own program
 * (customProgramCacheKey), so it compiles once with everything else before the pin starts.
 */
import type { MeshStandardMaterial, Texture } from "three";

export interface RotorWear {
  /** 0 = clean machined face, 1 = scored and heat-tinted. */
  set(value: number): void;
  get(): number;
}

export function applyRotorWear(material: MeshStandardMaterial, scored: Texture): RotorWear {
  const uniforms = {
    uWear: { value: 0 },
    uScored: { value: scored },
  };

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWear = uniforms.uWear;
    shader.uniforms.uScored = uniforms.uScored;
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uWear;\nuniform sampler2D uScored;")
      .replace(
        "#include <map_fragment>",
        /* glsl */ `#include <map_fragment>
#ifdef USE_MAP
  vec4 pdScored = texture2D( uScored, vMapUv );
  diffuseColor.rgb = mix( diffuseColor.rgb, diffuse * pdScored.rgb, uWear );
#endif`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        /* glsl */ `#include <roughnessmap_fragment>
#ifdef USE_MAP
  roughnessFactor = mix( roughnessFactor, pdScored.a, uWear );
#endif`,
      )
      .replace(
        "#include <metalnessmap_fragment>",
        /* glsl */ `#include <metalnessmap_fragment>
  // A scored, heat-tinted face is oxide, not polished iron: let its colour read on paper.
  metalnessFactor = mix( metalnessFactor, 0.2, uWear );`,
      );
  };
  material.customProgramCacheKey = () => "pd-rotor-wear-v2";
  material.needsUpdate = true;

  return {
    set(value: number) {
      uniforms.uWear.value = value <= 0 ? 0 : value >= 1 ? 1 : value;
    },
    get: () => uniforms.uWear.value,
  };
}
