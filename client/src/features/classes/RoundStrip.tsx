// Every round of the set at the end of a class, to jump straight to another, the one just done ringed (the prototype's
// RoundStrip; review and quiz ends alike). For a quiz: each round's stars, and a red count of the questions missed.
// For a review: how far each round's review is ("2/4"), a tick once it's reviewed with nothing missed, or a red count
// of its flashcards with points missed. A tap starts that round's class. Its link names say the same in words.
import { Link } from "react-router-dom";
import { reviewDone } from "@retainlearn/core";
import type { Round, RoundState } from "@retainlearn/core";
import { Icon } from "#components/ui/Icon.tsx";
import { Stars } from "#features/classroom/Stars.tsx";
import { cx } from "#utils/cx.ts";
import { classPath } from "./modes.ts";

type Props = { setId: string; rounds: readonly Round[]; states: readonly RoundState[]; current: number | null; kind: "review" | "quiz"; returnTo: string };

export function RoundStrip({ setId, rounds, states, current, kind, returnTo }: Props) {
  const review = kind === "review";
  return (
    <ul aria-label={review ? "Review rounds" : "Quiz rounds"} className="mt-3 flex flex-wrap gap-1.5">
      {rounds.map((r, i) => {
        const st = states[i];
        if (!st || (review ? !r.flashcards.length : !r.questions.length)) return null;
        const clean = review ? reviewDone(st) && !st.weak : st.total > 0 && st.right === st.total;
        const missed = review ? st.weak : st.retry;
        const label = review
          ? `Review round ${r.n}: ${st.reviewed} of ${st.flashcards} flashcards reviewed${st.weak ? `, ${st.weak} with points missed` : ""}`
          : `Quiz round ${r.n}: ${st.stars} of 3 stars${st.retry ? `, ${st.retry} missed` : ""}`;
        return (
          <li key={r.n}>
            <Link
              to={`${classPath(setId, kind)}?round=${r.n}`}
              state={{ returnTo }}
              aria-label={label}
              aria-current={r.n === current ? "true" : undefined}
              className={cx(
                "relative flex w-12 flex-col items-center gap-1 rounded-xl border px-1 py-1.5 transition-colors hover:border-brand/50 focus-visible:outline-2 focus-visible:outline-brand",
                r.n === current ? "border-brand bg-brand/[0.07] ring-2 ring-brand/30" : clean ? "border-mint/40 bg-mint-wash" : !review && st.stars === 3 ? "border-bell/50 bg-bell-wash" : "border-ink/10 bg-surface",
              )}
            >
              <span className="text-[10px] font-bold text-ink/55">{r.n}</span>
              {review ? (
                clean ? (
                  <Icon name="check" className="size-3.5 text-mint-ink" strokeWidth={2.6} />
                ) : (
                  <span className="text-[10px] font-semibold text-ink/70 tabular-nums">
                    {st.reviewed}/{st.flashcards}
                  </span>
                )
              ) : (
                <Stars count={st.stars} className="[&_svg]:size-2.5" />
              )}
              {missed > 0 && (
                <span aria-hidden="true" className="absolute -top-1.5 -right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[9px] font-bold text-white tabular-nums">
                  {missed}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
