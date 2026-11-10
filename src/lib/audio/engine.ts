// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Tap-only Web Audio player for the symptom guide.
 *
 * - Nothing plays without a tap: the AudioContext is created inside the first play() call,
 *   which must come from a click / keypress handler.
 * - One sound at a time; a new play() stops the previous one.
 * - The master gain is capped at 0.2.
 * - If audio can't start (no Web Audio, or the browser keeps the context suspended), the
 *   caller gets `onBlocked(text)` with the caption-only message to show instead.
 * - Hiding the tab stops whatever is playing.
 *
 *   const stop = play("squeal", { onEnd: () => setPlaying(null), onBlocked: setCaption });
 */
import {
  RECIPES,
  SOUND_CAPTIONS,
  SOUND_DURATION,
  blockedCaption,
  clickBurst,
  type SoundId,
  type Voice,
} from "./sounds";

export { SOUND_CAPTIONS, SOUND_DURATION, SOUND_IDS, blockedCaption, type SoundId } from "./sounds";

/** The loudest the page is ever allowed to be. */
export const MAX_GAIN = 0.2;

export interface PlayOptions {
  /** Seconds; defaults to the sound's own 2–3 s. */
  duration?: number;
  /** Hum only: starting road speed. */
  mph?: number;
  onEnd?: () => void;
  /** Called with the caption-only message when audio is unavailable or blocked. */
  onBlocked?: (message: string) => void;
}

type AudioWindow = typeof globalThis & { webkitAudioContext?: typeof AudioContext };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let current: { id: SoundId; voice: Voice; timer: ReturnType<typeof setTimeout>; onEnd?: () => void } | null = null;
let hideBound = false;

/** True when the browser has Web Audio at all. */
export function isAvailable(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as AudioWindow;
  return Boolean(w.AudioContext || w.webkitAudioContext);
}

function context(): AudioContext | null {
  if (!isAvailable()) return null;
  if (!ctx) {
    const w = window as AudioWindow;
    const Ctor = w.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return null;
    let created: AudioContext;
    try {
      created = new Ctor();
    } catch {
      return null;
    }
    const gain = created.createGain();
    gain.gain.value = MAX_GAIN;
    gain.connect(created.destination);
    ctx = created;
    master = gain;
  }
  if (!hideBound) {
    hideBound = true;
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
    });
  }
  return ctx;
}

function finish(endCallback = true) {
  if (!current) return;
  const { voice, timer, onEnd } = current;
  current = null;
  clearTimeout(timer);
  voice.stop();
  if (endCallback) onEnd?.();
}

/** Stop whatever is playing (fires its onEnd). */
export function stop(): void {
  finish(true);
}

/** Play one of the six sounds. Returns a function that stops it. Call from a tap/keypress handler. */
export function play(id: SoundId, opts: PlayOptions = {}): () => void {
  finish(true);
  const c = context();
  if (!c || !master) {
    opts.onBlocked?.(blockedCaption(id));
    opts.onEnd?.();
    return () => {};
  }

  const duration = opts.duration ?? SOUND_DURATION[id];
  const voice = RECIPES[id](c, master, c.currentTime + 0.03, duration, { mph: opts.mph });
  const timer = setTimeout(() => {
    if (current?.voice === voice) finish(true);
  }, duration * 1000 + 120);
  current = { id, voice, timer, onEnd: opts.onEnd };

  if (c.state !== "running") {
    c.resume()
      .then(() => {
        if (c.state !== "running" && current?.voice === voice) {
          finish(false);
          opts.onBlocked?.(blockedCaption(id));
          opts.onEnd?.();
        }
      })
      .catch(() => {
        if (current?.voice === voice) {
          finish(false);
          opts.onBlocked?.(blockedCaption(id));
          opts.onEnd?.();
        }
      });
  }

  return () => {
    if (current?.voice === voice) finish(true);
  };
}

/** The id currently playing, if any. */
export function playing(): SoundId | null {
  return current?.id ?? null;
}

/** Retune the hum while it plays (the speed dial calls this as it moves). */
export function setHumSpeed(mph: number): void {
  if (current?.id === "hum") current.voice.setSpeed?.(mph);
}

/**
 * One CV-joint click, for the draggable steering wheel (it calls this three times per wheel turn).
 * Must follow a tap or drag start, like play().
 */
export function clickOnce(): void {
  const c = context();
  if (!c || !master) return;
  if (c.state !== "running") void c.resume().catch(() => {});
  clickBurst(c, master, c.currentTime + 0.005);
}

export { SOUND_CAPTIONS as CAPTIONS };
