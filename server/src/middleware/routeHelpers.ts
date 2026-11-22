// Small helpers for the new (TypeScript) routes.
import type { NextFunction, Request, Response } from "express";

// The signed-in account's id, on a route behind requireAuthentication (auth.middleware.js puts the token on req).
export const userIdOf = (req: Request): string => (req as Request & { token: { id: string } }).token.id;

// A route that fails unexpectedly still answers in JSON, like every other answer. The error goes to the log, never to
// the client. Added at the end of a router. The log line's format is fixed and the URL is passed as a value, so a URL
// holding "%s" or "%d" can't garble it.
export function jsonErrors(error: unknown, req: Request, res: Response, next: NextFunction): void {
  console.error("%s %s failed:", req.method, req.originalUrl, error);
  if (res.headersSent) return next(error);
  res.status(500).json({ error: "Something went wrong. Please try again." });
}
