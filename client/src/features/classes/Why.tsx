// "Why?" for a quiz question (the prototype's ui/Why.jsx): the part of its flashcard that answers it, under the
// flashcard's question and the part's title, with the whole flashcard a tap away (why.ts finds the part). A question
// linked to no flashcard gets the closest one, said to be a guess, or else a note that nothing explains it yet.
import { useMemo, useState } from "react";
import { RichText } from "#components/ui/RichText.tsx";
import { cx } from "#utils/cx.ts";
import { whySource } from "./why.ts";

type Props = {
  question: { question: string; answer: string; wrongAnswers: readonly string[]; flashcardId?: string | null };
  flashcards: readonly { _id: string; question: string; answer: string }[];
  className?: string;
};

export function Why({ question, flashcards, className }: Props) {
  const source = useMemo(() => whySource(question, flashcards), [question, flashcards]);
  const [whole, setWhole] = useState(false);
  if (!source) {
    return <p className={cx("text-sm text-ink/60", className)}>Nothing explains this question yet: it isn't linked to a flashcard. Anyone can suggest a link in the set's editor.</p>;
  }
  return (
    <div className={className}>
      <p className="text-xs text-ink/50">
        {source.guess ? `The closest flashcard (${source.index + 1}): it isn't linked to this question yet` : `From flashcard ${source.index + 1}`}
        {!whole && source.passage.title && (
          <>
            {", "}
            <span className="font-semibold text-ink/70">{source.passage.title}</span>
          </>
        )}
      </p>
      <RichText html={source.flashcard.question} className="mt-1 line-clamp-2 !text-sm font-semibold" />
      <RichText html={whole ? source.flashcard.answer : source.passage.html} className="mt-2 !text-sm" />
      {source.passage.partial && (
        <button type="button" aria-expanded={whole} className="mt-2 cursor-pointer text-sm font-semibold text-brand hover:underline" onClick={() => setWhole((w) => !w)}>
          {whole ? "Show just the part that answers it" : "Read the whole flashcard"}
        </button>
      )}
    </div>
  );
}
