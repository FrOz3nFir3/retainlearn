// Recall points: a flashcard's answer split into the parts you mark as remembered in a review (PLAN 5.x, the
// prototype's data/points.js). It reads the answer's structure (bold lead-ins, lists, titled parts, code), so it needs
// the browser's DOM, and lives here rather than in packages/core. The answer is parsed into a document that's never
// shown, so nothing in it runs; a point's html is shown later through RichText, which sanitizes it.
// Each point has a key (its part and label), kept in your progress with what you marked, so the same point lines up
// across reviews. The keys match the prototype's, so the editor's later overrides ("rename this prompt", "split this
// list") can be added on top without changing them.

export type RecallPoint = {
  key: string;
  kind: "opening" | "section" | "list" | "item" | "label";
  label: string; // the prompt you recall from
  cue: boolean; // false: the label is only the point's first words, with nothing to prompt it
  html: string; // what to recall, as user HTML
  section: string | null; // the titled part it's in
  items: number;
};

// Fewer points than this, and a flashcard is reviewed whole (packages/core, reviewLoad).
export { MIN_POINTS } from "@retainlearn/core";

const parser = typeof DOMParser === "undefined" ? null : new DOMParser();
const clean = (s: string) => s.replace(/\s+/g, " ").trim();
const firstWords = (s: string, n = 5) => `${clean(s).split(" ").slice(0, n).join(" ")}…`;
const wordCount = (s: string) => (clean(s).match(/\S+/g) ?? []).length;
const trimTitle = (s: string) => s.replace(/[\s:.]+$/, "");
// Captions and asides name what follows ("Output:" above a code block); they never start a part of the answer.
const ASIDE = /^(notes?|tips?|important|warning|caution|examples?|for example|output|results?|usage|syntax|code)$/i;
// The real editor wraps code in a div with a header bar ("code-block-wrapper"); pasted code is a bare <pre>.
const isCode = (el: Element) =>
  el.tagName === "PRE" || el.classList.contains("code-block-wrapper") || (el.tagName === "DIV" && !!el.querySelector("pre") && !el.querySelector("p, ul, ol"));

// The prompt for a list: the last sentence of the text that introduces it, kept short.
function introCue(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+(?=["'(A-Z0-9])/);
  let cue = sentences.at(-1) ?? text;
  if (cue.length < 20 && sentences.length > 1) cue = `${sentences.at(-2)} ${cue}`;
  cue = cue.replace(/[\s:.]+$/, "");
  return cue.length > 110 ? `…${cue.slice(-105).replace(/^\S*\s/, "")}` : cue;
}

// The bold words an element starts with, which may run across several bold pieces, and a copy of the element without
// them. br: a line break follows them, so they're a title on a line of their own.
function splitLead(el: Element): { lead: string; br: boolean; rest: Element } | null {
  const copy = el.cloneNode(true) as Element;
  const walker = copy.ownerDocument.createTreeWalker(copy, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  const drop = new Set<Element>();
  let lead = "";
  let br = false;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.nodeType === Node.ELEMENT_NODE) {
      const tag = (n as Element).tagName;
      if (tag === "BR") {
        br = !!clean(lead);
        if (br) drop.add(n as Element);
        break;
      }
      if (tag === "UL" || tag === "OL" || tag === "PRE") break;
      continue;
    }
    const text = n.textContent ?? "";
    if (!text.trim()) {
      lead += text;
      continue;
    }
    let bold = n.parentElement?.closest("strong, b") ?? null;
    if (!bold || !copy.contains(bold)) break;
    for (let outer = bold.parentElement?.closest("strong, b"); outer && copy.contains(outer); outer = bold.parentElement?.closest("strong, b")) bold = outer;
    drop.add(bold);
    lead += text;
  }
  lead = clean(lead);
  if (!lead) return null;
  drop.forEach((d) => d.remove());
  // Wrappers the bold words leave empty (the editor puts each run in its own span).
  copy.querySelectorAll("p, span").forEach((e) => e.textContent === "" && !e.querySelector("img, code") && e.remove());
  return { lead, br, rest: copy };
}

// The term a paragraph defines: bold words at its start, followed by "is" or "are". Bold words elsewhere are emphasis.
function boldTerm(el: Element | undefined): string | null {
  const strong = el?.querySelector("strong, b");
  if (!el || !strong) return null;
  const term = trimTitle(clean(strong.textContent ?? ""));
  const text = clean(el.textContent ?? "");
  const at = text.indexOf(term);
  const defines = /^[\s),]*(\([^)]*\)\s*)?(is|are|was|were|refers|means|stands)\b/i.test(text.slice(at + term.length));
  return term.length >= 2 && term.length <= 60 && at >= 0 && at <= 15 && defines ? term : null;
}

// A paragraph as a title, a title with its text ("1. The Creation Phase" on its own line, or "The Problem: …"), or
// just text (null).
function readParagraph(el: Element): { title: string; rest?: { text: string; html: string; el: Element } | null } | null {
  const text = clean(el.textContent ?? "");
  if (!text) return null;
  const bold = clean([...el.querySelectorAll("strong, b")].map((s) => s.textContent ?? "").join(" "));
  if (/^H[1-6]$/.test(el.tagName) || (text.length <= 90 && bold.length >= text.length * 0.8)) return { title: trimTitle(text) };
  const split = splitLead(el);
  if (split && split.lead.length <= 90 && (split.br || split.lead.endsWith(":"))) {
    const rest = clean(split.rest.textContent ?? "");
    return { title: trimTitle(split.lead), rest: rest ? { text: rest, html: split.rest.outerHTML, el: split.rest } : null };
  }
  return null;
}

type Block = {
  kind: "code" | "list" | "title" | "text";
  text: string;
  html: string;
  el?: Element;
  at: number;
  section?: string | null;
  role?: "title" | "point" | "prompt" | "context" | "note";
};

// The answer's recall points, in reading order. Each is a prompt you can recall from:
// - label: a bullet that starts with bold words ("Scope:"), prompted by them;
// - list: plain bullets in a row, one point, prompted by the sentence that introduces them ("…which include (3 items)"),
//   or by the part's title when they come right after it;
// - item: a plain bullet with nothing to introduce it, prompted by its first words (cue: false);
// - section: a titled part with no list, prompted by its title;
// - opening: what the answer starts with, before any title or list, prompted by the term it defines, or "The short
//   answer".
// Text after a list, and code, explain or show more than they state, so no point asks them.
export function recallPoints(answerHtml: string | null | undefined): RecallPoint[] {
  const html = answerHtml ?? "";
  const hit = cache.get(html);
  if (hit) return hit;
  const points = parser ? analyze(parser.parseFromString(html, "text/html")) : [];
  if (cache.size > 500) cache.clear();
  cache.set(html, points);
  return points;
}
const cache = new Map<string, RecallPoint[]>();

function analyze(doc: Document): RecallPoint[] {
  const els: Element[] = [];
  const collect = (root: Element) => {
    for (const el of root.children) {
      if (isCode(el) || ["P", "UL", "OL", "BLOCKQUOTE"].includes(el.tagName) || /^H[1-6]$/.test(el.tagName)) els.push(el);
      else if (el.children.length) collect(el);
      else if (clean(el.textContent ?? "")) els.push(el);
    }
  };
  collect(doc.body);

  const blocks: Block[] = [];
  for (const el of els) {
    if (isCode(el)) blocks.push({ kind: "code", html: el.outerHTML, text: clean(el.querySelector("pre")?.textContent ?? el.textContent ?? ""), at: 0 });
    else if (el.tagName === "UL" || el.tagName === "OL") blocks.push({ kind: "list", el, html: el.outerHTML, text: clean(el.textContent ?? ""), at: 0 });
    else {
      const text = clean(el.textContent ?? "");
      if (!text) continue;
      const p = readParagraph(el);
      if (p?.title && !ASIDE.test(p.title)) {
        blocks.push({ kind: "title", text: p.title, html: el.outerHTML, at: 0 });
        if (p.rest) blocks.push({ kind: "text", ...p.rest, at: 0 });
      } else blocks.push({ kind: "text", text, html: el.outerHTML, el, at: 0 });
    }
  }
  // A title right above code is its caption ("Fetching paginated users:"), not a part of the answer.
  blocks.forEach((b, i) => {
    if (b.kind === "title" && blocks[i + 1]?.kind === "code") b.kind = "text";
    b.at = i;
  });

  const points: (RecallPoint & { at: number })[] = [];
  let section: string | null = null;
  let opening = true; // nothing but text so far
  let listed = false; // this part has a list, so text after it is a note
  let prose: Block[] = []; // text and code since the last title or list
  const add = (point: Omit<RecallPoint, "key" | "section" | "cue" | "items"> & Partial<Pick<RecallPoint, "cue" | "items">> & { at: number }, key?: string) => {
    const base = key ?? `${section ?? "main"}›${point.label}`.slice(0, 120);
    const seen = points.filter((p) => p.key === base || p.key.startsWith(`${base}#`)).length;
    points.push({ section, cue: true, items: 1, ...point, key: seen ? `${base}#${seen + 1}` : base });
  };
  // Text no list took as its prompt: the opening, or a titled part's text, becomes a point; the rest is context
  // (before a list) or a note.
  const flush = (beforeList: boolean) => {
    if (!prose.length) return;
    const body = prose.filter((b) => b.kind === "code" || !/:$/.test(b.text)); // "…in two phases:" only leads in
    const words = wordCount(body.filter((b) => b.kind === "text").map((b) => b.text).join(" "));
    const html = body.map((b) => b.html).join("");
    const first = body[0];
    if (first && opening && words >= 12) {
      add({ kind: "opening", label: boldTerm(body.find((b) => b.kind === "text")?.el) ?? "The short answer", html, at: first.at }, "main›(opening)");
      body.forEach((b) => (b.role = "point"));
    } else if (first && !opening && section && !beforeList && !listed && words >= 8) {
      add({ kind: "section", label: section.replace(/^\d+[.)]\s+/, ""), html, at: first.at }, `${section}›(text)`);
      body.forEach((b) => (b.role = "point"));
    }
    prose.forEach((b) => (b.role ??= beforeList ? "context" : "note"));
    prose = [];
  };

  for (const b of blocks) {
    b.section = section;
    if (b.kind === "title") {
      flush(false);
      section = b.text;
      b.section = section;
      b.role = "title";
      opening = false;
      listed = false;
      continue;
    }
    // Plain bullets after code in a titled part comment on the example: they're the part's text, not a list with a
    // prompt of its own.
    const items = b.kind === "list" && b.el ? [...b.el.querySelectorAll(":scope > li")] : [];
    const labelled = items.some((li) => splitLead(li));
    if (b.kind !== "list" || (!labelled && section && prose.length && prose.at(-1)?.kind === "code")) {
      prose.push(b);
      continue;
    }
    // A list: the text just before it introduces it, or the part's title when it comes right after that.
    const intro = prose.at(-1)?.kind === "text" ? prose.pop() : undefined;
    const introText = intro?.text ?? (blocks[b.at - 1]?.kind === "title" ? section : null);
    flush(true);
    opening = false;
    listed = true;
    b.role = "point";
    const tag = b.el?.tagName.toLowerCase() ?? "ul";
    let plain: Element[] = [];
    let n = 0;
    let prompted = false;
    const group = () => {
      if (!plain.length) return;
      if (introText) {
        const cue = introCue(introText);
        add({ kind: "list", label: plain.length > 1 ? `${cue} (${plain.length} items)` : cue, html: `<${tag}>${plain.map((li) => li.outerHTML).join("")}</${tag}>`, items: plain.length, at: b.at + n++ / 100 });
        prompted = true;
      } else plain.forEach((li) => add({ kind: "item", label: firstWords(li.textContent ?? ""), cue: false, html: li.innerHTML, at: b.at + n++ / 100 }));
      plain = [];
    };
    for (const li of items) {
      const split = splitLead(li);
      const label = split && trimTitle(split.lead);
      if (split && label && split.lead.length <= 60 && clean(split.rest.textContent ?? "")) {
        group();
        add({ kind: "label", label, html: split.rest.innerHTML.replace(/^(\s|<[^>]+>)*[:–—-]\s*/, (m) => m.replace(/[:–—-]\s*$/, "")), at: b.at + n++ / 100 });
      } else plain.push(li);
    }
    group();
    if (intro) intro.role = prompted ? "prompt" : "context";
  }
  flush(false);
  return points.sort((a, b) => a.at - b.at).map(({ at: _at, ...point }) => point);
}
