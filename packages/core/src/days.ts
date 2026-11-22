// Days as the player lives them (PLAN 14.3b). A day is the player's local day, kept as a "YYYY-MM-DD" key, and it
// turns over at midnight where they are. Counted in UTC, as the prototype did, India's day would turn over at 5:30 in
// the morning. The time zone is the browser's (Intl.DateTimeFormat().resolvedOptions().timeZone), saved in
// players.settings.timeZone once isTimeZone has checked it.
import type { DateLike, Day, When } from "./types.ts";

const DAY_MS = 24 * 60 * 60 * 1000;
const formats = new Map<string, Intl.DateTimeFormat>(); // time zone -> its format, since making one is slow

function formatFor(timeZone: string): Intl.DateTimeFormat {
  let format = formats.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
    if (formats.size >= 500) formats.clear(); // a ceiling, not a cache policy: there are about 600 time zones
    formats.set(timeZone, format);
  }
  return format;
}

// Whether a time zone is one this machine knows ("Asia/Kolkata", "UTC"). Anything else, including anything that
// isn't a short string, is refused, so a bad value never reaches the database.
export function isTimeZone(timeZone: unknown): timeZone is string {
  if (typeof timeZone !== "string" || timeZone.length === 0 || timeZone.length > 64) return false;
  try {
    formatFor(timeZone);
    return true;
  } catch {
    return false;
  }
}

// The day a moment falls on where the player is: dayKey("2026-11-20T18:30:00Z", "Asia/Kolkata") is "2026-11-21",
// since it's midnight there. Throws on an invalid date, or a time zone this machine doesn't know.
export function dayKey(date: DateLike, timeZone = "UTC"): Day {
  const parts = formatFor(timeZone).formatToParts(new Date(date));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function utcMidnight(day: Day): number {
  const [year = NaN, month = NaN, date = NaN] = day.split("-").map(Number);
  return Date.UTC(year, month - 1, date);
}

// Whole days from one day to another: daysBetween("2026-11-20", "2026-11-23") is 3, and -3 the other way round.
// Counted on the calendar, so a change to or from daylight saving never makes a day 23 or 25 hours long.
export const daysBetween = (from: Day, to: Day): number => Math.round((utcMidnight(to) - utcMidnight(from)) / DAY_MS);

// Days since a moment, counted from the day it fell on where the player is.
export const daysSince = (date: DateLike, { today, timeZone = "UTC" }: When): number => daysBetween(dayKey(date, timeZone), today);
