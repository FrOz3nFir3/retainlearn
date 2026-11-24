// A round's quiz stars: 3 for all right, 2 for all but one, 1 for at least half (packages/core roundState). Said in
// words to screen readers.
import { cx } from "#utils/cx.ts";

export function Stars({ count, className }: { count: number; className?: string }) {
  return (
    <span className={cx("inline-flex gap-0.5", className)} role="img" aria-label={`${count} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className={cx("size-4", i < count ? "fill-bell text-bell" : "fill-none text-ink/25")} stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" strokeLinejoin="round" />
        </svg>
      ))}
    </span>
  );
}
