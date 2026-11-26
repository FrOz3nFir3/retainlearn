// A flashcard or a quiz question opened from a round, to read (the prototype's ReadModal and QuestionModal), in a wide
// dialog: answers are long and often hold code. Its button is the item's round, never a class of one.
// - A flashcard: its question, and its answer behind "Show the answer", so opening it doesn't hand you the answer
//   before you've tried to recall it.
// - A question: the question, then once you've tried it (you hold it, or you missed it) its answer and why (the
//   flashcard that teaches it). Not before: seeing the answer first turns the attempt into spotting it.
import { useState } from "react";
import { Link } from "react-router-dom";
import { isPlayerCard } from "@retainlearn/core";
import type { ProgressView, StudySetContent } from "@retainlearn/core";
import { Button, buttonClass } from "#components/ui/Button.tsx";
import { Dialog } from "#components/ui/Dialog.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { RichText } from "#components/ui/RichText.tsx";
import { classPath } from "#features/classes/modes.ts";
import { Note } from "#features/classes/Note.tsx";
import type { Reading } from "./Rounds.tsx";

type Props = { set: StudySetContent; item: Reading; progress: ProgressView | null; returnTo: string; onClose: () => void };

export function ReadItem({ set, item, progress, returnTo, onClose }: Props) {
  const [shown, setShown] = useState(false);
  const r = item.round;
  if (item.kind === "flashcard") {
    return (
      <Dialog
        title={`Flashcard ${item.index + 1}`}
        eyebrow={set.subtopic}
        onClose={onClose}
        wide
        footer={
          <Link to={`${classPath(set._id, "review")}?round=${r.n}`} state={{ returnTo }} className={buttonClass("primary")}>
            <Icon name="review" className="size-4 shrink-0" />
            Review round {r.n}
          </Link>
        }
      >
        <p className="text-xs font-semibold text-brand">Question</p>
        <RichText html={item.flashcard.question} className="mt-1 text-[16px] font-medium text-ink" />
        {shown ? (
          <Note html={item.flashcard.answer} className="panel mt-3 bg-surface p-4" />
        ) : (
          <div className="mt-3 rounded-2xl border border-dashed border-ink/15 px-4 py-5 text-center">
            <p className="text-sm text-ink/60">Try to recall it first: trying before you look is what makes it stick.</p>
            <Button icon="eye" className="mt-3" onClick={() => setShown(true)}>
              Show the answer
            </Button>
          </div>
        )}
      </Dialog>
    );
  }
  const q = item.question;
  const p = progress?.questions[q._id];
  const missed = p?.missedOn != null;
  const held = isPlayerCard(p) ? p : null;
  const teaches = q.flashcardId ? set.flashcards.find((f) => f._id === q.flashcardId) : undefined;
  const missedInRound = r.questions.filter((x) => progress?.questions[x._id]?.missedOn != null).map((x) => x._id);
  return (
    <Dialog
      title={`Quiz question ${item.index + 1}`}
      eyebrow={set.subtopic}
      onClose={onClose}
      wide
      footer={
        missed ? (
          <Link to={`${classPath(set._id, "retryMissed")}?ids=${missedInRound.join(",")}`} state={{ returnTo }} className={buttonClass("primary")}>
            <Icon name="focus" className="size-4 shrink-0" />
            Retry round {r.n}'s misses
          </Link>
        ) : (
          <Link to={`${classPath(set._id, "quiz")}?round=${r.n}`} state={{ returnTo }} className={buttonClass("primary")}>
            <Icon name="quiz" className="size-4 shrink-0" />
            Quiz round {r.n}
          </Link>
        )
      }
    >
      <p className="text-xs font-semibold text-brand">Question</p>
      <RichText html={q.question} className="mt-1 text-[15px] font-medium text-ink" />
      {missed || held ? (
        <>
          <div className="mt-3 rounded-2xl bg-mint-wash px-4 py-3">
            <p className="text-xs font-semibold text-mint-ink">Answer</p>
            <RichText html={q.answer} className="mt-0.5 !text-sm" />
          </div>
          <p className={missed ? "mt-2 text-xs font-semibold text-rose-ink" : "mt-2 text-xs font-semibold text-mint-ink"}>
            {missed ? "You missed it last time: it's on your retry list." : `You hold it as a player card, level ${held?.level}.`}
          </p>
          {teaches && (
            <section className="mt-3 rounded-2xl border border-ink/[0.08] p-4">
              <h2 className="text-xs font-semibold text-ink/50">Why: the flashcard that teaches it</h2>
              <RichText html={teaches.answer} className="mt-1 !text-sm" />
            </section>
          )}
        </>
      ) : (
        <p className="mt-3 rounded-2xl border border-dashed border-ink/15 px-4 py-4 text-center text-sm text-ink/60">
          Its choices and answer come in the quiz, so you recall the answer rather than spot it. Get it right and it's a new player card.
        </p>
      )}
    </Dialog>
  );
}
