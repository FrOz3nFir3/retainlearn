// Small helpers for the new (TypeScript) routes.
import type { NextFunction, Request, Response } from "express";

// The signed-in account's id, on a route behind requireAuthentication (auth.middleware.js puts the token on req).
export const userIdOf = (req: Request): string => (req as Request & { token: { id: string } }).token.id;

// A route that fails unexpectedly still answers in JSON, like every other answer. The error goes to the log, never to
// the client. Added at the end of a router.
export function jsonErrors(error: unknown, req: Request, res: Response, next: NextFunction): void {
  console.error(`${req.method} ${req.originalUrl} failed:`, error);
  if (res.headersSent) return next(error);
  res.status(500).json({ error: "Something went wrong. Please try again." });
}
