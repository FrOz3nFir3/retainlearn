// The editor's flashcards (the prototype's FlashcardsTab): a list to search, each flashcard with its recall points, its
// quiz questions (a link to them in the next tab) and any changes to it waiting for review, and its actions: edit, add
// a quiz question linked to it, move it up or down, delete it. A guest can open each one to read it.
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { StudySetContent } from "@retainlearn/core";
import { problemOf } from "#api/problem.ts";
import { Button } from "#components/ui/Button.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { Confirm } from "#components/ui/Confirm.tsx";
import { Empty } from "#components/ui/Empty.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { IconButton } from "#components/ui/IconButton.tsx";
import { SearchInput } from "#components/ui/SearchInput.tsx";
import { MIN_POINTS, recallPoints } from "#features/classes/recallPoints.ts";
import { textOf } from "#utils/safeHtml.ts";
import { FlashcardDialog } from "./FlashcardDialog.tsx";
import { QuestionDialog } from "./QuestionDialog.tsx";
import { useSaveStudySetMutation } from "./editorApi.ts";
import type { SetChange, Suggestion } from "./editorApi.ts";
import { clip, plural, savedNotice } from "./shared.ts";
import type { Access, Notice } from "./shared.ts";

type Props = { set: StudySetContent; access: Access; suggestions: Suggestion[]; onNotice: (notice: Notice) => void };
type Flashcard = StudySetContent["flashcards"][number];
type Row = { flashcard: Flashcard; index: number; question: string; answer: string; points: number; questions: number; pending: number };

export function FlashcardsTab({ set, access, suggestions, onNotice }: Props) {
  const [, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<{ flashcard: Flashcard | null; index: number } | null>(null);
  const [addingQuestion, setAddingQuestion] = useState<string | null>(null); // the flashcard it's linked to
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [save] = useSaveStudySetMutation();

  const rows = useMemo<Row[]>(
    () =>
      set.flashcards.map((flashcard, index) => ({
        flashcard,
        index,
        question: textOf(flashcard.question),
        answer: textOf(flashcard.answer),
        points: recallPoints(flashcard.answer).length,
        questions: set.questions.filter((q) => q.flashcardId === flashcard._id).length,
        pending: suggestions.filter((s) => s.targetId === flashcard._id).length,
      })),
    [set, suggestions],
  );
  const needle = query.trim().toLocaleLowerCase();
  const shown = needle ? rows.filter((r) => `${r.question} ${r.answer}`.toLocaleLowerCase().includes(needle)) : rows;
  const points = rows.reduce((n, r) => n + (r.points >= MIN_POINTS ? r.points : 0), 0);
  const unasked = rows.filter((r) => !r.questions).length;
  const canEdit = access !== "guest";

  const run = async (change: SetChange, done: string, suggested: string) => {
    try {
      const result = await save({ setId: set._id, change }).unwrap();
      onNotice(savedNotice(result.suggested, done, suggested));
    } catch (error) {
      onNotice({ text: problemOf(error, "That didn't save. Check your connection and try again."), tone: "rose" });
    }
  };
  const move = (r: Row, to: number) => {
    const ids = set.flashcards.map((f) => f._id);
    ids.splice(r.index, 1);
    ids.splice(to, 0, r.flashcard._id);
    void run({ reorderFlashcards: ids }, `Moved flashcard ${r.index + 1} to position ${to + 1}.`, `Suggested moving flashcard ${r.index + 1} to position ${to + 1}.`);
  };
  const remove = (r: Row) =>
    void run(
      { cardId: r.flashcard._id, deleteFlashcard: true },
      `Deleted flashcard ${r.index + 1}${r.questions ? ` and its ${plural(r.questions, "quiz question")}` : ""}.`,
      `Suggested deleting flashcard ${r.index + 1}.`,
    );
  const showQuestions = (r: Row) =>
    setParams((p) => {
      const next = new URLSearchParams(p);
      next.set("view", "questions");
      next.set("flashcard", r.flashcard._id);
      return next;
    });

  const create = canEdit && (
    <Button tone="primary" icon="plus" onClick={() => setEditing({ flashcard: null, index: set.flashcards.length })}>
      {access === "editor" ? "New flashcard" : "Suggest a flashcard"}
    </Button>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput label="Search the flashcards" value={query} onChange={setQuery} placeholder="Search questions and answers" className="sm:flex-1" />
        {create}
      </div>
      {rows.length > 0 && (
        <p className="text-xs text-ink/55">
          {plural(rows.length, "flashcard")}, {plural(points, "recall point")}.
          {unasked > 0 && ` ${unasked} without quiz questions, so they can't become player cards.`}
          {needle && ` ${shown.length} match "${query.trim()}".`}
        </p>
      )}

      {!rows.length && (
        <Empty
          icon="review"
          title="No flashcards yet"
          body="Add the first one. Long answers are fine: bullets that start with a bold label become recall points, reviewed one at a time."
          action={create || undefined}
        />
      )}
      {rows.length > 0 && !shown.length && <Empty icon="search" title={`No flashcards match "${query.trim()}"`} body="The search looks at the text of the questions and answers." />}

      <ul className="space-y-2">
        {shown.map((r) => (
          <li key={r.flashcard._id} className="rounded-2xl border border-ink/[0.07] bg-surface p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="flex min-w-0 flex-1 gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-sm font-bold text-brand tabular-nums">{r.index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold">{r.question || "No question yet"}</p>
                  <p className="mt-0.5 line-clamp-2 text-[13px] text-ink/55">{r.answer || "No answer yet"}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Chip tone={r.points >= MIN_POINTS ? "brand" : "neutral"}>{r.points >= MIN_POINTS ? plural(r.points, "recall point") : "Reviewed as one card"}</Chip>
                    {r.questions > 0 ? (
                      <button type="button" onClick={() => showQuestions(r)} className="cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-brand">
                        <Chip className="hover:bg-ink/10">
                          {plural(r.questions, "quiz question")} <Icon name="chevronRight" className="size-3" />
                        </Chip>
                      </button>
                    ) : (
                      <Chip tone="cold">No quiz questions yet</Chip>
                    )}
                    {r.pending > 0 && <Chip tone="bell">{plural(r.pending, "change")} waiting for review</Chip>}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1 self-end sm:self-start">
                <Button size="sm" icon={canEdit ? "edit" : "eye"} onClick={() => setEditing({ flashcard: r.flashcard, index: r.index })}>
                  {canEdit ? "Edit" : "View"}
                  <span className="sr-only"> flashcard {r.index + 1}</span>
                </Button>
                {canEdit && (
                  <>
                    <Button size="sm" icon="plus" onClick={() => setAddingQuestion(r.flashcard._id)} aria-label={`Add a quiz question linked to flashcard ${r.index + 1}`}>
                      Question
                    </Button>
                    <IconButton icon="chevronUp" label={`Move flashcard ${r.index + 1} up`} size="sm" disabled={r.index === 0} onClick={() => move(r, r.index - 1)} />
                    <IconButton icon="chevronDown" label={`Move flashcard ${r.index + 1} down`} size="sm" disabled={r.index === rows.length - 1} onClick={() => move(r, r.index + 1)} />
                    <IconButton icon="trash" label={`Delete flashcard ${r.index + 1}`} size="sm" onClick={() => setDeleting(r)} className="hover:bg-rose-wash hover:text-rose-ink" />
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {editing && (
        <FlashcardDialog setId={set._id} eyebrow={set.subtopic} flashcard={editing.flashcard} index={editing.index} access={access} onClose={() => setEditing(null)} onSaved={onNotice} />
      )}
      {addingQuestion && access !== "guest" && (
        <QuestionDialog set={set} question={null} index={set.questions.length} linkTo={addingQuestion} access={access} onClose={() => setAddingQuestion(null)} onSaved={onNotice} />
      )}
      {deleting && (
        <Confirm
          title={access === "editor" ? `Delete flashcard ${deleting.index + 1}?` : `Suggest deleting flashcard ${deleting.index + 1}?`}
          tone={access === "editor" ? "danger" : "primary"}
          confirmLabel={access === "editor" ? "Delete" : "Suggest deleting it"}
          onConfirm={() => remove(deleting)}
          onClose={() => setDeleting(null)}
          body={
            <>
              <p className="font-semibold text-ink">"{clip(deleting.question, 140)}"</p>
              {access === "editor" ? (
                <p className="mt-2">
                  {deleting.questions ? `Its ${plural(deleting.questions, "linked quiz question")} ${deleting.questions === 1 ? "goes" : "go"} too. ` : ""}This can't be undone.
                </p>
              ) : (
                <p className="mt-2">A reviewer decides.{deleting.questions ? ` If they accept, its ${plural(deleting.questions, "linked quiz question")} ${deleting.questions === 1 ? "goes" : "go"} too.` : ""}</p>
              )}
            </>
          }
        />
      )}
    </div>
  );
}
