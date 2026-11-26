// A whole answer to read (the prototype's Note): its titled parts as a row of links at the top, then the text, with each
// titled part shown as a heading. A titled part is a paragraph of its own (not in a list or code) of 3 to 90 characters,
// most of it bold: how the editor's authors title the parts of a long answer. Used where an answer is read whole: a
// review's "Read the full answer", and a flashcard opened in the classroom.
import { useId, useState } from "react";
import { RichText } from "#components/ui/RichText.tsx";

type Part = { id: string; title: string };

// A part's title without its subtitle: "var - The Legacy Keyword" → "var".
const shortTitle = (title: string) => title.split(/\s[-–—]\s/)[0] ?? title;

function markParts(root: HTMLElement, prefix: string): Part[] {
  const parts: Part[] = [];
  root.querySelectorAll<HTMLParagraphElement>(":scope > p").forEach((p) => {
    const text = (p.textContent ?? "").replace(/\s+/g, " ").trim();
    const bold = [...p.querySelectorAll("strong, b")].map((b) => b.textContent ?? "").join("").replace(/\s+/g, " ").trim();
    if (text.length < 3 || text.length > 90 || bold.length < text.length * 0.8) return;
    p.id = `${prefix}-part-${parts.length + 1}`;
    p.classList.add("answer-part");
    parts.push({ id: p.id, title: text });
  });
  return parts;
}

export function Note({ html, className }: { html: string; className?: string }) {
  const prefix = useId().replace(/:/g, "");
  const [parts, setParts] = useState<Part[]>([]);
  return (
    <div className={className}>
      {parts.length > 1 && (
        <nav aria-label="Parts of this note" className="mb-4 flex flex-wrap gap-1.5">
          {parts.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => document.getElementById(p.id)?.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
              className="cursor-pointer rounded-full bg-ink/[0.05] px-2.5 py-1 text-xs font-semibold text-ink/70 hover:bg-brand/10 hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
            >
              {shortTitle(p.title)}
            </button>
          ))}
        </nav>
      )}
      <RichText html={html} onReady={(el) => setParts(markParts(el, prefix))} />
    </div>
  );
}
