// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * A one-event iCalendar file (RFC 5545) for the demo booking. It's built in the browser and
 * handed over as a Blob download, so "Add to calendar" makes no network request and puts
 * nothing in the URL. Every event is titled DEMO and says plainly that nothing was booked.
 */
import { STUDIO } from "./copyright";
import { SHOP } from "./facts";

export const ICS_FILENAME = "penner-and-daughters-demo-booking.ics";

/** How long the calendar event runs. */
export const ICS_MINUTES = 60;

export const ICS_TEXT = {
  summary: `DEMO · ${SHOP.name} appointment`,
  description: `Demo booking from an ${STUDIO} portfolio sample. ${SHOP.shortName} is a fictional shop; nothing was booked.`,
  location: `${SHOP.address} (fictional)`,
} as const;

export interface IcsEvent {
  start: Date;
  minutes?: number;
  /** When the file is made (DTSTAMP). */
  stamp?: Date;
  /** Stable id for the event; defaults to one derived from the start and stamp times. */
  uid?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** 20261103T143000Z */
function utc(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

/** TEXT values escape backslash, semicolon, comma and newlines. */
function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/**
 * Content lines are folded at 75 octets (UTF-8 bytes, not characters: "·" is two), continuing on
 * the next line after CRLF + one space.
 */
function fold(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    // The first line holds 75 octets; continuation lines spend one on the leading space.
    const limit = parts.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      parts.push(current);
      current = "";
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

/** The .ics text for one demo appointment. */
export function buildIcs({ start, minutes = ICS_MINUTES, stamp = new Date(), uid }: IcsEvent): string {
  const end = new Date(start.getTime() + minutes * 60_000);
  const id = uid ?? `demo-${start.getTime().toString(36)}-${stamp.getTime().toString(36)}`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${STUDIO}//${SHOP.shortName} portfolio sample//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    // .invalid is reserved for names that must never resolve: there is no real shop behind this.
    `UID:${id}@penner-and-daughters.invalid`,
    `DTSTAMP:${utc(stamp)}`,
    `DTSTART:${utc(start)}`,
    `DTEND:${utc(end)}`,
    `SUMMARY:${escapeText(ICS_TEXT.summary)}`,
    `DESCRIPTION:${escapeText(ICS_TEXT.description)}`,
    `LOCATION:${escapeText(ICS_TEXT.location)}`,
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.map(fold).join("\r\n")}\r\n`;
}

/**
 * Save the .ics through a temporary object URL (a blob: URL is in-memory, never a request).
 * Client only.
 */
export function downloadIcs(event: IcsEvent): void {
  const blob = new Blob([buildIcs(event)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = ICS_FILENAME;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before the URL goes away.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
