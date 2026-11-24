// A quiz's questions as a penalty shootout's balls: a ball for each one right, a cross for a miss, a ring on the one
// you're on; the newest lands with a bounce (none with reduced motion). marks: the answers so far. index: the question
// you're on (-1 at the end). The list says the score to screen readers.
import { cx } from "#utils/cx.ts";
import { Icon } from "#components/ui/Icon.tsx";

export function Pips({ marks, total, index, size = "size-7" }: { marks: readonly { correct: boolean }[]; total: number; index: number; size?: string }) {
  const right = marks.filter((m) => m.correct).length;
  return (
    <ol className="flex flex-wrap items-center gap-1.5" aria-label={`${right} right of ${marks.length} answered, ${total} in all`}>
      {Array.from({ length: total }, (_, i) => {
        const mark = marks[i];
        return (
          <li
            key={i}
            className={cx(
              "grid place-items-center rounded-full",
              size,
              mark ? cx(mark.correct ? "bg-mint" : "bg-danger", i === marks.length - 1 && "motion-safe:animate-[kit-land_0.5s_cubic-bezier(0.2,0.9,0.3,1.5)_both]") : i === index ? "bg-surface ring-2 ring-brand" : "bg-ink/[0.07]",
            )}
          >
            {mark && <Icon name={mark.correct ? "ball" : "x"} className="size-[60%] text-white" />}
          </li>
        );
      })}
    </ol>
  );
}
