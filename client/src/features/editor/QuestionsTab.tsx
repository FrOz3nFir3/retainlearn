// The editor's quiz questions (the prototype's QuizzesTab): a list to search and to narrow to one flashcard's questions
// (in the address, ?flashcard=, so a flashcard's count of questions links here), each with its correct answer, how many
// options it has, the flashcard it's linked to and any changes to it waiting for review; and its actions: edit, move up
// or down, delete. A guest can open each one to read it.
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { StudySetContent } from "@retainlearn/core";
import { problemOf } from "#api/problem.ts";
import { Button } from "#components/ui/Button.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { Confirm } from "#components/ui/Confirm.tsx";
import { Empty } from "#components/ui/Empty.tsx";
import { inputClass } from "#components/ui/Field.tsx";
import { IconButton } from "#components/ui/IconButton.tsx";
import { SearchInput } from "#components/ui/SearchInput.tsx";
import { cx } from "#utils/cx.ts";
import { textOf } from "#utils/safeHtml.ts";
import { QuestionDialog } from "./QuestionDialog.tsx";
import { useSaveStudySetMutation } from "./editorApi.ts";
import type { SetChange, Suggestion } from "./editorApi.ts";
import { clip, plural, savedNotice } from "./shared.ts";
import type { Access, Notice } from "./shared.ts";

type Props = { set: StudySetContent; access: Access; suggestions: Suggestion[]; onNotice: (notice: Notice) => void };
type Question = StudySetContent["questions"][number];
type Row = { question: Question; index: number; text: string; answer: string; search: string; linked: number; pending: number };

export function QuestionsTab({ set, access, suggestions, onNotice }: Props) {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<{ question: Question | null; index: number; linkTo: string | null } | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [save] = useSaveStudySetMutation();

  // ?flashcard=: one flashcard's questions, or "none" for the ones linked to no flashcard.
  const raw = params.get("flashcard") ?? "all";
  const filter = raw === "none" || set.flashcards.some((f) => f._id === raw) ? raw : "all";
  const setFilter = (value: string) =>
    setParams(
      (p) => {
        const next = new URLSearchParams(p);
        if (value === "all") next.delete("flashcard");
        else next.set("flashcard", value);
        return next;
      },
      { replace: true },
    );

  const rows = useMemo<Row[]>(
    () =>
      set.questions.map((question, index) => {
        const text = textOf(question.question);
        const answer = textOf(question.answer);
        return {
          question,
          index,
          text,
          answer,
          search: `${text} ${answer} ${question.wrongAnswers.map(textOf).join(" ")}`.toLocaleLowerCase(),
          linked: set.flashcards.findIndex((f) => f._id === question.flashcardId),
          pending: suggestions.filter((s) => s.targetId === question._id).length,
        };
      }),
    [set, suggestions],
  );
  const needle = query.trim().toLocaleLowerCase();
  const passes = (r: Row) => filter === "all" || (filter === "none" ? !r.question.flashcardId : r.question.flashcardId === filter);
  const shown = rows.filter((r) => (!needle || r.search.includes(needle)) && passes(r));
  const canEdit = access !== "guest";
  const filteredTo = filter !== "all" && filter !== "none" ? filter : null;

  const run = async (change: SetChange, done: string, suggested: string) => {
    try {
      const result = await save({ setId: set._id, change }).unwrap();
      onNotice(savedNotice(result.suggested, done, suggested));
    } catch (error) {
      onNotice({ text: problemOf(error, "That didn't save. Check your connection and try again."), tone: "rose" });
    }
  };
  const move = (r: Row, to: number) => {
    const ids = set.questions.map((q) => q._id);
    ids.splice(r.index, 1);
    ids.splice(to, 0, r.question._id);
    void run({ reorderQuizzes: ids }, `Moved quiz question ${r.index + 1} to position ${to + 1}.`, `Suggested moving quiz question ${r.index + 1} to position ${to + 1}.`);
  };

  const create = canEdit && (
    <Button tone="primary" icon="plus" onClick={() => setEditing({ question: null, index: set.questions.length, linkTo: filteredTo })}>
      {access === "editor" ? "New quiz question" : "Suggest a quiz question"}
    </Button>
  );

  const unlinked = rows.filter((r) => r.linked < 0).length;

  return (
    <div className="space-y-3">
      {unlinked > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl bg-orange-wash px-4 py-3 text-sm sm:flex-row sm:items-center">
          <p className="min-w-0 flex-1 text-orange-ink">
            <span className="font-semibold">{unlinked === 1 ? "1 quiz question isn't" : `${unlinked} quiz questions aren't`} linked to a flashcard.</span> People who miss {unlinked === 1 ? "it" : "them"} get nothing to
            read: link the flashcard that teaches {unlinked === 1 ? "it" : "each one"}.
          </p>
          {filter !== "none" && (
            <Button size="sm" onClick={() => setFilter("none")}>
              Show {unlinked === 1 ? "it" : "them"}
            </Button>
          )}
        </div>
      )}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <SearchInput label="Search the quiz questions" value={query} onChange={setQuery} placeholder="Search questions, answers and options" className="lg:flex-1" />
        <label className="flex items-center gap-2 text-sm">
          <span className="shrink-0 text-ink/55">Flashcard</span>
          <select aria-label="Flashcard" value={filter} onChange={(e) => setFilter(e.target.value)} className={cx(inputClass, "lg:w-60")}>
            <option value="all">All quiz questions</option>
            <option value="none">Not linked to a flashcard</option>
            {set.flashcards.map((f, i) => (
              <option key={f._id} value={f._id}>
                {`Flashcard ${i + 1}: ${clip(textOf(f.question), 70)}`}
              </option>
            ))}
          </select>
        </label>
        {create}
      </div>
      {rows.length > 0 && (
        <p className="text-xs text-ink/55">
          {plural(rows.length, "quiz question")}, {rows.filter((r) => r.linked >= 0).length} linked to a flashcard.
          {(needle || filter !== "all") && ` Showing ${shown.length}.`}
          {filteredTo && canEdit && " A new question you add now is linked to this flashcard."}
        </p>
      )}

      {!rows.length && (
        <Empty
          icon="quiz"
          title="No quiz questions yet"
          body="Quiz questions are what learners collect as player cards. Link each one to the flashcard that teaches it."
          action={create || undefined}
        />
      )}
      {rows.length > 0 && !shown.length && <Empty icon="search" title="No quiz questions match" body="Try another search, or another flashcard." />}

      <ul className="space-y-2">
        {shown.map((r) => (
          <li key={r.question._id} className="rounded-2xl border border-ink/[0.07] bg-surface p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="flex min-w-0 flex-1 gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-bell-wash text-sm font-bold text-bell-ink tabular-nums">{r.index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold">{r.text || "No question yet"}</p>
                  <p className="mt-0.5 line-clamp-1 text-[13px] text-mint-ink">
                    <span className="font-semibold">Answer:</span> {r.answer}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Chip>{plural(r.question.wrongAnswers.length + 1, "option")}</Chip>
                    {r.linked >= 0 ? (
                      <Chip tone="brand">Linked to flashcard {r.linked + 1}</Chip>
                    ) : r.question.flashcardId ? (
                      <Chip tone="rose">Its flashcard is gone</Chip>
                    ) : (
                      <Chip tone="cold">Not linked</Chip>
                    )}
                    {r.pending > 0 && <Chip tone="bell">{plural(r.pending, "change")} waiting for review</Chip>}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1 self-end sm:self-start">
                <Button size="sm" icon={canEdit ? "edit" : "eye"} onClick={() => setEditing({ question: r.question, index: r.index, linkTo: null })}>
                  {canEdit ? "Edit" : "View"}
                  <span className="sr-only"> quiz question {r.index + 1}</span>
                </Button>
                {canEdit && (
                  <>
                    <IconButton icon="chevronUp" label={`Move quiz question ${r.index + 1} up`} size="sm" disabled={r.index === 0} onClick={() => move(r, r.index - 1)} />
                    <IconButton icon="chevronDown" label={`Move quiz question ${r.index + 1} down`} size="sm" disabled={r.index === rows.length - 1} onClick={() => move(r, r.index + 1)} />
                    <IconButton icon="trash" label={`Delete quiz question ${r.index + 1}`} size="sm" onClick={() => setDeleting(r)} className="hover:bg-rose-wash hover:text-rose-ink" />
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {editing && (
        <QuestionDialog set={set} question={editing.question} index={editing.index} linkTo={editing.linkTo} access={access} onClose={() => setEditing(null)} onSaved={onNotice} />
      )}
      {deleting && (
        <Confirm
          title={access === "editor" ? `Delete quiz question ${deleting.index + 1}?` : `Suggest deleting quiz question ${deleting.index + 1}?`}
          tone={access === "editor" ? "danger" : "primary"}
          confirmLabel={access === "editor" ? "Delete" : "Suggest deleting it"}
          onConfirm={() =>
            void run({ quizId: deleting.question._id, deleteQuiz: true }, `Deleted quiz question ${deleting.index + 1}.`, `Suggested deleting quiz question ${deleting.index + 1}.`)
          }
          onClose={() => setDeleting(null)}
          body={
            <>
              <p className="font-semibold text-ink">"{clip(deleting.text, 140)}"</p>
              <p className="mt-2">
                {access === "editor" ? "It leaves the quizzes for everyone. This can't be undone." : "A reviewer decides whether to delete it."}
              </p>
            </>
          }
        />
      )}
    </div>
  );
}
