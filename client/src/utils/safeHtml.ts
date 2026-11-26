// Putting user-written HTML (study set content, from the editor) into the page, sanitized in the browser (guide:
// sanitize-untrusted-html). The browser's own Sanitizer API where there is one (setHTML), and DOMPurify, downloaded
// only where there isn't (Safari), with the same allowlist and the same behaviour: anything not listed is removed with
// its content, and no aria-* or data-* attribute gets through except data-language (a code block's language). Of the
// classes, only the ones the editor writes are kept: the app's own utility classes, in content the old editor saved
// (its code block header) or put there on purpose, would otherwise style user content, even lay it over the page. The
// server sanitizes on save too; this is the second layer.

// div: the editor wraps each code block, with a header naming its language, in one.
const ELEMENTS = ["div", "p", "br", "strong", "b", "em", "i", "u", "s", "sub", "sup", "code", "pre", "ul", "ol", "li", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "a", "span"];
const ATTRIBUTES = ["href", "title", "class", "data-language"];
const CLASSES = new Set(["inline-code", "code-block-wrapper", "code-block-header", "language-label"]);

function keepEditorClasses(root: Element) {
  root.querySelectorAll("[class]").forEach((el) => {
    const kept = [...el.classList].filter((name) => CLASSES.has(name));
    if (kept.length) el.className = kept.join(" ");
    else el.removeAttribute("class");
  });
}

type WithSetHTML = Element & { setHTML(html: string, options: { sanitizer: { elements: string[]; attributes: string[] } }): void };
const hasSetHTML = (el: Element): el is WithSetHTML => "setHTML" in el;

type Purify = { sanitize(html: string, config: Record<string, unknown>): string };
let purify: Promise<Purify> | undefined;

// Replaces el's content with html, sanitized. Resolves once it's in. stillWanted: checked before a late write (the
// DOMPurify download), so content that changed meanwhile isn't overwritten by older content.
export async function setSafeHTML(el: Element, html: string, stillWanted: () => boolean = () => true): Promise<void> {
  if (hasSetHTML(el)) {
    el.setHTML(html, { sanitizer: { elements: ELEMENTS, attributes: ATTRIBUTES } });
    keepEditorClasses(el);
    return;
  }
  purify ??= import("dompurify").then((m) => m.default as Purify);
  const DOMPurify = await purify;
  if (!stillWanted()) return;
  el.innerHTML = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...ELEMENTS, "#text"],
    ALLOWED_ATTR: ATTRIBUTES,
    ALLOW_ARIA_ATTR: false,
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: false,
  });
  keepEditorClasses(el);
}

// User content's text, without its markup: for names, excerpts and counting. Parsed into a document that's never
// shown, so nothing in it runs. A space goes at every block edge, so "demonstrate:</p><p>The effect" doesn't run
// together, and the editor's code-block header bar ("JavaScript") isn't counted as content.
const parser = typeof DOMParser === "undefined" ? null : new DOMParser();
export function textOf(html: string | null | undefined): string {
  if (!html) return "";
  const spaced = html.replace(/<\/(p|li|div|pre|h[1-6]|ul|ol|blockquote)>|<br\s*\/?>/gi, (m) => `${m} `);
  if (!parser) return spaced.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const body = parser.parseFromString(spaced, "text/html").body;
  body.querySelectorAll(".code-block-header").forEach((el) => el.remove());
  return (body.textContent ?? "").replace(/\s+/g, " ").trim();
}
