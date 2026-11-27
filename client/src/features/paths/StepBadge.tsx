// A room's place in the path you follow (the prototype's StepBadge): "Step n", ticked once it's done with nothing
// missed, "now" while it's your current step. compact: the number alone (a 3D room's label).
import { cx } from "#utils/cx.ts";
import type { StepBadgeInfo } from "./pathView.ts";

export function StepBadge({ badge, compact = false }: { badge: StepBadgeInfo; compact?: boolean }) {
  const done = badge.state === "done";
  const tick = done && !badge.missed;
  const now = badge.state === "current";
  const said = tick ? `Path step ${badge.n}, done` : now ? `Path step ${badge.n}, your current step` : done ? `Path step ${badge.n}, done, with some missed to go over` : `Path step ${badge.n}`;
  return (
    <span
      title={said}
      className={cx(
        "inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[11px] leading-none font-semibold whitespace-nowrap tabular-nums",
        tick ? "bg-mint-wash text-mint-ink" : now ? "bg-brand text-white" : "bg-ink/6 text-ink/60",
      )}
    >
      <span aria-hidden="true">{compact ? `${badge.n}${tick ? " ✓" : ""}` : `Step ${badge.n}${tick ? " ✓" : now ? " · now" : ""}`}</span>
      <span className="sr-only">{said}</span>
    </span>
  );
}
