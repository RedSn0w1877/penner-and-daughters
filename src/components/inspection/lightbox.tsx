"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * The photo lightbox (spec §11.3, Modal recipe): a photo from Ana's texts opens large on a white
 * print over a dimmed counter (no blur), with "Close". The pad-gauge video plays inside it. Open
 * scales and fades in over 240 ms; close is quicker (150 ms). Focus moves to Close, Tab stays
 * inside, Escape closes, focus returns to the photo you opened, and page scrolling is locked
 * while it's up (Lenis included).
 */
import { X } from "lucide-react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { lockScroll, unlockScroll } from "@/components/providers/smooth-scroll";
import { FilmClip } from "@/components/ui/film-clip";
import { LABELS } from "@/data/copy";
import type { ThreadMedia } from "@/data/inspection";
import { PHOTOS } from "@/data/media";

interface LightboxState {
  media: ThreadMedia;
  opener: HTMLElement | null;
  closing: boolean;
}

const CLOSE_MS = 150;
let state: LightboxState | null = null;
let closeTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Open a photo (or the pad-gauge video) from the thread. */
export function openLightbox(media: ThreadMedia, opener: HTMLElement | null = null) {
  clearTimeout(closeTimer);
  state = { media, opener, closing: false };
  emit();
}

function closeLightbox() {
  if (!state || state.closing) return;
  const opener = state.opener;
  state = { ...state, closing: true };
  emit();
  closeTimer = setTimeout(() => {
    state = null;
    emit();
    opener?.focus({ preventScroll: true });
  }, CLOSE_MS);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function Lightbox() {
  const s = useSyncExternalStore(subscribe, () => state, () => null);
  const isOpen = !!s;
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    lockScroll("lightbox");
    const focusTimer = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 20);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusables = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>("button, [href], [tabindex]:not([tabindex='-1'])"),
      ).filter((el) => !el.hasAttribute("disabled"));
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKey);
      unlockScroll("lightbox");
    };
  }, [isOpen]);

  if (!s) return null;
  const { media, closing } = s;
  const photo = PHOTOS[media.photo];
  const label = media.kind === "video" ? media.caption : photo.alt;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] grid place-items-center p-4 sm:p-8"
      data-motion-ok=""
      style={{ animation: closing ? `pd-fade-in ${CLOSE_MS}ms ease-in reverse both` : "pd-fade-in 240ms ease-out both" }}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-ink/75" onClick={closeLightbox} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="relative w-full max-w-[min(960px,calc((100svh-9rem)*4/3))]"
        style={{ animation: closing ? `pd-modal-in ${CLOSE_MS}ms ease-in reverse both` : "pd-modal-in 240ms var(--ease-slip) both" }}
      >
        <div className="bg-white p-3 pb-0 shadow-lift">
          {media.kind === "video" ? (
            <FilmClip id={media.clip} variant="print" active={!closing} />
          ) : (
            <picture>
              <source type="image/avif" srcSet={photo.avif} />
              <img src={photo.webp} alt={photo.alt} width={photo.width} height={photo.height} className="block h-auto w-full" />
            </picture>
          )}
          <div className="flex items-center justify-between gap-4 py-2.5">
            <p className="font-mono text-[12.5px] leading-snug text-imprint">{media.kind === "video" ? media.caption : null}</p>
            <button ref={closeRef} type="button" onClick={closeLightbox} className="btn btn-ink" data-size="sm">
              <X aria-hidden="true" size={18} strokeWidth={2.4} />
              <span>{LABELS.close}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
