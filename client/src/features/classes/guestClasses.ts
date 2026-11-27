// A guest's classes, kept on this device until they sign in or sign up: what makes "Sign in to keep this" true. The
// class saver (useClassSaver.ts) hands a guest's batches here instead of to the server, exactly as it would have sent
// them. Once there's an account they're sent to it, in order, as if the guest had been signed in all along: a finished
// class counts as finished (timetable, streak), one left halfway can be carried on. The server saves each numbered
// batch once, so sending one again (after a failure, or from two tabs) changes nothing. Plain TypeScript with the
// sending passed in, so its rules are tested without a browser (guestClasses.test.ts).
// A try-out, not storage: a day at most, and the last few sittings.
import type { SaveAnswersBody } from "@retainlearn/core";
import { Refused } from "./classSaver.ts";

const KEY = "retainlearn:guest-classes";
export const KEEP_MS = 24 * 60 * 60 * 1000;
export const MAX_SITTINGS = 10;

// One sitting of a class: its set, when it last changed, and its batches (each names the sitting: classKey).
export type KeptSitting = { setId: string; at: number; batches: SaveAnswersBody[] };

const isSitting = (s: unknown): s is KeptSitting => {
  const k = s as Partial<KeptSitting> | null;
  return typeof k?.setId === "string" && typeof k.at === "number" && Array.isArray(k.batches) && k.batches.length > 0;
};
const sameSitting = (a: KeptSitting, b: KeptSitting) => a.setId === b.setId && a.batches[0]?.classKey === b.batches[0]?.classKey;
// Storage can be blocked or full (private browsing, a setting): then a guest's class just isn't kept.
function read(): KeptSitting[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(value) ? value.filter(isSitting) : [];
  } catch {
    return [];
  }
}
function write(sittings: readonly KeptSitting[]): void {
  try {
    if (sittings.length) localStorage.setItem(KEY, JSON.stringify(sittings));
    else localStorage.removeItem(KEY);
  } catch {
    // Not kept: see read().
  }
}
const current = (sittings: KeptSitting[], now: number) => sittings.filter((s) => now - s.at < KEEP_MS).slice(-MAX_SITTINGS);

// A guest's batch, kept with the rest of its sitting. A batch number already kept isn't kept twice.
export function keepGuestBatch(setId: string, batch: SaveAnswersBody, now = Date.now()): void {
  const sittings = read();
  const sitting = sittings.find((s) => s.setId === setId && s.batches[0]?.classKey === batch.classKey);
  if (!sitting) sittings.push({ setId, at: now, batches: [batch] });
  else {
    if (!sitting.batches.some((b) => b.seq === batch.seq)) sitting.batches.push(batch);
    sitting.at = now;
  }
  write(current(sittings, now));
}

// The guest's classes still kept on this device, oldest first.
export const keptClasses = (now = Date.now()): KeptSitting[] => current(read(), now);

const forget = (sitting: KeptSitting) => write(read().filter((s) => !sameSitting(s, sitting)));

// Sends each kept sitting to the account, its batches in order, and forgets it once they're saved, or once the server
// turns one away for good (Refused: the set is gone or private now, or has changed so an answer no longer fits). A
// failure worth trying again (no connection, the server down) stops the run and keeps the rest. One run at a time: a
// second call while one runs gets the same one. Resolves with the sittings sent.
type Send = (setId: string, batch: SaveAnswersBody) => Promise<unknown>;
let running: Promise<KeptSitting[]> | null = null;
export function sendKept(send: Send, now = Date.now()): Promise<KeptSitting[]> {
  running ??= sendAll(send, now).finally(() => {
    running = null;
  });
  return running;
}
async function sendAll(send: Send, now: number): Promise<KeptSitting[]> {
  const sent: KeptSitting[] = [];
  for (const sitting of keptClasses(now)) {
    try {
      for (const batch of [...sitting.batches].sort((a, b) => a.seq - b.seq)) await send(sitting.setId, batch);
      sent.push(sitting);
    } catch (error) {
      if (!(error instanceof Refused)) break;
    }
    forget(sitting);
  }
  return sent;
}
