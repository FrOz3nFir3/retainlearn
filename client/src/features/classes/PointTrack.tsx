// A review's recall points as a track in the header, flashcard by flashcard (each as wide as its share of the points):
// one colour for each point you knew, another for each you didn't, the one you're on lit, the rest to come. Both
// colours fill it: it's the recalling that counts, so knowing isn't paid more than an honest "didn't". Its text says
// the same to screen readers.
import { cx } from "#utils/cx.ts";

export type PointState = "knew" | "missed" | "now" | "later";

export function PointTrack({ groups }: { groups: readonly (readonly PointState[])[] }) {
  const flat = groups.flat();
  const knew = flat.filter((s) => s === "knew").length;
  const marked = flat.filter((s) => s === "knew" || s === "missed").length;
  return (
    <div className="flex items-center gap-2" role="img" aria-label={`Recall points: ${knew} known, ${marked - knew} missed, ${flat.length - marked} to go`}>
      {groups.map((group, gi) => (
        <div key={gi} className="flex min-w-0 gap-0.5" style={{ flex: `${group.length} 1 0%` }}>
          {group.map((state, i) => (
            <span
              key={i}
              className={cx("h-1.5 min-w-0 flex-1 rounded-full transition-colors duration-300", state === "knew" ? "bg-mint" : state === "missed" ? "bg-danger/70" : state === "now" ? "bg-brand" : "bg-ink/[0.08]")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
