// A share as a ring that fills as it appears (still with reduced motion): the recall points you knew, of a flashcard
// or a whole review. Decorative: what it shows is in the text next to it or inside it.
import type { ReactNode } from "react";
import { cx } from "#utils/cx.ts";

export function Ring({ value, tone = "text-mint", size = "size-14", children }: { value: number; tone?: string; size?: string; children?: ReactNode }) {
  return (
    <span className={cx("relative grid shrink-0 place-items-center", size)}>
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="4" className="stroke-ink/[0.08]" />
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="100"
          strokeDashoffset={100 - Math.round(Math.min(1, Math.max(0, value)) * 100)}
          className={cx("stroke-current motion-safe:animate-[kit-ring-fill_0.9s_cubic-bezier(0.2,0.8,0.2,1)_both]", tone)}
        />
      </svg>
      <span className="relative text-sm font-bold tabular-nums">{children}</span>
    </span>
  );
}
