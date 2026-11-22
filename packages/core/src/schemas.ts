// Zod schemas shared by the server, which checks every request with them, and the client, which can check forms with
// them. Their types are inferred from them (z.infer), never written twice (PLAN 14.15). `z` is exported from here so
// both sides build their schemas on this one copy of Zod.
import { z } from "zod";
import { isTimeZone } from "./days.ts";

export { z };

// A MongoDB id as it travels in a URL or JSON: 24 hexadecimal digits.
export const ObjectIdHex = z.string().regex(/^[0-9a-f]{24}$/i, "must be an id");

// A time zone this machine knows, as the browser names it ("Asia/Kolkata").
export const TimeZone = z.string().refine(isTimeZone, "must be a time zone");
