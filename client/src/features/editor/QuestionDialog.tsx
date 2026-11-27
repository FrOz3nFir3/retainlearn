// A quiz question in a dialog, new or saved (the prototype's QuizEditor): the question, its correct answer, the wrong
// options (one to seven; a class shows the answer with up to three of them, shuffled), and the flashcard that teaches
// it. The set's editors save it; anyone else signed in suggests the change. A guest sees it, with a way to sign in.
import { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { StudySetContent } from "@retainlearn/core";
import { problemOf } from "#api/problem.ts";
import { Button, buttonClass } from "#components/ui/Button.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { Dialog } from "#components/ui/Dialog.tsx";
import { Field } from "#components/ui/Field.tsx";
import { IconButton } from "#components/ui/IconButton.tsx";
import { PickList } from "#components/ui/PickList.tsx";
import { RichEditor, RichField } from "#components/ui/RichEditor.tsx";
import { RichText } from "#components/ui/RichText.tsx";
import { useSaveStudySetMutation } from "./editorApi.ts";
import type { SetChange } from "./editorApi.ts";
import { SAVE_LABEL, flashcardOptions, isBlank, plural, sameText, savedNotice } from "./shared.ts";
import type { Access, Notice } from "./shared.ts";

const MAX_WRONG = 7;
type Question = StudySetContent["questions"][number];
type Props = {
  set: StudySetContent;
  question: Question | null;
  index: number;
  linkTo?: string | null; // a new question added from a flashcard is linked to it
  access: Access;
  onClose: () => void;
  onSaved: (notice: Notice) => void;
};

export function QuestionDialog({ access, question, ...rest }: Props) {
  if (access === "guest") return question ? <QuestionView question={question} {...rest} /> : null;
  return <QuestionForm access={access} question={question} {...rest} />;
}

type Option = { key: string; html: string; changed: boolean };
let added = 0;

function QuestionForm({ set, question, index, linkTo, access, onClose, onSaved }: Props & { access: Exclude<Access, "guest"> }) {
  const exists = (id: string | null | undefined) => !!id && set.flashcards.some((f) => f._id === id);
  const [text, setText] = useState({ html: question?.question ?? "", changed: false });
  const [answer, setAnswer] = useState({ html: question?.answer ?? "", changed: false });
  const original = useRef<Option[]>((question?.wrongAnswers ?? []).map((html, i) => ({ key: `saved-${i}`, html, changed: false })));
  const [options, setOptions] = useState<Option[]>(() => (question ? original.current : [0, 1, 2].map(() => ({ key: `new-${added++}`, html: "", changed: false }))));
  const savedLink = question?.flashcardId ?? null;
  const [link, setLink] = useState<string>(() => [savedLink, linkTo].find(exists) ?? "");
  const [tried, setTried] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [save, saving] = useSaveStudySetMutation();

  const optionErrors = options.map((o, i) => {
    if (isBlank(o.html)) return "Write this option, or remove it.";
    if (!isBlank(answer.html) && sameText(o.html, answer.html)) return "It's the same as the correct answer.";
    if (options.some((p, j) => j < i && !isBlank(p.html) && sameText(p.html, o.html))) return "It's the same as another option.";
    return null;
  });
  const errors = { question: isBlank(text.html) ? "Add a question." : null, answer: isBlank(answer.html) ? "Add the correct answer." : null };
  const valid = !errors.question && !errors.answer && optionErrors.every((e) => !e);
  const optionsChanged =
    options.length !== original.current.length || options.some((o, i) => o.changed || o.key !== original.current[i]?.key);
  const linkChanged = (link || null) !== savedLink;
  const changed = question ? text.changed || answer.changed || optionsChanged || linkChanged : !isBlank(text.html) || !isBlank(answer.html) || options.some((o) => !isBlank(o.html));
  const linkedTo = set.flashcards.findIndex((f) => f._id === linkTo);
  const what = question ? `quiz question ${index + 1}` : linkedTo >= 0 ? `a new quiz question for flashcard ${linkedTo + 1}` : "a new quiz question";
  const title = question ? `Edit quiz question ${index + 1}` : access === "editor" ? "New quiz question" : "Suggest a quiz question";

  const submit = async () => {
    setTried(true);
    if (!valid || !changed) return;
    const change: SetChange = question
      ? {
          quizId: question._id,
          ...(text.changed ? { quizQuestion: text.html } : {}),
          ...(answer.changed ? { quizAnswer: answer.html } : {}),
          ...(optionsChanged ? { options: options.map((o) => o.html) } : {}),
          ...(linkChanged ? { cardId: link || null } : {}),
        }
      : { quizQuestion: text.html, quizAnswer: answer.html, options: options.map((o) => o.html), cardId: link || null };
    try {
      const { suggested } = await save({ setId: set._id, change }).unwrap();
      onSaved(savedNotice(suggested, `Saved ${what}.`, `Suggestion for ${what} sent.`));
      onClose();
    } catch (error) {
      setProblem(problemOf(error, "That didn't save. Check your connection and try again."));
    }
  };
  const updateOption = (key: string, html: string, changed: boolean) => setOptions((list) => list.map((o) => (o.key === key ? { ...o, html, changed } : o)));

  return (
    <Dialog
      title={title}
      eyebrow={set.subtopic}
      onClose={onClose}
      wide
      footer={
        <>
          <span className="mr-auto self-center text-xs text-ink/50">
            {question && !changed ? "No changes yet" : `Learners see the answer and up to ${Math.min(3, options.length)} wrong ${options.length === 1 ? "option" : "options"}, shuffled`}
          </span>
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
        <RichField label="Question" value={text.html} onChange={(html, c) => setText({ html, changed: c })} error={tried ? errors.question : null} placeholder="Ask one clear thing" className="min-h-16" />
        <RichField
          label="Correct answer"
          value={answer.html}
          onChange={(html, c) => setAnswer({ html, changed: c })}
          error={tried ? errors.answer : null}
          hint="Keep it short: it sits next to the wrong options."
          placeholder="The right answer"
          compact
          className="min-h-11"
        />
        <fieldset className="space-y-2">
          <legend className="mb-1.5 text-sm font-semibold">Wrong options</legend>
          {options.map((o, i) => (
            <div key={o.key}>
              <div className="flex items-start gap-2">
                <span aria-hidden="true" className="mt-11 grid size-6 shrink-0 place-items-center rounded-md bg-ink/[0.06] text-xs font-bold text-ink/55">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <RichEditor
                    label={`Wrong option ${i + 1}`}
                    value={o.html}
                    onChange={(html, c) => updateOption(o.key, html, c)}
                    invalid={tried && !!optionErrors[i]}
                    placeholder="A believable wrong answer"
                    compact
                    className="min-h-10"
                  />
                </div>
                <IconButton
                  icon="x"
                  label={`Remove wrong option ${i + 1}`}
                  size="sm"
                  className="mt-10"
                  disabled={options.length <= 1}
                  onClick={() => setOptions((list) => list.filter((x) => x.key !== o.key))}
                />
              </div>
              {tried && optionErrors[i] && <p className="mt-1 ml-8 text-xs font-medium text-rose-ink">{optionErrors[i]}</p>}
            </div>
          ))}
          <Button size="sm" icon="plus" disabled={options.length >= MAX_WRONG} onClick={() => setOptions((list) => [...list, { key: `new-${added++}`, html: "", changed: false }])}>
            Add a wrong option
          </Button>
        </fieldset>
        <Field label="The flashcard that teaches it" hint="Type a word from it, or its number, to find it. Learners who miss the question read this flashcard's answer, and the question comes up with it in rounds.">
          {({ id, describedBy }) => <PickList id={id} aria-describedby={describedBy} value={link} onChange={setLink} options={flashcardOptions(set.flashcards, [{ value: "", label: "Not linked" }])} />}
        </Field>
      </div>
    </Dialog>
  );
}

function QuestionView({ set, question, index, onClose }: Omit<Props, "access" | "question"> & { question: Question }) {
  const location = useLocation();
  const linked = set.flashcards.findIndex((f) => f._id === question.flashcardId);
  return (
    <Dialog
      title={`Quiz question ${index + 1}`}
      eyebrow={set.subtopic}
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
        <RichText html={question.question} />
        <ul className="space-y-1.5">
          <li className="rounded-xl border border-mint bg-mint-wash px-3 py-2">
            <span className="sr-only">Correct answer: </span>
            <RichText html={question.answer} className="!text-sm" />
          </li>
          {question.wrongAnswers.map((html, i) => (
            <li key={i} className="rounded-xl border border-ink/10 px-3 py-2">
              <span className="sr-only">Wrong option: </span>
              <RichText html={html} className="!text-sm" />
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-1.5">
          {linked >= 0 ? <Chip tone="brand">Linked to flashcard {linked + 1}</Chip> : <Chip tone="cold">Not linked to a flashcard</Chip>}
          <Chip>{plural(question.wrongAnswers.length + 1, "option")}</Chip>
        </div>
      </div>
    </Dialog>
  );
}
