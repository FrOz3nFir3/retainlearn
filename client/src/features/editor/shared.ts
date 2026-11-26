// What the editor's tabs and dialogs share: who's editing, the words for saving, and small text helpers.
import { textOf } from "#utils/safeHtml.ts";
import { daysAgoInWords } from "#features/report-card/reportCardStats.ts";

// guest: can look, can't save. contributor: signed in, and their changes wait in the review queue. editor: one of the
// set's reviewers (its author is one), whose changes apply at once.
export type Access = "guest" | "contributor" | "editor";
export const SAVE_LABEL = { editor: "Save", contributor: "Suggest change" } as const;

// A message after an action, shown above the tab's content until it's dismissed or the next one replaces it.
export type Notice = { text: string; tone: "mint" | "bell" | "rose" };
export const savedNotice = (suggested: boolean, done: string, suggestedText: string): Notice =>
  suggested ? { text: `${suggestedText} It's waiting in the review queue.`, tone: "bell" } : { text: done, tone: "mint" };

export const plural = (n: number, word: string, many = `${word}s`): string => `${n} ${n === 1 ? word : many}`;
export const clip = (text: string, n: number): string => (text.length > n ? `${text.slice(0, n - 1).trimEnd()}…` : text);

// TipTap leaves "<p></p>" behind when a field is cleared, so emptiness is about the text, not the markup.
export const isBlank = (html: string): boolean => !textOf(html);
export const sameText = (a: string, b: string): boolean => textOf(a).toLocaleLowerCase() === textOf(b).toLocaleLowerCase();

export const daysAgo = (iso: string): string => daysAgoInWords(Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 864e5)));
