// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The six car noises, synthesized (no audio files): each recipe wires a few Web Audio nodes
 * into `out` and returns a handle to stop them. Levels here are relative; engine.ts caps the
 * master gain at 0.2 so nothing is ever loud.
 */

export type SoundId = "squeal" | "grind" | "click" | "hum" | "clunk" | "chirp";

export const SOUND_IDS: readonly SoundId[] = ["squeal", "grind", "click", "hum", "clunk", "chirp"];

/** Live caption while a sound plays (always shown; the sound is never the only channel). */
export const SOUND_CAPTIONS: Record<SoundId, string> = {
  squeal: "Playing: a high squeal, like a whistle, when braking.",
  grind: "Playing: a low metal-on-metal grind.",
  click: "Playing: click, click, click as the wheel turns.",
  hum: "Playing: a hum that rises with speed.",
  clunk: "Playing: a single dull clunk.",
  chirp: "Playing: a sharp chirp at startup.",
};

/** What the visitor reads when audio can't play on this device. */
export function blockedCaption(id: SoundId): string {
  return `Sound is off on this device. Here's what it sounds like: ${SOUND_CAPTIONS[id].replace(/^Playing: /, "")}`;
}

/** Seconds each sound runs (2–3 s). */
export const SOUND_DURATION: Record<SoundId, number> = {
  squeal: 2.6,
  grind: 2.6,
  click: 2.4,
  hum: 3,
  clunk: 2,
  chirp: 2.2,
};

export interface Voice {
  /** Stop at AudioContext time `when` (default: now), with a short release so it doesn't pop. */
  stop(when?: number): void;
  /** Hum only: follow a new road speed. */
  setSpeed?(mph: number): void;
}

export interface RecipeParams {
  mph?: number;
}

type Recipe = (ctx: AudioContext, out: AudioNode, t0: number, dur: number, params: RecipeParams) => Voice;

const buffers = new WeakMap<AudioContext, { white: AudioBuffer; brown: AudioBuffer }>();

/** Two seconds of white and brown noise, made once per context. */
function noise(ctx: AudioContext) {
  let b = buffers.get(ctx);
  if (b) return b;
  const len = ctx.sampleRate * 2;
  const white = ctx.createBuffer(1, len, ctx.sampleRate);
  const brown = ctx.createBuffer(1, len, ctx.sampleRate);
  const w = white.getChannelData(0);
  const br = brown.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const r = Math.random() * 2 - 1;
    w[i] = r;
    last = (last + 0.02 * r) / 1.02;
    br[i] = last * 3.5;
  }
  b = { white, brown };
  buffers.set(ctx, b);
  return b;
}

/** Attack / hold / release envelope on a gain node. */
function envelope(g: GainNode, t0: number, dur: number, level: number, attack = 0.04, release = 0.18) {
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(level, t0 + attack);
  g.gain.setValueAtTime(level, Math.max(t0 + attack, t0 + dur - release));
  g.gain.linearRampToValueAtTime(0, t0 + dur);
}

function stopper(ctx: AudioContext, gain: GainNode, sources: AudioScheduledSourceNode[]): Voice["stop"] {
  return (when = ctx.currentTime) => {
    gain.gain.cancelScheduledValues(when);
    gain.gain.setValueAtTime(gain.gain.value, when);
    gain.gain.linearRampToValueAtTime(0, when + 0.06);
    sources.forEach((s) => {
      try {
        s.stop(when + 0.08);
      } catch {
        /* already stopped */
      }
    });
  };
}

/** Squeal: two detuned sines near 3.1 / 3.45 kHz with a 6 Hz vibrato. */
const squeal: Recipe = (ctx, out, t0, dur) => {
  const g = ctx.createGain();
  envelope(g, t0, dur, 0.32, 0.08, 0.25);
  g.connect(out);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 6;
  const depth = ctx.createGain();
  depth.gain.value = 28;
  lfo.connect(depth);
  const oscs = [3100, 3450].map((f, i) => {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    depth.connect(o.frequency);
    const og = ctx.createGain();
    og.gain.value = i === 0 ? 0.6 : 0.4;
    o.connect(og).connect(g);
    return o;
  });
  [lfo, ...oscs].forEach((s) => {
    s.start(t0);
    s.stop(t0 + dur + 0.1);
  });
  return { stop: stopper(ctx, g, [lfo, ...oscs]) };
};

/** Grind: brown noise through a 400 Hz band-pass with a 9 Hz wobble, plus a 55 Hz saw. */
const grind: Recipe = (ctx, out, t0, dur) => {
  const g = ctx.createGain();
  envelope(g, t0, dur, 0.9, 0.06, 0.25);
  g.connect(out);

  const src = ctx.createBufferSource();
  src.buffer = noise(ctx).brown;
  src.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 400;
  bp.Q.value = 1.4;
  const wobble = ctx.createGain();
  wobble.gain.value = 0.7;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 9;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 0.3;
  lfo.connect(lfoDepth).connect(wobble.gain);
  src.connect(bp).connect(wobble).connect(g);

  const saw = ctx.createOscillator();
  saw.type = "sawtooth";
  saw.frequency.value = 55;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 320;
  const sawGain = ctx.createGain();
  sawGain.gain.value = 0.22;
  saw.connect(lp).connect(sawGain).connect(g);

  [src, lfo, saw].forEach((s) => {
    s.start(t0);
    s.stop(t0 + dur + 0.1);
  });
  return { stop: stopper(ctx, g, [src, lfo, saw]) };
};

/** One 6 ms noise burst through a high-pass: the CV joint's click. */
export function clickBurst(ctx: AudioContext, out: AudioNode, t: number, level = 0.9): AudioBufferSourceNode {
  const src = ctx.createBufferSource();
  src.buffer = noise(ctx).white;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1600;
  const g = ctx.createGain();
  g.gain.setValueAtTime(level, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.006);
  src.connect(hp).connect(g).connect(out);
  src.start(t, Math.random() * 1.5, 0.008);
  return src;
}

/** Click: bursts at three per wheel turn, about 1.5 turns a second. */
const click: Recipe = (ctx, out, t0, dur) => {
  const g = ctx.createGain();
  g.gain.value = 1;
  g.connect(out);
  const sources: AudioScheduledSourceNode[] = [];
  const interval = 1 / 4.5;
  for (let t = t0 + 0.05; t < t0 + dur - 0.1; t += interval) sources.push(clickBurst(ctx, g, t));
  return { stop: stopper(ctx, g, sources) };
};

const humFreq = (mph: number) => 40 + 2.2 * mph;

/** Hum: a sine at 40 + 2.2 × mph Hz with a slightly detuned partial (the beating is the bearing). */
const hum: Recipe = (ctx, out, t0, dur, params) => {
  const g = ctx.createGain();
  envelope(g, t0, dur, 0.8, 0.25, 0.4);
  g.connect(out);
  const f = humFreq(params.mph ?? 45);
  const base = ctx.createOscillator();
  base.type = "sine";
  base.frequency.value = f;
  const partial = ctx.createOscillator();
  partial.type = "sine";
  partial.frequency.value = f * 2 * 1.006;
  const pg = ctx.createGain();
  pg.gain.value = 0.35;
  base.connect(g);
  partial.connect(pg).connect(g);
  [base, partial].forEach((s) => {
    s.start(t0);
    s.stop(t0 + dur + 0.1);
  });
  return {
    stop: stopper(ctx, g, [base, partial]),
    setSpeed(mph: number) {
      const now = ctx.currentTime;
      const nf = humFreq(mph);
      base.frequency.setTargetAtTime(nf, now, 0.08);
      partial.frequency.setTargetAtTime(nf * 2 * 1.006, now, 0.08);
    },
  };
};

/** Clunk: a 70 → 40 Hz thump and a 900 Hz ping. */
const clunk: Recipe = (ctx, out, t0, dur) => {
  const g = ctx.createGain();
  g.gain.value = 1;
  g.connect(out);
  const t = t0 + 0.05;

  const thump = ctx.createOscillator();
  thump.type = "sine";
  thump.frequency.setValueAtTime(70, t);
  thump.frequency.exponentialRampToValueAtTime(40, t + 0.25);
  const tg = ctx.createGain();
  tg.gain.setValueAtTime(0, t);
  tg.gain.linearRampToValueAtTime(1, t + 0.008);
  tg.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
  thump.connect(tg).connect(g);

  const ping = ctx.createOscillator();
  ping.type = "sine";
  ping.frequency.value = 900;
  const pg = ctx.createGain();
  pg.gain.setValueAtTime(0, t);
  pg.gain.linearRampToValueAtTime(0.18, t + 0.004);
  pg.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
  ping.connect(pg).connect(g);

  [thump, ping].forEach((s) => {
    s.start(t);
    s.stop(Math.min(t0 + dur, t + 0.6));
  });
  return { stop: stopper(ctx, g, [thump, ping]) };
};

/** Chirp: short 2.2 → 2.8 kHz glides, like a belt slipping at startup. */
const chirp: Recipe = (ctx, out, t0, dur) => {
  const g = ctx.createGain();
  g.gain.value = 1;
  g.connect(out);
  const sources: AudioScheduledSourceNode[] = [];
  const starts = [0.1, 0.62, 1.1, 1.5].map((s) => t0 + s).filter((s) => s < t0 + dur - 0.2);
  starts.forEach((s, i) => {
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(2200, s);
    o.frequency.exponentialRampToValueAtTime(2800, s + 0.11);
    const og = ctx.createGain();
    const level = 0.42 - i * 0.07;
    og.gain.setValueAtTime(0, s);
    og.gain.linearRampToValueAtTime(level, s + 0.01);
    og.gain.exponentialRampToValueAtTime(0.001, s + 0.13);
    o.connect(og).connect(g);
    o.start(s);
    o.stop(s + 0.15);
    sources.push(o);
  });
  return { stop: stopper(ctx, g, sources) };
};

export const RECIPES: Record<SoundId, Recipe> = { squeal, grind, click, hum, clunk, chirp };
