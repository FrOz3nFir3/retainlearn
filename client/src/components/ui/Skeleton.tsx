// Loading placeholders shaped like what's coming, so nothing jumps when it arrives (PLAN 14.10). A page's skeleton is
// built from its real frame (the same page header, sections, cards and headings that don't depend on the data) with
// these parts where the data will go, and wrapped in Loading, which tells screen readers what's loading: a native
// <progress> with no value, read as "busy" (guide: spinner). The shapes themselves are hidden from them (guide:
// progress, a region that isn't ready is hidden). The shimmer and its reduced-motion fade are in styles/kit.css.
import type { ReactNode } from "react";
import { cx } from "#utils/cx.ts";

// One line of text to come, exactly as tall as a line of the text around it (1lh, the line height where it's put), so
// in a heading, a label or a chip it takes the room the words will. className: its width.
export function SkeletonText({ className = "w-24" }: { className?: string }) {
  return (
    <span className={cx("flex h-[1lh] max-w-full items-center", className)}>
      <span className="kit-skeleton block h-[0.6lh] w-full rounded-full" />
    </span>
  );
}

export function SkeletonLine({ className }: { className?: string }) {
  return <span className={cx("kit-skeleton block h-3 rounded-full", className)} />;
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <span className={cx("kit-skeleton block rounded-2xl", className)} />;
}

export function SkeletonCircle({ className }: { className?: string }) {
  return <span className={cx("kit-skeleton block shrink-0 rounded-full", className)} />;
}

// className lays out the shapes (it's on the element that holds them).
export function Loading({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div>
      <progress aria-label={label} className="sr-only" />
      <div aria-hidden="true" className={className}>
        {children}
      </div>
    </div>
  );
}
