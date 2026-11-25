// Saving a class's answers as you go (PLAN 14.10): a few at a time, so leaving halfway loses almost nothing, and the
// class carries on from another device. Plain TypeScript with the sending passed in, so its rules are tested without
// a browser or a server (classSaver.test.ts). useClassSaver.ts connects it to the API and to the page being hidden.
// - Answers go in batches of BATCH, each numbered (seq) within the class's sitting (classKey), one request at a time,
//   in order. A batch that fails for the network or the server is sent again after a pause: the server saves a
//   numbered batch once, so sending it twice is safe. A batch the server turns away (4xx) isn't retried.
// - One answer is always held back until the class ends, so its last batch, marked finished, is never empty (the API
//   needs at least one answer in a batch).
// - When the page is hidden (another tab, the phone locked, the tab closed), what's waiting is sent at once, without
//   waiting for an earlier batch still on its way (the server takes batches in any order), with keepalive so the
//   browser finishes the request even if the page goes. Leaving the class for another page sends all of it.
import type { SaveAnswersBody, SavedAnswers } from "@retainlearn/core";

export type GivenAnswer = SaveAnswersBody["answers"][number];
type Resume = NonNullable<SaveAnswersBody["resume"]>;
export type Send = (batch: SaveAnswersBody, keepalive: boolean) => Promise<SavedAnswers>;
// An error the send turns away for good (a 4xx), as opposed to one worth trying again.
export class Refused extends Error {}

export const BATCH = 5;
const RETRY_AFTER_MS = [1_000, 3_000, 10_000];

// afterSeq: a class left halfway and carried on keeps its sitting's key, and its batches number on from the last one
// saved (progress.classInProgress.seq), since the server saves each number once.
type Options = { batch?: number; retryAfterMs?: readonly number[]; wait?: (ms: number) => Promise<void>; afterSeq?: number };

export class ClassSaver {
  private pending: GivenAnswer[] = [];
  private seq = 0;
  private resume: Resume | undefined;
  private chain: Promise<unknown> = Promise.resolve();
  private readonly send: Send;
  private readonly sitting: Pick<SaveAnswersBody, "classKey" | "mode" | "timeZone">;
  private readonly batch: number;
  private readonly retryAfterMs: readonly number[];
  private readonly wait: (ms: number) => Promise<void>;
  // Called with each batch the server saved, for showing XP as it comes, and with each failure given up on.
  onSaved: (result: SavedAnswers) => void = () => {};
  onFailed: (error: unknown) => void = () => {};

  constructor(send: Send, sitting: Pick<SaveAnswersBody, "classKey" | "mode" | "timeZone">, options: Options = {}) {
    this.send = send;
    this.sitting = sitting;
    this.batch = options.batch ?? BATCH;
    this.seq = options.afterSeq ?? 0;
    this.retryAfterMs = options.retryAfterMs ?? RETRY_AFTER_MS;
    this.wait = options.wait ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  }

  // An answer given. resume: where the class now stands, so it can carry on elsewhere.
  record(answer: GivenAnswer, resume?: Resume): void {
    this.pending.push(answer);
    if (resume) this.resume = resume;
    if (this.pending.length > this.batch) this.queue(this.take(this.batch), false);
  }

  // The class is over: everything waiting goes, marked finished. Resolves with the server's reply to that last batch
  // (the streak, the timetable), or null when there was nothing to save.
  finish(): Promise<SavedAnswers | null> {
    if (!this.pending.length) return this.chain.then(() => null);
    return this.queue(this.take(this.pending.length), true);
  }

  // The page is being hidden: send what's waiting now, all but the held-back answer, without waiting in line.
  flushNow(): void {
    if (this.pending.length > 1) this.sendLoose(this.take(this.pending.length - 1));
  }

  // You've left the class halfway, for another page in the app: everything waiting goes now, the held-back answer too
  // (no finished batch will follow), with keepalive in case the page goes next. Resolves once every batch sent so far
  // has been answered (or given up on), so the page you're on can read your progress with them in it.
  leave(): Promise<void> {
    if (this.pending.length) this.sendLoose(this.take(this.pending.length));
    return Promise.all([this.chain, ...this.loose]).then(() => undefined);
  }

  // Batches sent at once, out of line (the server takes batches in any order), and kept track of until answered.
  private loose = new Set<Promise<unknown>>();
  private sendLoose(answers: GivenAnswer[]): void {
    const sent: Promise<unknown> = this.deliver(answers, false, true)
      .catch(() => {})
      .finally(() => this.loose.delete(sent));
    this.loose.add(sent);
  }

  private take(n: number): GivenAnswer[] {
    return this.pending.splice(0, n);
  }

  private queue(answers: GivenAnswer[], finished: boolean): Promise<SavedAnswers | null> {
    const run = this.chain.then(() => this.deliver(answers, finished, false));
    this.chain = run.catch(() => {});
    return run;
  }

  private async deliver(answers: GivenAnswer[], finished: boolean, keepalive: boolean): Promise<SavedAnswers | null> {
    const body: SaveAnswersBody = { ...this.sitting, seq: ++this.seq, answers, finished, ...(this.resume ? { resume: this.resume } : {}) };
    for (let attempt = 0; ; attempt++) {
      try {
        const result = await this.send(body, keepalive);
        this.onSaved(result);
        return result;
      } catch (error) {
        const pause = this.retryAfterMs[attempt];
        if (error instanceof Refused || pause === undefined) {
          this.onFailed(error);
          throw error;
        }
        await this.wait(pause);
      }
    }
  }
}

// A new sitting's key: the kind of class, its round, and when it started, so it's unique to this sitting.
export const newClassKey = (mode: string, round: number | string, now = Date.now()): string => `${mode}:${round}:${now.toString(36)}`;
