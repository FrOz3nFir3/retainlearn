// User-written content (a flashcard's or a question's HTML), shown safely: sanitized in the browser before it's in
// the page (utils/safeHtml.ts), links marked as user content that search engines don't follow, and code coloured.
// The "rich" styles are in styles/kit.css.
import { useLayoutEffect, useRef } from "react";
import { cx } from "#utils/cx.ts";
import { highlightCode } from "#utils/highlight.ts";
import { setSafeHTML } from "#utils/safeHtml.ts";

export function RichText({ html, className }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let current = true;
    void setSafeHTML(el, html, () => current).then(() => {
      if (!current) return;
      el.querySelectorAll("a[href]").forEach((link) => link.setAttribute("rel", "nofollow ugc noopener noreferrer"));
      void highlightCode(el);
    });
    return () => {
      current = false;
    };
  }, [html]);
  return <div ref={ref} className={cx("rich", className)} />;
}
