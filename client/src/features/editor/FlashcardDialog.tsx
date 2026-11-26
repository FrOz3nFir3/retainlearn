// A flashcard in a dialog, new or saved (the prototype's FlashcardEditor): its question and answer, and how the
// answer will be reviewed, in recall points found from its bold labels, titles and lists (features/classes) or as one
// card, and a preview of it as learners see it. The set's editors save it; anyone else signed in suggests the change, for a reviewer to accept. A guest sees
// it as learners do, with a way to sign in.
import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { problemOf } from "#api/problem.ts";
import { Button, buttonClass } from "#components/ui/Button.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { Dialog } from "#components/ui/Dialog.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { RichField } from "#components/ui/RichEditor.tsx";
import { RichText } from "#components/ui/RichText.tsx";
import { MIN_POINTS, recallPoints } from "#features/classes/recallPoints.ts";
import { useSaveStudySetMutation } from "./editorApi.ts";
import type { SetChange } from "./editorApi.ts";
import { SAVE_LABEL, isBlank, plural, savedNotice } from "./shared.ts";
import type { Access, Notice } from "./shared.ts";

type Flashcard = { _id: string; question: string; answer: string };
type Props = { setId: string; eyebrow: string; flashcard: Flashcard | null; index: number; access: Access; onClose: () => void; onSaved: (notice: Notice) => void };

export function FlashcardDialog({ access, flashcard, ...rest }: Props) {
  if (access === "guest") return flashcard ? <FlashcardView flashcard={flashcard} {...rest} /> : null;
  return <FlashcardForm access={access} flashcard={flashcard} {...rest} />;
}

function FlashcardForm({ setId, eyebrow, flashcard, index, access, onClose, onSaved }: Props & { access: Exclude<Access, "guest"> }) {
  const [question, setQuestion] = useState({ html: flashcard?.question ?? "", changed: false });
  const [answer, setAnswer] = useState({ html: flashcard?.answer ?? "", changed: false });
  const [tried, setTried] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [save, saving] = useSaveStudySetMutation();
  const points = useMemo(() => recallPoints(answer.html), [answer.html]);

  const errors = { question: isBlank(question.html) ? "Add a question." : null, answer: isBlank(answer.html) ? "Add an answer." : null };
  const changed = flashcard ? question.changed || answer.changed : !isBlank(question.html) || !isBlank(answer.html);
  const what = flashcard ? `flashcard ${index + 1}` : "a new flashcard";
  const title = flashcard ? `Edit flashcard ${index + 1}` : access === "editor" ? "New flashcard" : "Suggest a flashcard";

  const submit = async () => {
    setTried(true);
    if (errors.question || errors.answer || !changed) return;
    const change: SetChange = flashcard
      ? { cardId: flashcard._id, ...(question.changed ? { question: question.html } : {}), ...(answer.changed ? { answer: answer.html } : {}) }
      : { question: question.html, answer: answer.html };
    try {
      const { suggested } = await save({ setId, change }).unwrap();
      onSaved(savedNotice(suggested, `Saved ${what}.`, `Suggestion for ${what} sent.`));
      onClose();
    } catch (error) {
      setProblem(problemOf(error, "That didn't save. Check your connection and try again."));
    }
  };

  return (
    <Dialog
      title={title}
      eyebrow={eyebrow}
      onClose={onClose}
      wide
      footer={
        <>
          {flashcard && !changed && <span className="mr-auto self-center text-xs text-ink/50">No changes yet</span>}
          <Button onClick={onClose}>Cancel</Button>
          <Button tone="primary" disabled={!changed || saving.isLoading} onClick={submit}>
            {saving.isLoading ? "Saving…" : SAVE_LABEL[access]}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {problem && (
          <p role="alert" className="rounded-xl bg-rose-wash px-3 py-2 text-sm text-rose-ink">
            {problem}
          </p>
        )}
        <RichField
          label="Question"
          value={question.html}
          onChange={(html, changed) => setQuestion({ html, changed })}
          error={tried ? errors.question : null}
          placeholder="What should someone be able to recall?"
          className="min-h-20"
        />
        <RichField
          label="Answer"
          value={answer.html}
          onChange={(html, changed) => setAnswer({ html, changed })}
          error={tried ? errors.answer : null}
          hint="Bold labels, titles and lists become recall points by themselves."
          placeholder="The full answer. Detail is welcome."
          className="min-h-44"
        />
        <section aria-label="How it's reviewed" className="rounded-xl bg-brand/[0.05] p-3 text-sm">
          <p className="flex items-center gap-2 font-semibold text-brand">
            <Icon name="sparkle" className="size-4" />
            {points.length >= MIN_POINTS ? `Reviewed in ${plural(points.length, "recall point")}` : "Reviewed as one card"}
          </p>
          {points.length >= MIN_POINTS ? (
            <ol aria-label="Recall points" className="mt-2 flex flex-wrap gap-1.5">
              {points.map((p) => (
                <li key={p.key}>
                  <Chip tone="brand">{p.label}</Chip>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-1 text-xs text-ink/60">Learners see the whole answer and rate how well they knew it. With {MIN_POINTS} or more points, they recall it point by point.</p>
          )}
          <details className="mt-2 text-xs text-ink/60">
            <summary className="cursor-pointer font-semibold hover:text-brand">How points are found</summary>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              <li>
                A bullet that starts with bold words (<strong>Scope:</strong> …) is a point, asked by those words.
              </li>
              <li>Plain bullets are one point together, asked by the sentence before them.</li>
              <li>A titled part with no list is a point, asked by its title.</li>
              <li>The opening is a point, asked by the term it defines, or as "The short answer".</li>
              <li>Text after a list, and code, aren't asked.</li>
            </ul>
            <p className="mt-1">Learners recall one point at a time, and only the ones they miss come back.</p>
          </details>
        </section>
        <div>
          <Button size="sm" icon={preview ? "chevronUp" : "eye"} aria-expanded={preview} onClick={() => setPreview((p) => !p)}>
            {preview ? "Hide preview" : "Show preview"}
          </Button>
          {preview && (
            <div className="mt-2 overflow-hidden rounded-2xl border border-ink/10">
              <div className="bg-brand px-4 py-3">
                <p className="text-[11px] font-semibold text-white/70">Question</p>
                {isBlank(question.html) ? <p className="text-sm text-white/60">Nothing yet</p> : <RichText html={question.html} className="!text-white [&_strong]:!text-white" />}
              </div>
              <div className="bg-surface px-4 py-3">
                <p className="text-[11px] font-semibold text-bell-ink">Answer</p>
                {isBlank(answer.html) ? <p className="text-sm text-ink/45">Nothing yet</p> : <RichText html={answer.html} />}
              </div>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}

function FlashcardView({ eyebrow, flashcard, index, onClose }: Omit<Props, "access" | "flashcard"> & { flashcard: Flashcard }) {
  const location = useLocation();
  return (
    <Dialog
      title={`Flashcard ${index + 1}`}
      eyebrow={eyebrow}
      onClose={onClose}
      wide
      footer={
        <>
          <Button onClick={onClose}>Close</Button>
          <Link to="/sign-in" state={{ returnTo: `${location.pathname}${location.search}` }} className={buttonClass("primary")}>
            Sign in to edit
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <section>
          <h2 className="mb-1 text-xs font-semibold text-ink/50">Question</h2>
          <RichText html={flashcard.question} />
        </section>
        <section>
          <h2 className="mb-1 text-xs font-semibold text-ink/50">Answer</h2>
          <RichText html={flashcard.answer} />
        </section>
      </div>
    </Dialog>
  );
}
