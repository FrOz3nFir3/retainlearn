// A flashcard reviewed whole (fewer than two recall points): it turns over to its answer (Space, or a tap), then you
// rate how well you knew it (1 Perfect, 2 Close, 3 Difficult). Only Perfect counts as known. A long answer or question
// (or one with code or a list) is shown as panels, the answer below the question, instead of on a flashcard.
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { textOf } from "#utils/safeHtml.ts";
import { Button } from "#components/ui/Button.tsx";
import { RichText } from "#components/ui/RichText.tsx";
import { ClassShell } from "./ClassShell.tsx";
import { Note } from "./Note.tsx";
import type { FlashcardResult } from "./PointsFlashcard.tsx";
import type { ReviewFlashcard } from "./reviewPlan.ts";

const RATINGS = [
  ["Perfect", "bg-mint hover:bg-mint/90"],
  ["Close", "bg-bell hover:bg-bell/90 text-night"],
  ["Difficult", "bg-danger hover:bg-danger-deep"],
] as const;

// Long answers get the reading layout instead of the flashcard.
const isLong = (html: string) => textOf(html).length > 420 || /<(pre|ul|ol)\b/i.test(html);

type Props = {
  shell: { set: { _id: string; category: string; subtopic: string }; mode: "review" | "reviewMissed"; progressText: string; track: ReactNode };
  flashcard: ReviewFlashcard;
  onDone: (result: FlashcardResult) => void;
  notice?: ReactNode;
};

export function WholeFlashcard({ shell, flashcard, onDone, notice }: Props) {
  const [revealed, setRevealed] = useState(false);
  const long = isLong(flashcard.answer) || isLong(flashcard.question);
  const rate = (i: number) => onDone({ id: flashcard._id, knew: i === 0, points: [], known: i === 0 ? 1 : 0, weight: 1, missed: i === 0 ? [] : ["The whole flashcard"] });

  useEffect(() => {
    // 1, 2 and 3 rate it wherever the focus is (after clicking the card, say); Space turns it, except on a button,
    // which Space presses (the card is one).
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as Element | null;
      if (target?.closest?.("input, textarea, select, [contenteditable='true']")) return;
      if (e.key === " ") {
        if (target?.closest?.("button, summary")) return;
        e.preventDefault();
        setRevealed((r) => !r);
      } else if (revealed && ["1", "2", "3"].includes(e.key)) rate(Number(e.key) - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <ClassShell
      {...shell}
      bar={
        revealed ? (
          RATINGS.map(([label, tone], i) => (
            <Button key={label} tone="primary" className={`flex-1 sm:flex-none ${tone}`} onClick={() => rate(i)}>
              {label} ({i + 1})
            </Button>
          ))
        ) : (
          <Button tone="primary" className="w-full sm:w-auto" onClick={() => setRevealed(true)}>
            Show answer (Space)
          </Button>
        )
      }
    >
      {notice}
      {long ? (
        <>
          <div className="panel bg-surface p-5">
            <p className="text-xs font-semibold text-brand">Question</p>
            <RichText html={flashcard.question} className="mt-1 text-[17px] font-medium text-ink" />
          </div>
          {revealed ? <Note html={flashcard.answer} className="panel mt-4 bg-surface p-5" /> : <p className="mt-4 text-center text-sm text-ink/55">Answer it in your head, then show the answer.</p>}
        </>
      ) : (
        <button type="button" className="kit-flip block h-72 w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-brand" onClick={() => setRevealed((r) => !r)} aria-label={revealed ? "Show the question" : "Show the answer"}>
          <span className={`kit-flip-inner block ${revealed ? "is-flipped" : ""}`}>
            <span className="kit-flip-face flex flex-col rounded-3xl bg-brand p-6 text-white shadow-[0_18px_40px_-18px_rgb(79_70_229/0.8)]" aria-hidden={revealed}>
              <span className="text-xs font-semibold text-white/70">Question</span>
              <RichText html={flashcard.question} className="m-auto text-center text-2xl font-semibold text-white" />
              <span className="text-center text-xs text-white/60">Tap or press Space to see the answer</span>
            </span>
            <span className="kit-flip-face kit-flip-back flex flex-col rounded-3xl border-2 border-bell/60 bg-bell-wash p-6" aria-hidden={!revealed}>
              <span className="text-xs font-semibold text-bell-ink">Answer</span>
              <RichText html={flashcard.answer} className="m-auto text-center text-lg" />
              <span className="text-center text-xs text-ink/45">How well did you know it?</span>
            </span>
          </span>
        </button>
      )}
    </ClassShell>
  );
}
