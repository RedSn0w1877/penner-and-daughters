// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Ana's text thread (spec §11.3). Pure: no hooks, so the server renders it for no-JS and the
 * client stages re-render it with props.
 *
 *   phone  the CSS phone (300 × 600, ink bezel) on the pinned desktop stage: texts arrive with the
 *          scroll, the newest at the bottom, with the unread badge (Notification badge recipe)
 *   stack  every text, stacked, for touch, lite and no-JS
 *
 * Shop bubbles are paper-shade; a blue pen tick lands on a text whose line you approved (blue is
 * always you). Photos are links to the image itself, so they open without JS; with JS they open
 * the lightbox instead.
 */
import { Play } from "lucide-react";
import type { MouseEvent } from "react";
import { PenTick } from "@/components/ui/pen-tick";
import { THREAD, type ItemId, type ThreadMedia, type ThreadMessage } from "@/data/inspection";
import { ThreadScroll } from "@/components/ui/thread-scroll";
import { CLIPS, MEDIA_LABEL, PHOTOS, clipRendition, posterSrcSet } from "@/data/media";
import { cx } from "@/lib/cx";

export interface PhoneThreadProps {
  variant: "phone" | "stack";
  /** phone: how many texts have arrived (default: all). */
  arrived?: number;
  /** The text about the item on the stage gets a thin ink ring. */
  activeItem?: ItemId | null;
  /** Lines you approved: their texts get a blue tick. */
  approved?: Partial<Record<ItemId, boolean>>;
  /** Unread count on the phone header (0 hides it). */
  badge?: number;
  /** Phone height: px, or any CSS length (it shrinks on short screens). */
  height?: number | string;
  /** Client only: open a photo or the video in the lightbox. */
  onOpen?: (media: ThreadMedia, opener: HTMLElement) => void;
  className?: string;
}

function MediaTile({ media, onOpen }: { media: ThreadMedia; onOpen?: PhoneThreadProps["onOpen"] }) {
  const open = onOpen
    ? (e: MouseEvent<HTMLAnchorElement>) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        onOpen(media, e.currentTarget);
      }
    : undefined;

  if (media.kind === "video") {
    const r = clipRendition(media.clip, "print");
    const clip = CLIPS[media.clip];
    return (
      <span className="mb-2 block">
        <a
          href={r.sources[r.sources.length - 1].src}
          onClick={open}
          data-thread-media={media.photo}
          className="group relative block overflow-hidden rounded-[10px] bg-counter-deep"
          style={{ aspectRatio: `${r.poster.width} / ${r.poster.height}` }}
        >
          <picture>
            {/* The tile is ~208 px wide on the desktop phone, ~290 in the stacked thread. */}
            <source type="image/avif" srcSet={posterSrcSet(r.poster, "avif")} sizes="(min-width: 1024px) 210px, 300px" />
            <img
              src={r.poster.webp}
              srcSet={posterSrcSet(r.poster, "webp")}
              sizes="(min-width: 1024px) 210px, 300px"
              alt={clip.alt}
              width={r.poster.width}
              height={r.poster.height}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 size-full object-cover"
            />
          </picture>
          <span aria-hidden="true" className="absolute inset-0 grid place-items-center">
            <span className="grid size-10 place-items-center rounded-full bg-ink/80 text-paper transition-transform duration-200 group-hover:-translate-y-px">
              <Play size={18} strokeWidth={2.4} className="translate-x-px" />
            </span>
          </span>
        </a>
        <span className="mt-1.5 block font-mono text-[12px] text-graphite">
          {media.caption} · <span className="whitespace-nowrap">{MEDIA_LABEL.ai}</span>
        </span>
      </span>
    );
  }

  const photo = PHOTOS[media.photo];
  return (
    <a
      href={photo.webp}
      onClick={open}
      data-thread-media={media.photo}
      className="mb-2 block overflow-hidden rounded-[10px] bg-counter-deep"
      style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
    >
      <picture>
        <source type="image/avif" srcSet={`${photo.small?.avif ?? photo.avif} 480w, ${photo.avif} 960w`} sizes="(min-width: 1024px) 210px, 300px" />
        <img
          src={photo.small?.webp ?? photo.webp}
          srcSet={`${photo.small?.webp ?? photo.webp} 480w, ${photo.webp} 960w`}
          sizes="(min-width: 1024px) 210px, 300px"
          alt={photo.alt}
          width={photo.small?.width ?? photo.width}
          height={photo.small?.height ?? photo.height}
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      </picture>
    </a>
  );
}

function Message({
  message,
  showTime,
  active,
  approved,
  animate,
  pending = false,
  onOpen,
}: {
  message: ThreadMessage;
  showTime: boolean;
  active: boolean;
  approved: boolean;
  animate: boolean;
  /** Not arrived yet: laid out (so arriving moves nothing) but invisible, so unread and unreachable. */
  pending?: boolean;
  onOpen?: PhoneThreadProps["onOpen"];
}) {
  return (
    <li className={cx("flex flex-col items-start", pending && "invisible", animate && "animate-[pd-msg-in_340ms_var(--ease-slip)_both]")}>
      <p className={cx("w-full text-center font-mono text-[12px] text-graphite", showTime ? "mb-1.5" : "sr-only")}>{message.time}</p>
      <div className="relative max-w-[90%]">
        <div
          className={cx(
            "rounded-[16px] rounded-bl-[5px] bg-paper-shade px-3 py-2.5 text-[15px] leading-[1.4] text-ink transition-shadow duration-200",
            active && "shadow-[0_0_0_1.5px_var(--ink)]",
          )}
        >
          {message.media && <MediaTile media={message.media} onOpen={onOpen} />}
          <p>{message.text}</p>
        </div>
        {approved && (
          <span className="absolute -right-2 -bottom-2 grid size-7 place-items-center rounded-full bg-paper shadow-[0_1px_2px_rgb(18_20_23/0.25)]">
            <PenTick size={18} />
          </span>
        )}
      </div>
    </li>
  );
}

export function PhoneThread({
  variant,
  arrived,
  activeItem = null,
  approved = {},
  badge = 0,
  height = 600,
  onOpen,
  className,
}: PhoneThreadProps) {
  const messages = THREAD.messages;
  const count = variant === "phone" ? Math.max(1, Math.min(messages.length, arrived ?? messages.length)) : messages.length;
  // Every text is laid out; on the phone the ones past `count` wait, invisible (ThreadScroll).
  const shown = messages;

  const header = (
    <div className="relative border-b border-rule bg-paper-shade px-4 pb-2.5 pt-2.5 text-center">
      {variant === "phone" && <span aria-hidden="true" className="mx-auto mb-2 block h-[5px] w-12 rounded-full bg-ink/80" />}
      <p className="text-[15px] font-bold leading-tight text-ink">{THREAD.from}</p>
      <p className="mt-0.5 text-[12.5px] leading-tight text-graphite">{THREAD.header}</p>
      {variant === "phone" && badge > 0 && (
        <span
          key={badge}
          aria-hidden="true"
          className="absolute right-3 top-3 grid h-6 min-w-6 place-items-center rounded-full bg-ink px-1.5 font-mono text-[12px] font-bold text-paper animate-[pd-badge-in_260ms_var(--ease-slip)_both]"
        >
          {badge}
        </span>
      )}
    </div>
  );

  const ol = (
    <ol
      aria-label={THREAD.header}
      className={cx("flex flex-col gap-3 px-3 pt-3", variant === "phone" ? "pb-4" : "pb-5")}
    >
      {shown.map((m, i) => (
        <Message
          key={m.id}
          message={m}
          showTime={i === 0 || shown[i - 1].time !== m.time}
          active={variant === "phone" && !!m.item && m.item === activeItem}
          approved={!!m.item && !!approved[m.item]}
          pending={i >= count}
          animate={variant === "phone" && i > 0 && i < count}
          onOpen={onOpen}
        />
      ))}
    </ol>
  );
  // On the phone the thread reads from the top while it's short, and once it overflows the newest
  // text stays in view: ThreadScroll slides the list up (a transform, so nothing shifts in layout).
  const list = variant === "phone" ? <ThreadScroll shown={count}>{ol}</ThreadScroll> : ol;

  if (variant === "stack") {
    // Phones, tablets and the lite tier show the thread as a plain stack, so say plainly that it's
    // an example of the texts a customer gets (the desktop CSS phone sits under the section's lead).
    return (
      <div className={className}>
        <p className="type-label mb-2 text-center">{THREAD.example}</p>
        <section aria-label={THREAD.from} className="overflow-hidden rounded-[20px] border border-rule bg-paper shadow-paper">
          {header}
          {list}
        </section>
      </div>
    );
  }

  return (
    <section aria-label={THREAD.from} className={cx("relative mx-auto w-full max-w-[300px]", className)} style={{ height }}>
      <div className="absolute inset-0 rounded-[28px] bg-ink p-[9px] shadow-paper">
        <div className="flex h-full flex-col overflow-hidden rounded-[20px] bg-paper">
          {header}
          {list}
        </div>
      </div>
    </section>
  );
}
