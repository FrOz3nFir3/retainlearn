// Zod schemas shared by the server, which checks every request with them, and the client, which can check forms with
// them. Their types are inferred from them (z.infer), never written twice (PLAN 14.15). `z` is exported from here so
// both sides build their schemas on this one copy of Zod.
import { z } from "zod";
import { isTimeZone } from "./days.ts";

// Parsing without compiling code as it runs: the site's CSP forbids eval, and Zod's check for it (new Function) is
// reported as a violation each time, though Zod falls back. Set here, before any schema is made, for both sides.
z.config({ jitless: true });

export { z };

// A MongoDB id as it travels in a URL or JSON: 24 hexadecimal digits, given back in lower case (as ids are stored).
export const ObjectIdHex = z
  .string()
  .regex(/^[0-9a-f]{24}$/i, "must be an id")
  .transform((id) => id.toLowerCase());

// A time zone this machine knows, as the browser names it ("Asia/Kolkata").
export const TimeZone = z.string().refine(isTimeZone, "must be a time zone");

// A subject's name as study sets keep it in their category: spaces tidied and each word capitalised, so "web  dev"
// and "Web Dev" are one subject. The rule every set's category was saved with, now shared.
export const subjectName = (text: string): string =>
  text
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

// A subject's name as it's typed or comes in a link: up to 40 characters, none of them / ? # % or \ (they break the
// subject's link), given back as it's kept (subjectName). Every subject already saved fits (checked 2026-11-25).
export const SUBJECT_NAME_MAX = 40;
export const SubjectName = z
  .string()
  .trim()
  .min(1, "Give the subject a name.")
  .max(SUBJECT_NAME_MAX, `Keep it to ${SUBJECT_NAME_MAX} characters.`)
  .regex(/^[^/?#%\\]+$/, "Leave out / ? # % and \\ (they break the subject's link).")
  .transform(subjectName);
