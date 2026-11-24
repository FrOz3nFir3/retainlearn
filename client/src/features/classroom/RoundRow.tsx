// One round in the classroom: its number and topic, how far its review and quiz have got (flashcards seen, stars), and
// a way into each. A round with questions linked to no flashcard has no review.
import { Link } from "react-router-dom";
import { shortTopic } from "@retainlearn/core";
import type { Round, RoundState } from "@retainlearn/core";
import { cx } from "#utils/cx.ts";
import { textOf } from "#utils/safeHtml.ts";
import { buttonClass } from "#components/ui/Button.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { classPath } from "#features/classes/modes.ts";
import { Stars } from "./Stars.tsx";

type Props = { setId: string; round: Round<{ _id: string; question: string }>; state: RoundState; next: boolean };

export function RoundRow({ setId, round, state, next }: Props) {
  const first = round.cards[0];
  const topic = first ? shortTopic(textOf(first.question)) : "Questions on their own";
  const returnTo = { returnTo: `/card/${setId}` };
  return (
    <li className={cx("rounded-2xl border bg-surface p-4", next ? "border-brand/40 shadow-[0_8px_24px_-16px_rgb(79_70_229/0.6)]" : "border-ink/[0.07]")}>
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-sm font-bold text-brand">{round.n}</span>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-semibold">{topic}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {state.cards > 0 && <Chip tone={state.reviewed >= state.cards ? "mint" : "neutral"}>{`${state.reviewed} of ${state.cards} flashcards seen`}</Chip>}
            {state.weak > 0 && <Chip tone="bell">{`${state.weak} with points missed`}</Chip>}
            {state.retry > 0 && <Chip tone="rose">{`${state.retry} to retry`}</Chip>}
            {state.fading && <Chip tone="cold">fading</Chip>}
            {state.total > 0 && state.tried && <Stars count={state.stars} />}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {state.cards > 0 && (
            <Link to={`${classPath(setId, "review")}?round=${round.n}`} state={returnTo} className={buttonClass(next && state.reviewed < state.cards ? "primary" : "quiet", "sm")}>
              Review
            </Link>
          )}
          {state.total > 0 && (
            <Link to={`${classPath(setId, "quiz")}?round=${round.n}`} state={returnTo} className={buttonClass(next && state.reviewed >= state.cards ? "primary" : "quiet", "sm")}>
              Quiz
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}
