// A study set's rounds in the classroom (the prototype's RoundList): each round's review and quiz started straight from
// its row, and what's in the round opened in place, its flashcards and quiz questions each with where you stand, each
// opening to read (ReadItem.tsx). The study view picks what the rows show: both, or the review or the quiz alone; a
// round with nothing for the view isn't listed, and the numbers stay the same in every view.
// A round's buttons say where it stands, one meaning each: "Review 2/4" (a light fill for how far), then "Reviewed"
// (green) or "Go over 1" (amber: just the flashcards with points missed); "Quiz 1/3", then three stars (all right) or
// "Retry 1" (amber: just the questions missed); a red count for what you missed so far; "Continue" for a class left
// halfway. Their names say it all in words, for screen readers.
import { useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { isPlayerCard, leftToday, reviewDone, shortTopic } from "@retainlearn/core";
import type { ProgressView, Round, RoundState, StudySetContent, StudyView, When } from "@retainlearn/core";
import { Icon } from "#components/ui/Icon.tsx";
import type { IconName } from "#components/ui/Icon.tsx";
import { classPath } from "#features/classes/modes.ts";
import { cx } from "#utils/cx.ts";
import { textOf } from "#utils/safeHtml.ts";
import { Stars } from "./Stars.tsx";

type Flashcard = StudySetContent["flashcards"][number];
type Question = StudySetContent["questions"][number];
export type SetRound = Round<Flashcard, Question>;
export type Reading = { kind: "flashcard"; flashcard: Flashcard; index: number; round: SetRound } | { kind: "question"; question: Question; index: number; round: SetRound };

type Props = {
  set: StudySetContent;
  rounds: SetRound[];
  states: RoundState[];
  progress: ProgressView | null;
  view: StudyView;
  when: When;
  current: number | null; // where you are in the rounds (core's studyPlan)
  currentTag: string; // "Up next", or "Next round" when Up next is something else
  returnTo: string;
  onRead: (item: Reading) => void;
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const TAG = "shrink-0 rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold text-brand";

const BUTTON = "relative flex min-h-7 items-center gap-1 rounded-lg border px-2 text-[11px] font-semibold transition-colors pointer-coarse:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand";
const TONE = {
  done: "border-mint/40 bg-mint-wash text-mint-ink hover:border-mint",
  again: "border-bell/50 bg-bell-wash text-bell-ink hover:border-bell",
  plain: "border-ink/12 bg-surface text-ink/75 hover:border-brand/50 hover:text-brand",
};

function RoundButton({ to, returnTo, tone, icon, label, fill, missed, children }: { to: string; returnTo: string; tone: keyof typeof TONE; icon: IconName; label: string; fill?: number; missed?: number; children: ReactNode }) {
  return (
    <Link to={to} state={{ returnTo }} aria-label={label} className={cx(BUTTON, TONE[tone])}>
      {fill !== undefined && fill > 0 && fill < 1 && <span aria-hidden="true" className="absolute inset-y-0 left-0 rounded-l-[7px] bg-brand/10" style={{ width: `${Math.round(fill * 100)}%` }} />}
      <Icon name={icon} className="relative size-3.5" />
      <span className="relative flex items-center">{children}</span>
      {missed !== undefined && missed > 0 && (
        <span aria-hidden="true" className="absolute -top-1.5 -right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[9px] font-bold text-white tabular-nums">
          {missed}
        </span>
      )}
    </Link>
  );
}

export function RoundList({ set, rounds, states, progress, view, when, current, currentTag, returnTo, onRead }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  // A class left halfway today, as Up next sees it: its round's button says Continue.
  const left = leftToday(progress?.classInProgress, when);
  const missedFlashcard = (id: string) => progress?.flashcards[id]?.missedOn != null;
  const missedQuestion = (id: string) => progress?.questions[id]?.missedOn != null;
  return (
    <ol aria-label="Rounds" className="divide-y divide-ink/[0.06] overflow-hidden rounded-2xl border border-ink/[0.08] bg-surface">
      {rounds.map((r, i) => {
        const st = states[i];
        if (!st || (view === "quiz" && !r.questions.length) || (view === "review" && !r.flashcards.length)) return null;
        const isOpen = open === r.n;
        const reviewLeft = left?.mode === "review" && left.round === r.n;
        const quizLeft = left?.mode === "quiz" && left.round === r.n;
        const goOver = reviewDone(st) && st.weak > 0 && !reviewLeft;
        const reviewed = reviewDone(st) && !st.weak && !reviewLeft;
        const retry = st.retry > 0 && !st.untried && !quizLeft;
        const allRight = st.total > 0 && st.right === st.total && !quizLeft;
        const topics = r.flashcards.length ? r.flashcards.map((f) => shortTopic(textOf(f.question))).join(", ") : "Quiz questions linked to no flashcard";
        return (
          <li key={r.n} className={r.n === current ? "bg-brand/[0.04]" : undefined}>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 px-3 py-2">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : r.n)}
                className="flex min-h-7 min-w-0 cursor-pointer items-center gap-1.5 rounded-md text-left hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
              >
                <Icon name={isOpen ? "chevronDown" : "chevronRight"} className="size-4 shrink-0 text-ink/40" />
                <span className="shrink-0 text-sm font-semibold">Round {r.n}</span>
                {/* On a phone the tag goes under, with the topics, so the round's two buttons keep their room. */}
                {r.n === current && <span className={cx(TAG, "max-sm:hidden")}>{currentTag}</span>}
              </button>
              <div className="flex items-center gap-1.5">
                {view !== "quiz" && r.flashcards.length > 0 && (
                  <RoundButton
                    to={goOver ? `${classPath(set._id, "reviewMissed")}?ids=${r.flashcards.filter((f) => missedFlashcard(f._id)).map((f) => f._id).join(",")}` : `${classPath(set._id, "review")}?round=${r.n}`}
                    returnTo={returnTo}
                    tone={reviewed ? "done" : goOver ? "again" : "plain"}
                    icon={reviewed ? "check" : goOver ? "focus" : "review"}
                    fill={reviewLeft || reviewDone(st) ? undefined : st.reviewed / st.flashcards}
                    missed={goOver ? 0 : st.weak}
                    label={
                      reviewLeft
                        ? `Continue round ${r.n}'s review`
                        : goOver
                          ? `Round ${r.n} is reviewed: go over the points you missed on ${plural(st.weak, "flashcard")}`
                          : `Review round ${r.n}: ${reviewed ? "reviewed" : `${st.reviewed} of ${st.flashcards} flashcards reviewed`}${st.weak ? `, ${st.weak} with points missed` : ""}`
                    }
                  >
                    {reviewLeft ? "Continue" : goOver ? `Go over ${st.weak}` : reviewed ? "Reviewed" : `Review ${st.reviewed}/${st.flashcards}`}
                  </RoundButton>
                )}
                {view !== "review" &&
                  (r.questions.length ? (
                    <RoundButton
                      to={retry ? `${classPath(set._id, "retryMissed")}?ids=${r.questions.filter((q) => missedQuestion(q._id)).map((q) => q._id).join(",")}` : `${classPath(set._id, "quiz")}?round=${r.n}`}
                      returnTo={returnTo}
                      tone={allRight ? "done" : retry ? "again" : "plain"}
                      icon={retry ? "focus" : "quiz"}
                      fill={quizLeft || retry || allRight ? undefined : st.right / st.total}
                      missed={retry ? 0 : st.retry}
                      label={
                        quizLeft
                          ? `Continue round ${r.n}'s quiz`
                          : retry
                            ? `Round ${r.n}'s quiz is answered: retry the ${st.retry === 1 ? "question" : `${st.retry} questions`} you missed`
                            : `Quiz round ${r.n}: ${allRight ? "all right, 3 stars" : st.tried ? `${st.right} of ${st.total} right${st.retry ? `, ${st.retry} missed` : ""}` : "not tried yet"}`
                      }
                    >
                      {quizLeft ? "Continue" : allRight ? <Stars count={3} className="[&_svg]:size-3" /> : retry ? `Retry ${st.retry}` : `Quiz ${st.right}/${st.total}`}
                    </RoundButton>
                  ) : (
                    <span className="px-1 text-[11px] text-ink/45">No quiz yet</span>
                  ))}
              </div>
              <p className="col-span-2 mt-0.5 truncate pl-[22px] text-xs text-ink/55">
                {r.n === current && <span className={cx(TAG, "mr-1.5 sm:hidden")}>{currentTag}</span>}
                {topics}
              </p>
            </div>
            {isOpen && <RoundContents set={set} round={r} view={view} progress={progress} onRead={onRead} />}
          </li>
        );
      })}
    </ol>
  );
}

function ItemState({ tone, children }: { tone: "done" | "missed" | "new"; children: ReactNode }) {
  return <span className={cx("text-[11px] font-semibold whitespace-nowrap", tone === "done" ? "text-mint-ink" : tone === "missed" ? "text-rose-ink" : "text-ink/45")}>{children}</span>;
}

// A flashcard or a question in a round: its text (two lines) and where you stand; the row opens it to read.
function Item({ text, state, label, onOpen }: { text: string; state: ReactNode; label: string; onOpen: () => void }) {
  return (
    <li>
      <button type="button" onClick={onOpen} aria-label={label} className="group flex w-full cursor-pointer items-start gap-2 py-2 text-left focus-visible:outline-2 focus-visible:outline-brand">
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-[13px] leading-snug decoration-brand/40 underline-offset-2 group-hover:text-brand group-hover:underline">{text}</span>
          <span className="mt-0.5 block">{state}</span>
        </span>
        <Icon name="chevronRight" className="mt-0.5 size-4 shrink-0 text-ink/30 group-hover:text-brand" />
      </button>
    </li>
  );
}

// What's in a round, opened in place: its flashcards and its quiz questions, each opening to read.
function RoundContents({ set, round: r, view, progress, onRead }: { set: StudySetContent; round: SetRound; view: StudyView; progress: ProgressView | null; onRead: (item: Reading) => void }) {
  const indexOf = (id: string, list: { _id: string }[]) => list.findIndex((x) => x._id === id);
  return (
    <div className="space-y-3 border-t border-ink/[0.06] px-3 pt-2 pb-3">
      {view !== "quiz" && r.flashcards.length > 0 && (
        <section>
          <h4 className="text-[11px] font-semibold text-ink/50">Flashcards ({r.flashcards.length})</h4>
          <ul className="divide-y divide-ink/[0.05]">
            {r.flashcards.map((f) => {
              const p = progress?.flashcards[f._id];
              return (
                <Item
                  key={f._id}
                  text={textOf(f.question)}
                  label={`Read the flashcard: ${shortTopic(textOf(f.question))}`}
                  onOpen={() => onRead({ kind: "flashcard", flashcard: f, index: indexOf(f._id, set.flashcards), round: r })}
                  state={p?.missedOn != null ? <ItemState tone="missed">Points missed</ItemState> : p?.seenAt ? <ItemState tone="done">Reviewed</ItemState> : <ItemState tone="new">New</ItemState>}
                />
              );
            })}
          </ul>
        </section>
      )}
      {view !== "review" && r.questions.length > 0 && (
        <section>
          <h4 className="text-[11px] font-semibold text-ink/50">Quiz questions ({r.questions.length})</h4>
          <ul className="divide-y divide-ink/[0.05]">
            {r.questions.map((q) => {
              const p = progress?.questions[q._id];
              return (
                <Item
                  key={q._id}
                  text={textOf(q.question)}
                  label={`Read the question: ${textOf(q.question).slice(0, 80)}`}
                  onOpen={() => onRead({ kind: "question", question: q, index: indexOf(q._id, set.questions), round: r })}
                  state={p?.missedOn != null ? <ItemState tone="missed">Missed</ItemState> : isPlayerCard(p) ? <ItemState tone="done">{`Held, level ${p.level}`}</ItemState> : <ItemState tone="new">New</ItemState>}
                />
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
