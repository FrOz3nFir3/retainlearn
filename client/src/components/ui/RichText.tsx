// User-written content (a flashcard's or a question's HTML), shown safely: sanitized in the browser before it's in
// the page (utils/safeHtml.ts), links marked as user content that search engines don't follow, and code coloured.
// Code longer than FOLD_LINES lines folds to its first lines, with a button to show it all (the prototype's). onReady:
// called with the content once it's in, for a view that marks it up further (Note.tsx). The "rich" styles are in
// styles/kit.css.
import { useLayoutEffect, useRef } from "react";
import { cx } from "#utils/cx.ts";
import { highlightCode } from "#utils/highlight.ts";
import { setSafeHTML } from "#utils/safeHtml.ts";

const FOLD_LINES = 14;

function foldLongCode(root: HTMLElement) {
  root.querySelectorAll("pre").forEach((pre) => {
    const lines = (pre.textContent ?? "").replace(/\n$/, "").split("\n").length;
    if (lines <= FOLD_LINES) return;
    pre.classList.add("is-folded");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "rich-unfold";
    button.textContent = `Show all ${lines} lines`;
    button.addEventListener("click", () => {
      pre.classList.remove("is-folded");
      button.remove();
    });
    pre.after(button);
  });
}

export function RichText({ html, className, onReady }: { html: string; className?: string; onReady?: (el: HTMLDivElement) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const ready = useRef(onReady);
  useLayoutEffect(() => {
    ready.current = onReady;
  });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let current = true;
    void setSafeHTML(el, html, () => current).then(() => {
      if (!current) return;
      el.querySelectorAll("a[href]").forEach((link) => link.setAttribute("rel", "nofollow ugc noopener noreferrer"));
      foldLongCode(el);
      ready.current?.(el);
      void highlightCode(el);
    });
    return () => {
      current = false;
    };
  }, [html]);
  return <div ref={ref} className={cx("rich", className)} />;
}
