// Loading placeholders shaped like what's coming, so nothing jumps when it arrives (PLAN 14.10). A page's skeleton
// is built from these parts and wrapped in Loading, which tells screen readers what's loading: a native <progress>
// with no value, read as "busy" (guide: spinner). The shapes themselves are hidden from them (guide: progress, a
// region that isn't ready is hidden). The shimmer and its reduced-motion fade are in styles/kit.css.
import type { ReactNode } from "react";
import { cx } from "#utils/cx.ts";

export function SkeletonLine({ className }: { className?: string }) {
  return <span className={cx("kit-skeleton block h-3 rounded-full", className)} />;
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <span className={cx("kit-skeleton block rounded-2xl", className)} />;
}

export function SkeletonCircle({ className }: { className?: string }) {
  return <span className={cx("kit-skeleton block shrink-0 rounded-full", className)} />;
}

export function Loading({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <progress aria-label={label} className="sr-only" />
      <div aria-hidden="true">{children}</div>
    </div>
  );
}
