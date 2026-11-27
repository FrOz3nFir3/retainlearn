// The "why" behind a quiz question (the prototype's data/match.js): which flashcard teaches it, and which part of that
// flashcard answers it, so "Why?" shows a few lines rather than a long answer whole. A question linked to a flashcard
// uses it; one linked to none gets the closest flashcard, as a guess, when one comes close enough. Plain TF-IDF
// cosine over words and code identifiers: no index, no dependencies.
// Measured in the prototype on the real Programming questions (146 linked by their author): the author's flashcard
// was the closest 60% of the time and in the closest 3 89% of the time, so a guess is labelled as one.
// Splitting an answer into parts reads its HTML, which needs a browser (DOMParser): elsewhere an answer is one part.
import { textOf } from "#utils/safeHtml.ts";

type Flashcard = { _id: string; question: string; answer: string };
type Question = { question: string; answer: string; wrongAnswers: readonly string[]; flashcardId?: string | null };

const STOP = new Set(
  "the and for are was were that this with from into what which when will would should could does did has have had not but you your its it's they them their there then than can how why who use used using each also only just like more most some such very other about after before because between both during following given here many must same these those through under until while where whether being been value values code".split(
    " ",
  ),
);
// Words and identifiers, camelCase parts too ("getPrototypeOf" also counts as "prototype"), plurals folded.
export function terms(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.match(/[A-Za-z_$][A-Za-z0-9_$]*/g) ?? []) {
    const parts = raw.length > 3 ? raw.split(/(?<=[a-z])(?=[A-Z])|_/).filter(Boolean) : [];
    for (const w of new Set([raw, ...(parts.length > 1 ? parts : [])])) {
      let t = w.toLowerCase();
      if (t.length > 4 && t.endsWith("s") && !t.endsWith("ss")) t = t.slice(0, -1);
      if (t.length > 2 && !STOP.has(t)) out.push(t);
    }
  }
  return out;
}

type Weighted = [tokens: string[], weight: number][];
type Stats = { idf: Map<string, number>; unseen: number };
type Vector = { v: Map<string, number>; norm: number };

// Prose and code counted separately: the names in a code sample say less about the topic.
const CODE = /<pre[\s\S]*?<\/pre>/gi;
const weighted = (html: string, prose: number, code: number): Weighted => [
  [terms(textOf(html.replace(CODE, " "))), prose],
  [terms(textOf([...html.matchAll(CODE)].map((m) => m[0]).join(" "))), code],
];

function idfOf(docs: string[][]): Stats {
  const df = new Map<string, number>();
  for (const d of docs) for (const t of new Set(d)) df.set(t, (df.get(t) ?? 0) + 1);
  const n = docs.length;
  return { idf: new Map([...df].map(([t, k]) => [t, Math.log((n + 1) / (k + 1)) + 1])), unseen: Math.log(n + 1) + 1 };
}

function vectorize(parts: Weighted, { idf, unseen }: Stats): Vector {
  const tf = new Map<string, number>();
  for (const [tokens, weight] of parts) for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + weight);
  const v = new Map<string, number>();
  let norm = 0;
  for (const [t, n] of tf) {
    const w = Math.sqrt(n) * (idf.get(t) ?? unseen);
    v.set(t, w);
    norm += w * w;
  }
  return { v, norm: Math.sqrt(norm) };
}

function cosine(a: Vector, b: Vector): number {
  if (!a.norm || !b.norm) return 0;
  const [small, big] = a.v.size < b.v.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [t, w] of small.v) dot += w * (big.v.get(t) ?? 0);
  return dot / (a.norm * b.norm);
}

const questionParts = (q: Question, optionWeight: number): Weighted => [
  ...weighted(q.question, 1, 0.4),
  ...weighted(q.answer, 1, 0.4),
  ...(optionWeight ? q.wrongAnswers.flatMap((o) => weighted(o, optionWeight, optionWeight * 0.4)) : []),
];

// One corpus per list of flashcards (a set's content is a new object after any change, so this stays honest).
const corpora = new WeakMap<readonly Flashcard[], { stats: Stats; vectors: Vector[] }>();
function corpus(flashcards: readonly Flashcard[]) {
  let c = corpora.get(flashcards);
  if (!c) {
    const docs = flashcards.map((f) => [...weighted(f.question, 2, 0.67), ...weighted(f.answer, 1, 1)]);
    const stats = idfOf(docs.map((parts) => parts.flatMap(([tokens]) => tokens)));
    c = { stats, vectors: docs.map((parts) => vectorize(parts, stats)) };
    corpora.set(flashcards, c);
  }
  return c;
}

// Below this, no flashcard really covers the question (or it's mostly code): no guess.
export const WEAK_MATCH = 0.08;

// The flashcards most likely to teach a question, best first.
export function closestFlashcards(question: Question, flashcards: readonly Flashcard[], limit = 3): { index: number; score: number }[] {
  if (!flashcards.length) return [];
  const { stats, vectors } = corpus(flashcards);
  const q = vectorize(questionParts(question, 0.5), stats);
  return vectors
    .map((v, index) => ({ index, score: cosine(q, v) }))
    .filter((r) => r.score >= 0.03)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

const parser = typeof DOMParser === "undefined" ? null : new DOMParser();
const clean = (s: string) => s.replace(/\s+/g, " ").trim();
// A paragraph that's all (or nearly all) bold, and short: a part's title.
const isTitle = (el: Element) => {
  if (el.tagName !== "P") return false;
  const text = clean(el.textContent ?? "");
  const bold = clean([...el.querySelectorAll("strong, b")].map((s) => s.textContent ?? "").join(" "));
  return text.length >= 3 && text.length <= 90 && bold.length >= text.length * 0.8;
};

export type Passage = { title: string | null; html: string };
// An answer in parts: its bold-titled sections, or else paragraphs, each keeping the code block or list after it.
export function passages(answerHtml: string): Passage[] {
  if (!parser) return [{ title: null, html: answerHtml }];
  const blocks = [...parser.parseFromString(answerHtml, "text/html").body.children];
  const sections: Passage[] = [];
  for (const el of blocks) {
    const last = sections.at(-1);
    if (isTitle(el)) sections.push({ title: clean(el.textContent ?? "").replace(/[:.]$/, ""), html: "" });
    else if (last) last.html += el.outerHTML;
  }
  if (sections.filter((s) => s.html).length >= 2) {
    const intro = blocks
      .slice(0, blocks.findIndex(isTitle))
      .map((el) => el.outerHTML)
      .join("");
    return [...(intro ? [{ title: null, html: intro }] : []), ...sections.filter((s) => s.html)];
  }
  const out: (Passage & { attached: boolean })[] = [];
  for (const el of blocks) {
    const last = out.at(-1);
    if (["PRE", "UL", "OL", "DIV"].includes(el.tagName) && last && !last.attached) Object.assign(last, { html: last.html + el.outerHTML, attached: true });
    else out.push({ title: null, html: el.outerHTML, attached: false });
  }
  return out.map(({ title, html }) => ({ title, html }));
}

export const SHORT_ANSWER = 520; // characters of text: shown whole

// The part of a flashcard that answers a question. partial: there's more to read.
export function whyPassage(question: Question, flashcard: Flashcard): Passage & { partial: boolean } {
  const whole = { title: null, html: flashcard.answer, partial: false };
  if (textOf(flashcard.answer).length <= SHORT_ANSWER) return whole;
  const parts = passages(flashcard.answer);
  if (parts.length < 2) return whole;
  // A part's bold title names its topic, so its words count three times.
  const docs: Weighted[] = parts.map((p) => [[terms(p.title ?? ""), 3], ...weighted(p.html, 1, 0.6)]);
  const stats = idfOf(docs.map((d) => d.flatMap(([tokens]) => tokens)));
  const q = vectorize(questionParts(question, 0), stats);
  const best = docs.map((d, i) => ({ i, score: cosine(q, vectorize(d, stats)) })).sort((a, b) => b.score - a.score)[0];
  const part = best && best.score ? parts[best.i] : undefined;
  return part ? { ...part, partial: true } : whole;
}

// Where a question's why comes from: its linked flashcard, or the closest one as a guess (null when none is close).
export type WhySource = { index: number; flashcard: Flashcard; guess: boolean; passage: Passage & { partial: boolean } };
export function whySource(question: Question, flashcards: readonly Flashcard[]): WhySource | null {
  const linked = question.flashcardId ? flashcards.findIndex((f) => f._id === question.flashcardId) : -1;
  const guess = linked < 0 ? closestFlashcards(question, flashcards, 1)[0] : undefined;
  const index = linked >= 0 ? linked : guess && guess.score >= WEAK_MATCH ? guess.index : -1;
  const flashcard = flashcards[index];
  return flashcard ? { index, flashcard, guess: linked < 0, passage: whyPassage(question, flashcard) } : null;
}
