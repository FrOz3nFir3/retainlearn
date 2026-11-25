// Pages of a long list: Previous and Next as links, so every page has its own address (the back button, a shared link
// and search engines all reach it), with where you are between them. Nothing when it all fits on one page. href: a
// page's address. label: what's paged, for screen readers ("Pages of subjects").
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { cx } from "#utils/cx.ts";
import { buttonClass } from "./Button.tsx";
import { Icon } from "./Icon.tsx";

type Props = { page: number; pages: number; href: (page: number) => string; label: string; className?: string };

export function Pager({ page, pages, href, label, className }: Props) {
  if (pages <= 1) return null;
  // A side with nowhere to go keeps its place, dimmed, so the other doesn't jump; it isn't a link, so it's skipped.
  const end = cx(buttonClass("quiet", "sm"), "pointer-events-none opacity-40");
  return (
    <nav aria-label={label} className={cx("mt-6 flex items-center justify-center gap-3", className)}>
      {page > 1 ? (
        <Link to={href(page - 1)} rel="prev" className={buttonClass("quiet", "sm")}>
          <Icon name="chevronLeft" className="size-4" /> Previous
        </Link>
      ) : (
        <span aria-hidden="true" className={end}>
          <Icon name="chevronLeft" className="size-4" /> Previous
        </span>
      )}
      <span className="text-sm text-ink/60 tabular-nums">{`Page ${page} of ${pages}`}</span>
      {page < pages ? (
        <Link to={href(page + 1)} rel="next" className={buttonClass("quiet", "sm")}>
          Next <Icon name="chevronRight" className="size-4" />
        </Link>
      ) : (
        <span aria-hidden="true" className={end}>
          Next <Icon name="chevronRight" className="size-4" />
        </span>
      )}
    </nav>
  );
}

// Focus (and the view) to the list's heading when the page changes, as a new page would: the heading gets this ref
// and tabIndex={-1}. Not on the first page shown.
export function usePageHeading(page: number) {
  const heading = useRef<HTMLHeadingElement>(null);
  const shown = useRef(page);
  useEffect(() => {
    if (shown.current === page) return;
    shown.current = page;
    heading.current?.focus();
  }, [page]);
  return heading;
}
