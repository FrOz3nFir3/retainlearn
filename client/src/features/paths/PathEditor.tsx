// The path editor (/paths/new and /paths/:id/edit, the prototype's PathEditor): a path's title, subject, description,
// who can see it, its final exam, and its steps in order, each a whole study set or flashcards picked from one. Its
// author and editors save it; anyone else signed in suggests changes (or copies it), and its editors decide. A page of
// its own, never over the world. Leaving with changes not saved asks first (any way out: the router's blocker, and the
// browser's for a reload or a closed tab). Errors show once you've tried to save, the first problem focused
// (guide: required-field-feedback); a step's own problems (its set gone, nothing left in it) show at once.
import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Link, useBlocker, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query";
import { PATH_LIMITS, PathContent, checkStep, cleanStep, pathChanges, stepItems } from "@retainlearn/core";
import type { PathStep, PathVersion, PathView, StepSet, StudySetContent } from "@retainlearn/core";
import { problemOf } from "#api/problem.ts";
import { useAppDispatch } from "#app/hooks.ts";
import { useSession } from "#app/session.ts";
import { Avatar } from "#components/ui/Avatar.tsx";
import { Button, buttonClass } from "#components/ui/Button.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { Confirm } from "#components/ui/Confirm.tsx";
import { Dialog } from "#components/ui/Dialog.tsx";
import { Empty } from "#components/ui/Empty.tsx";
import { Field, inputClass } from "#components/ui/Field.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { IconButton } from "#components/ui/IconButton.tsx";
import { Page } from "#components/ui/Page.tsx";
import { PickList } from "#components/ui/PickList.tsx";
import { SearchInput } from "#components/ui/SearchInput.tsx";
import { toast } from "#components/ui/Toast.tsx";
import { useGetStudySetQuery } from "#features/classroom/classroomApi.ts";
import { subjectsApi, useGetSubjectQuery } from "#features/subjects/subjectsApi.ts";
import { textOf } from "#utils/safeHtml.ts";
import { cx } from "#utils/cx.ts";
import { pathPath } from "./pathView.ts";
import { PATH_WIDTH } from "./PathSkeleton.tsx";
import { EDITOR_FIELDS, EDITOR_FOOTER, PathEditorSkeleton } from "./PathEditorSkeleton.tsx";
import {
  useAddEditorMutation,
  useCopyPathMutation,
  useCreatePathMutation,
  useDeletePathMutation,
  useGetPathQuery,
  useRemoveEditorMutation,
  useSavePathMutation,
  useSuggestMutation,
} from "./pathsApi.ts";

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en")} ${n === 1 ? one : many}`;
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

const blank = (category: string): PathVersion => ({ title: "", category, description: "", visibility: "public", exam: true, steps: [] });
const draftOf = (view: PathView): PathVersion => ({
  title: view.title,
  category: view.category,
  description: view.description,
  visibility: view.visibility,
  exam: view.exam,
  steps: view.steps.map(({ id, setId, flashcardIds, title }) => ({ id, setId, flashcardIds, title })),
});
// A new step's id (core's StepId): kept as the path changes.
const newStepId = () => `s${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
// A set's content as the rules take it (StepSet).
const stepSetOf = (set: StudySetContent): StepSet => ({
  _id: set._id,
  title: set.subtopic,
  topic: set.topic,
  category: set.category,
  flashcards: set.flashcards.map((f) => ({ _id: f._id })),
  questions: set.questions.map((q) => ({ _id: q._id, flashcardId: q.flashcardId })),
});
// Picked flashcards no longer in their set.
const droppedOf = (step: PathStep, set: StepSet | undefined) => (set && step.flashcardIds ? step.flashcardIds.length - (cleanStep(step, set).flashcardIds?.length ?? 0) : 0);

// What's wrong with the draft: its fields (Zod, core's PathContent), and each step against its set (core's checkStep).
type Problems = { title?: string; category?: string; description?: string; steps?: string; step: Record<string, string> };
function problemsOf(draft: PathVersion, sets: ReadonlyMap<string, StepSet>): Problems {
  const out: Problems = { step: {} };
  const parsed = PathContent.safeParse(draft);
  for (const issue of parsed.success ? [] : parsed.error.issues) {
    const [field, i] = issue.path;
    if (field === "title") out.title ??= issue.message;
    else if (field === "category") out.category ??= "Choose a subject.";
    else if (field === "description") out.description ??= issue.message;
    else if (field === "steps" && typeof i === "number") {
      const id = draft.steps[i]?.id;
      if (id) out.step[id] ??= issue.message;
    } else if (field === "steps") out.steps ??= issue.message;
  }
  for (const step of draft.steps) {
    const set = sets.get(step.setId);
    const check = checkStep(step, set, draft.category);
    if (check === "gone") out.step[step.id] = "Its study set no longer exists. Remove this step.";
    else if (check === "empty") out.step[step.id] = step.flashcardIds ? "None of its flashcards exist any more. Pick some or remove the step." : "This study set has nothing in it yet.";
    else if (check === "elsewhere" && set) out.step[step.id] = `This set is in ${set.category}, not ${draft.category}.`;
  }
  return out;
}
const countOf = (p: Problems) => [p.title, p.category, p.description, p.steps].filter(Boolean).length + Object.keys(p.step).length;

// Every subject with something to study (for the Subject field), a page of the subjects list at a time.
function useSubjectNames(): string[] | null {
  const dispatch = useAppDispatch();
  const [names, setNames] = useState<string[] | null>(null);
  useEffect(() => {
    let live = true;
    void (async () => {
      const out: string[] = [];
      for (let page = 1; page <= 50; page++) {
        const read = dispatch(subjectsApi.endpoints.getSubjects.initiate({ search: "", page }));
        try {
          const data = await read.unwrap();
          out.push(...data.subjects.filter((s) => s.flashcards + s.questions > 0).map((s) => s.name));
          if (page >= data.pages) break;
        } finally {
          read.unsubscribe();
        }
      }
      if (live) setNames(out.toSorted((a, b) => a.localeCompare(b)));
    })().catch(() => live && setNames([]));
    return () => {
      live = false;
    };
  }, [dispatch]);
  return names;
}

export default function PathEditor() {
  const { id } = useParams();
  const session = useSession();
  const path = useGetPathQuery(id && session === "in" ? id : skipToken);
  const back = id ? pathPath(id) : "/paths";
  if (session === "out") {
    return (
      <Page title={id ? "Edit path" : "New path"} eyebrow="Skill path" back={back} width={PATH_WIDTH} noindex>
        <Empty
          icon="lock"
          title="Sign in to make paths"
          body="Anyone with an account can build a path from study sets, or copy someone else's and change it."
          action={
            <Link to="/sign-in" state={{ returnTo: id ? `/paths/${id}/edit` : "/paths/new" }} className={buttonClass("primary")}>
              Sign in
            </Link>
          }
        />
      </Page>
    );
  }
  if (id && path.isError) {
    return (
      <Page title="Path not found" back="/paths" width={PATH_WIDTH} noindex>
        <Empty icon="path" title="This path doesn't exist" body="It may have been deleted, or it's private." action={<Link to="/paths" className={buttonClass("primary")}>All paths</Link>} />
      </Page>
    );
  }
  if (session === "checking" || (id && !path.data)) return <PathEditorSkeleton />;
  const view = path.data ?? null;
  const mode = view && !view.you?.canEdit ? "suggest" : "edit";
  return <Form key={`${view?._id ?? "new"}-${mode}`} view={view} mode={mode} />;
}

function Form({ view, mode }: { view: PathView | null; mode: "edit" | "suggest" }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const subjects = useSubjectNames();
  const [initial] = useState<PathVersion>(() => (view ? draftOf(view) : blank(params.get("subject") ?? "")));
  const [draft, setDraft] = useState(initial);
  const [sets, setSets] = useState(() => new Map((view?.steps ?? []).flatMap((s) => (s.set ? [[s.set._id, s.set] as const] : []))));
  const [tried, setTried] = useState(false);
  const [picker, setPicker] = useState<{ index: number | null } | null>(null);
  const [confirm, setConfirm] = useState<"delete" | { remove: number } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const leaving = useRef(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const [create, creating] = useCreatePathMutation();
  const [save, saving] = useSavePathMutation();
  const [suggest, sending] = useSuggestMutation();
  const [copy] = useCopyPathMutation();
  const [remove] = useDeletePathMutation();

  const suggesting = mode === "suggest";
  const back = view ? pathPath(view._id) : "/paths";
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  // Picked flashcards deleted since the last save: saving tidies them out, so Save stays on.
  const cleanup = !suggesting && draft.steps.some((s) => droppedOf(s, sets.get(s.setId)) > 0);
  const problems = problemsOf(draft, sets);
  const count = countOf(problems);
  const busy = creating.isLoading || saving.isLoading || sending.isLoading;
  const preview = useMemo(() => (suggesting && view && dirty ? pathChanges(draftOf(view), { ...draft, visibility: view.visibility }, sets) : []), [suggesting, view, dirty, draft, sets]);
  const status = tried && count ? `Fix ${plural(count, "thing")} above to save.` : dirty ? "Unsaved changes" : cleanup ? "Save to tidy up deleted flashcards" : view ? "No changes yet" : "";

  // Leaving with changes not saved: a reload or a closed tab (the browser asks), and any way out in the app (asked here).
  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [dirty]);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !leaving.current && currentLocation.pathname !== nextLocation.pathname);
  const go = (to: string, replace = false) => {
    leaving.current = true;
    navigate(to, { replace });
  };

  const update = (fields: Partial<PathVersion>) => setDraft((d) => ({ ...d, ...fields }));
  const updateStep = (i: number, fields: Partial<PathStep>) => setDraft((d) => ({ ...d, steps: d.steps.map((s, j) => (j === i ? { ...s, ...fields } : s)) }));
  const move = (i: number, by: number) =>
    setDraft((d) => {
      const steps = [...d.steps];
      [steps[i], steps[i + by]] = [steps[i + by] as PathStep, steps[i] as PathStep];
      return { ...d, steps };
    });

  const submit = async () => {
    setTried(true);
    setFailure(null);
    if (count) {
      // The first problem, focused, so it's read out (guide: required-field-feedback).
      const first = problems.title ? titleRef.current : document.querySelector<HTMLElement>("[data-step-problem]");
      first?.focus();
      return;
    }
    const body: PathVersion = {
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
      steps: draft.steps.map((s) => cleanStep({ ...s, title: s.title.trim() }, sets.get(s.setId))),
    };
    try {
      if (view && suggesting) {
        await suggest({ id: view._id, path: body, version: view.version }).unwrap();
        toast(`Suggestion sent. @${view.author?.username ?? "Its author"} will review it`);
        go(pathPath(view._id));
      } else if (view) {
        await save({ id: view._id, path: body, version: view.version }).unwrap();
        toast("Path saved");
        go(pathPath(view._id));
      } else {
        const made = await create(body).unwrap();
        toast("Path created");
        go(pathPath(made._id));
      }
    } catch (error) {
      setFailure(problemOf(error, "The path wasn't saved. Check your connection, then try again."));
    }
  };
  const copyInstead = async () => {
    if (!view) return;
    try {
      const made = await copy(view._id).unwrap();
      toast("Copied to your paths. Only you can see it until you make it public");
      go(`/paths/${made._id}/edit`, true);
    } catch (error) {
      setFailure(problemOf(error, "The path wasn't copied. Check your connection, then try again."));
    }
  };
  const deleteIt = async () => {
    if (!view) return;
    try {
      await remove(view._id).unwrap();
      toast(`Deleted "${clip(view.title, 50)}"`);
      go("/paths");
    } catch (error) {
      setFailure(problemOf(error, "The path wasn't deleted. Check your connection, then try again."));
    }
  };

  const options = [...new Set([draft.category, ...(subjects ?? [])].filter(Boolean))].map((name) => ({ value: name, label: name }));
  return (
    <Page title={suggesting && view ? `Suggest changes: ${clip(view.title, 40)}` : view ? `Edit: ${clip(view.title, 50)}` : "New path"} eyebrow="Skill path" back={back} width={PATH_WIDTH} noindex>
      <div className="space-y-5">
        {suggesting && view && (
          <div className="flex items-start gap-3 rounded-2xl bg-brand/6 px-4 py-3 text-sm">
            <Icon name="users" className="mt-0.5 size-5 shrink-0 text-brand" />
            <p className="min-w-0 flex-1 text-ink/75">
              <span className="font-semibold text-ink">You're suggesting changes.</span>
              {` @${view.author?.username ?? "Its author"} and this path's editors review them, and nothing changes until they accept. `}
              <button type="button" onClick={() => void copyInstead()} className="cursor-pointer font-semibold text-brand hover:underline">
                Make your own copy instead
              </button>
            </p>
          </div>
        )}

        <section aria-label="The path" className={EDITOR_FIELDS}>
          <Field label="Title" error={tried ? problems.title : undefined} hint={`${draft.title.trim().length} of ${PATH_LIMITS.title} characters`}>
            {({ id, describedBy }) => (
              <input
                ref={titleRef}
                id={id}
                aria-describedby={describedBy}
                aria-invalid={tried && !!problems.title}
                className={inputClass}
                value={draft.title}
                maxLength={PATH_LIMITS.title}
                onChange={(e) => update({ title: e.target.value })}
                placeholder="For example: JavaScript in depth"
                // A new path starts with its title.
                autoFocus={!view}
              />
            )}
          </Field>
          <Field
            label="Subject"
            error={tried ? problems.category : undefined}
            hint={draft.steps.length ? "Steps come from this subject's study sets. Remove them all to switch subjects." : "Steps come from this subject's study sets."}
          >
            {({ id, describedBy }) => <PickList id={id} aria-describedby={describedBy} value={draft.category} options={options} onChange={(category) => update({ category })} disabled={draft.steps.length > 0} placeholder="Type to find a subject" />}
          </Field>
          <Field label="What it's for" error={tried ? problems.description : undefined} hint="Optional. One or two sentences on who it's for and what they'll be able to do.">
            {({ id, describedBy }) => (
              <textarea
                id={id}
                aria-describedby={describedBy}
                rows={2}
                className={inputClass}
                value={draft.description}
                maxLength={PATH_LIMITS.description}
                onChange={(e) => update({ description: e.target.value })}
                placeholder="From var, let and const to closures and async code."
              />
            )}
          </Field>
          {!suggesting && (!view || view.you?.isAuthor) && (
            <fieldset>
              <legend className="mb-1.5 text-sm font-semibold">Who can see it</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ["public", "Everyone", "Listed under Skill paths for anyone to follow."],
                    ["private", "Only me", "Yours to follow. Make it public any time."],
                  ] as const
                ).map(([value, label, hint]) => (
                  <label key={value} className={cx("flex cursor-pointer gap-2.5 rounded-xl border p-3 text-sm", draft.visibility === value ? "border-brand bg-brand/4" : "border-ink/10 hover:border-ink/25")}>
                    <input type="radio" name="visibility" className="mt-0.5 accent-brand" checked={draft.visibility === value} onChange={() => update({ visibility: value })} />
                    <span>
                      <span className="font-semibold">{label}</span>
                      <span className="block text-xs text-ink/55">{hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <label className="flex cursor-pointer gap-2.5 rounded-xl border border-ink/10 p-3 text-sm hover:border-ink/25">
            <input type="checkbox" className="mt-0.5 accent-brand" checked={draft.exam} onChange={(e) => update({ exam: e.target.checked })} />
            <span>
              <span className="font-semibold">End with a final exam</span>
              <span className="block text-xs text-ink/55">A match against Professor Quill on this path's questions, once the stadium opens. Until then, and without it, finishing every step earns the skill.</span>
            </span>
          </label>
        </section>

        <section aria-labelledby="editor-steps" className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 id="editor-steps" className="flex-1 font-display text-lg font-semibold">
              Steps <span className="text-sm font-normal text-ink/45">{draft.steps.length}</span>
            </h2>
            {draft.steps.length > 0 && (
              <Button tone="primary" icon="plus" onClick={() => setPicker({ index: null })}>
                Add step
              </Button>
            )}
          </div>
          {tried && problems.steps && <p className="text-xs font-medium text-rose-ink">{problems.steps}</p>}
          {draft.steps.length ? (
            <ol className="space-y-2">
              {draft.steps.map((step, i) => (
                <EditorStep
                  key={step.id}
                  step={step}
                  set={sets.get(step.setId)}
                  index={i}
                  count={draft.steps.length}
                  problem={problems.step[step.id]}
                  onRename={(title) => updateStep(i, { title })}
                  onMove={(by) => move(i, by)}
                  onPick={() => setPicker({ index: i })}
                  onRemove={() => setConfirm({ remove: i })}
                />
              ))}
            </ol>
          ) : (
            <Empty
              icon="path"
              title="No steps yet"
              body="Add study sets in the order to learn them. A step can be a whole set, or just some of its flashcards."
              action={
                <Button tone="primary" icon="plus" disabled={!draft.category} onClick={() => setPicker({ index: null })}>
                  Add the first step
                </Button>
              }
            />
          )}
        </section>

        {preview.length > 0 && (
          <section aria-labelledby="editor-preview" aria-live="polite" className="rounded-2xl border border-brand/20 bg-surface p-4">
            <h2 id="editor-preview" className="text-sm font-semibold">
              What you're suggesting
            </h2>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-ink/70">
              {preview.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        )}

        {!suggesting && view && <Editors view={view} />}

        <div className={EDITOR_FOOTER}>
          <p role={failure ? "alert" : "status"} className={cx("basis-full text-xs sm:order-2 sm:mr-auto sm:basis-auto", failure ? "font-medium text-rose-ink" : "text-ink/50")}>
            {failure ?? status}
          </p>
          {!suggesting && view?.you?.isAuthor && (
            <Button icon="trash" onClick={() => setConfirm("delete")} className="text-rose-ink hover:bg-rose-wash sm:order-1">
              Delete path
            </Button>
          )}
          <Button onClick={() => navigate(back)} className="ml-auto sm:order-3 sm:ml-0">
            Cancel
          </Button>
          <Button tone="primary" disabled={busy || (!!view && !dirty && !cleanup)} onClick={() => void submit()} className="sm:order-4">
            {busy ? "Saving…" : suggesting ? "Suggest changes" : view ? "Save path" : "Create path"}
          </Button>
        </div>
      </div>

      {picker && (
        <StepPicker
          category={draft.category}
          step={picker.index == null ? null : (draft.steps[picker.index] ?? null)}
          onClose={() => setPicker(null)}
          onDone={(fields, set) => {
            setSets((known) => new Map(known).set(set._id, set));
            if (picker.index == null) setDraft((d) => ({ ...d, steps: [...d.steps, { id: newStepId(), title: "", ...fields }] }));
            else updateStep(picker.index, fields);
            setPicker(null);
          }}
        />
      )}
      {blocker.state === "blocked" && (
        <Confirm
          title="Throw away your changes?"
          body={suggesting ? "You haven't sent your suggestion. Leaving now loses what you changed." : "You haven't saved this path. Leaving now loses what you changed."}
          confirmLabel="Discard changes"
          tone="danger"
          onConfirm={() => blocker.proceed()}
          onClose={() => blocker.reset()}
        />
      )}
      {confirm === "delete" && view && (
        <Confirm
          title={`Delete "${clip(view.title, 50)}"?`}
          body="People following it lose it from their timetable. Their study progress in the sets is kept. This can't be undone."
          confirmLabel="Delete path"
          tone="danger"
          onConfirm={() => void deleteIt()}
          onClose={() => setConfirm(null)}
        />
      )}
      {confirm && confirm !== "delete" && (
        <Confirm
          title={`Remove step ${confirm.remove + 1}?`}
          body="The study set itself stays as it is. You can add it again later."
          confirmLabel="Remove step"
          tone="danger"
          onConfirm={() => setDraft((d) => ({ ...d, steps: d.steps.filter((_, j) => j !== confirm.remove) }))}
          onClose={() => setConfirm(null)}
        />
      )}
    </Page>
  );
}

// A step in the editor: its number, its name (its set's, unless renamed), whole set or how many picked, its set and
// what it holds, and what's wrong with it; moved up or down, its flashcards chosen, or taken out.
type StepProps = {
  step: PathStep;
  set: StepSet | undefined;
  index: number;
  count: number;
  problem: string | undefined;
  onRename: (title: string) => void;
  onMove: (by: number) => void;
  onPick: () => void;
  onRemove: () => void;
};
function EditorStep({ step, set, index, count, problem, onRename, onMove, onPick, onRemove }: StepProps) {
  const items = set ? stepItems(step, set) : null;
  const dropped = droppedOf(step, set);
  const whole = step.flashcardIds == null;
  const problemId = `step-${step.id}-problem`;
  return (
    <li className={cx("rounded-2xl border bg-surface p-3 sm:p-4", problem ? "border-rose-ink/40" : "border-ink/[0.07]")}>
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-brand/10 text-sm font-bold text-brand tabular-nums">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <input
            aria-label={`Step ${index + 1} name`}
            aria-invalid={!!problem}
            aria-describedby={problem ? problemId : undefined}
            data-step-problem={problem ? "" : undefined}
            className={inputClass}
            value={step.title}
            maxLength={PATH_LIMITS.stepTitle}
            placeholder={set ? `${set.title} (rename if you like)` : "Removed study set"}
            onChange={(e) => onRename(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink/55">
            {set && items ? (
              <>
                <Chip tone={whole ? "brand" : "bell"}>{whole ? "Whole set" : `${items.flashcards.length} of ${plural(set.flashcards.length, "flashcard")}`}</Chip>
                <span className="min-w-0 truncate">{set.topic ? `${set.topic} › ${set.title}` : set.title}</span>
                <span>{`· ${whole ? `${plural(set.flashcards.length, "flashcard")}, ` : ""}${plural(items.questions.length, "quiz question")}`}</span>
              </>
            ) : (
              <Chip tone="rose">Study set removed</Chip>
            )}
            {dropped > 0 && <Chip tone="rose">{`${plural(dropped, "picked flashcard")} deleted since`}</Chip>}
          </div>
          {problem && (
            <p id={problemId} className="text-xs font-medium text-rose-ink">
              {problem}
            </p>
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-end gap-1.5">
        <Button size="sm" icon="arrowUp" aria-label={`Move up: step ${index + 1}`} disabled={index === 0} onClick={() => onMove(-1)}>
          Move up
        </Button>
        <Button size="sm" icon="arrowDown" aria-label={`Move down: step ${index + 1}`} disabled={index === count - 1} onClick={() => onMove(1)}>
          Move down
        </Button>
        {set && set.flashcards.length > 0 && (
          <Button size="sm" icon="cards" onClick={onPick}>
            Choose flashcards
          </Button>
        )}
        <IconButton icon="trash" label={`Remove step ${index + 1}`} size="sm" onClick={onRemove} className="hover:bg-rose-wash hover:text-rose-ink" />
      </div>
    </li>
  );
}

// Adding a step (choose one of the subject's study sets, then the whole set or some of its flashcards), or changing a
// step's flashcards. The flashcards: search by their question or their number, a run by its numbers, shift-click for a
// run, select all (or all shown), clear; each with how many quiz questions are linked to it (they come along).
type PickerProps = { category: string; step: PathStep | null; onClose: () => void; onDone: (fields: Pick<PathStep, "setId" | "flashcardIds">, set: StepSet) => void };
function StepPicker({ category, step, onClose, onDone }: PickerProps) {
  const subject = useGetSubjectQuery(step ? skipToken : category);
  const [setId, setSetId] = useState<string | null>(step?.setId ?? null);
  const content = useGetStudySetQuery(setId ?? skipToken);
  const [whole, setWhole] = useState(step ? step.flashcardIds == null : true);
  const [picked, setPicked] = useState(() => new Set(step?.flashcardIds ?? []));
  const [setSearch, setSetSearch] = useState("");
  const [query, setQuery] = useState("");
  const [anchor, setAnchor] = useState<string | null>(null);
  const [range, setRange] = useState({ from: "", to: "" });
  const [error, setError] = useState<string | null>(null);

  const set = setId ? (content.data ?? null) : null;
  const cards = useMemo(() => set?.flashcards ?? [], [set]);
  const rows = useMemo(() => cards.map((c, i) => ({ id: c._id, n: i + 1, text: textOf(c.question) })), [cards]);
  const needle = query.trim().toLowerCase();
  const shown = rows.filter((r) => !needle || r.text.toLowerCase().includes(needle) || String(r.n) === needle);
  const linked = useMemo(() => {
    const counts = new Map<string, number>();
    for (const q of set?.questions ?? []) if (q.flashcardId) counts.set(q.flashcardId, (counts.get(q.flashcardId) ?? 0) + 1);
    return counts;
  }, [set]);

  // A flashcard's row, clicked (its box, its text, or Space on its box): shift held, the run from the last one clicked.
  const toggle = (row: { id: string }, e: MouseEvent<HTMLLabelElement>) => {
    e.preventDefault(); // the box follows what's picked
    const on = !picked.has(row.id);
    const next = new Set(picked);
    const a = e.shiftKey && anchor ? shown.findIndex((r) => r.id === anchor) : -1;
    const b = shown.findIndex((r) => r.id === row.id);
    const span = a >= 0 ? shown.slice(Math.min(a, b), Math.max(a, b) + 1) : [row];
    for (const r of span) {
      if (on) next.add(r.id);
      else next.delete(r.id);
    }
    setPicked(next);
    setAnchor(row.id);
    setError(null);
  };
  const pickRange = () => {
    const from = Number(range.from);
    const to = Number(range.to);
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to > cards.length || from > to) {
      setError(`Use two numbers from 1 to ${cards.length}, the first no bigger than the second.`);
      return;
    }
    setPicked(new Set([...picked, ...cards.slice(from - 1, to).map((c) => c._id)]));
    setError(null);
  };
  const done = () => {
    if (!set) return;
    if (!whole && !picked.size) return setError("Pick at least one flashcard, or use the whole set.");
    onDone({ setId: set._id, flashcardIds: whole ? null : cards.filter((c) => picked.has(c._id)).map((c) => c._id) }, stepSetOf(set));
  };

  const sets = (subject.data?.sets ?? []).filter((s) => s.flashcards + s.questions > 0);
  const term = setSearch.trim().toLowerCase();
  const matching = sets.filter((s) => !term || `${s.topic} ${s.subtopic}`.toLowerCase().includes(term));
  return (
    <Dialog
      title={step ? "Choose flashcards" : setId ? "Add a step" : "Add a step: choose a study set"}
      eyebrow={set ? `${set.category} › ${set.topic} › ${set.subtopic}` : category}
      onClose={onClose}
      wide
      footer={
        setId && (
          <>
            {!step && (
              <Button
                icon="arrowLeft"
                className="mr-auto"
                onClick={() => {
                  setSetId(null);
                  setPicked(new Set());
                  setWhole(true);
                }}
              >
                Other set
              </Button>
            )}
            <Button onClick={onClose}>Cancel</Button>
            <Button tone="primary" disabled={!set} onClick={done}>
              {step ? "Update step" : "Add step"}
            </Button>
          </>
        )
      }
    >
      {!setId ? (
        <div className="space-y-3">
          <SearchInput label={`Search study sets in ${category}`} value={setSearch} onChange={setSetSearch} />
          {subject.isFetching && !subject.data ? (
            <p className="text-sm text-ink/55">Loading the study sets…</p>
          ) : matching.length ? (
            <ul className="space-y-1.5">
              {matching.map((s) => (
                <li key={s._id}>
                  <button type="button" onClick={() => setSetId(s._id)} className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-ink/8 px-3 py-2.5 text-left hover:border-brand/40 focus-visible:outline-2 focus-visible:outline-brand">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{s.subtopic}</span>
                      <span className="block text-xs text-ink/50">{`${s.topic} · ${plural(s.flashcards, "flashcard")}, ${plural(s.questions, "quiz question")}`}</span>
                    </span>
                    <Icon name="chevronRight" className="size-4 text-ink/30" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <Empty icon="search" title={sets.length ? "No study set matches" : `No study sets in ${category} yet`} />
          )}
        </div>
      ) : !set ? (
        <p className="text-sm text-ink/55">{content.isError ? "This study set didn't load. Check your connection, then try again." : "Loading its flashcards…"}</p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                [true, "Whole set", `All ${plural(cards.length, "flashcard")}, and new ones as the set grows.`],
                [false, "Pick flashcards", "Only the ones you choose. Quiz questions linked to them come along."],
              ] as const
            ).map(([value, label, hint]) => (
              <label
                key={label}
                className={cx(
                  "flex gap-2.5 rounded-xl border p-3 text-sm",
                  !value && !cards.length ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                  whole === value ? "border-brand bg-brand/4" : "border-ink/10 hover:border-ink/25",
                )}
              >
                <input
                  type="radio"
                  name="step-scope"
                  className="mt-0.5 accent-brand"
                  checked={whole === value}
                  disabled={!value && !cards.length}
                  onChange={() => {
                    setWhole(value);
                    setError(null);
                  }}
                />
                <span>
                  <span className="font-semibold">{label}</span>
                  <span className="block text-xs text-ink/55">{hint}</span>
                </span>
              </label>
            ))}
          </div>

          {!whole && (
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="sm:flex-1">
                  <SearchInput label="Search questions, or type a number" value={query} onChange={setQuery} />
                </div>
                <div className="flex items-end gap-1.5 text-sm">
                  <label className="text-xs text-ink/55">
                    From
                    <input className={cx(inputClass, "mt-0.5 w-16!")} inputMode="numeric" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} aria-label="From flashcard number" />
                  </label>
                  <label className="text-xs text-ink/55">
                    to
                    <input className={cx(inputClass, "mt-0.5 w-16!")} inputMode="numeric" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} aria-label="To flashcard number" />
                  </label>
                  <Button onClick={pickRange}>Select</Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-ink/55">
                <span className="font-semibold text-ink" role="status">{`${picked.size} selected`}</span>
                <button type="button" onClick={() => setPicked(new Set([...picked, ...shown.map((r) => r.id)]))} className="cursor-pointer font-semibold text-brand hover:underline">
                  {needle ? "Select shown" : "Select all"}
                </button>
                <button type="button" onClick={() => setPicked(new Set())} className="cursor-pointer font-semibold text-brand hover:underline">
                  Clear
                </button>
                <span className="hidden sm:inline">Shift-click to select a run of flashcards.</span>
              </div>
              {shown.length ? (
                <ul className="divide-y divide-ink/6 rounded-xl border border-ink/8">
                  {shown.map((r) => {
                    const on = picked.has(r.id);
                    const links = linked.get(r.id) ?? 0;
                    return (
                      <li key={r.id}>
                        <label onClick={(e) => toggle(r, e)} className={cx("flex cursor-pointer items-start gap-3 px-3 py-2.5 text-sm select-none", on ? "bg-brand/5" : "hover:bg-ink/3")}>
                          <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-brand" checked={on} onChange={() => {}} />
                          <span className="w-7 shrink-0 text-xs font-semibold text-ink/40 tabular-nums">{r.n}</span>
                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-2">{r.text || "Untitled flashcard"}</span>
                            <span className="text-xs text-ink/45">{links ? plural(links, "linked quiz question") : "No linked quiz questions"}</span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <Empty icon="search" title="No flashcard matches" />
              )}
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm font-medium text-rose-ink">
              {error}
            </p>
          )}
        </div>
      )}
    </Dialog>
  );
}

// The path's editors (decision 2, as a study set's reviewers): its author always, and those any editor adds by their
// username. They change it directly and decide on suggestions; only its author deletes it or changes who sees it.
function Editors({ view }: { view: PathView }) {
  const [add, adding] = useAddEditorMutation();
  const [take, taking] = useRemoveEditorMutation();
  const [username, setUsername] = useState("");
  const [note, setNote] = useState<{ text: string; tone: "done" | "failed" } | null>(null);
  const addIt = async () => {
    const name = username.trim().replace(/^@/, "");
    if (!name) return;
    try {
      await add({ id: view._id, username: name }).unwrap();
      setNote({ text: `@${name} is an editor now: their changes apply at once, and they decide on suggestions.`, tone: "done" });
      setUsername("");
    } catch (error) {
      setNote({ text: problemOf(error, "That didn't go through. Check your connection and try again."), tone: "failed" });
    }
  };
  const takeOff = async (person: { _id: string; username: string }) => {
    try {
      await take({ id: view._id, userId: person._id }).unwrap();
      setNote({ text: `@${person.username} is no longer an editor.`, tone: "done" });
    } catch (error) {
      setNote({ text: problemOf(error, "That didn't go through. Check your connection and try again."), tone: "failed" });
    }
  };
  return (
    <section aria-labelledby="path-editors" className="space-y-2">
      <h2 id="path-editors" className="font-display text-lg font-semibold">
        Editors
      </h2>
      <p className="text-xs text-pretty text-ink/55">They change the path directly, and accept or decline what others suggest. Only its author can delete it or change who sees it.</p>
      <ul className="divide-y divide-ink/6 rounded-2xl border border-ink/[0.07] bg-surface">
        {view.author && (
          <li className="flex items-center gap-3 px-3 py-2.5">
            <Avatar name={view.author.name} className="size-8" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{view.author.name}</p>
              <p className="truncate text-xs text-ink/50">{`@${view.author.username}`}</p>
            </div>
            <Chip tone="mint">Author</Chip>
          </li>
        )}
        {view.editors.map((e) => (
          <li key={e._id} className="flex items-center gap-3 px-3 py-2.5">
            <Avatar name={e.name} className="size-8" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{e.name}</p>
              <p className="truncate text-xs text-ink/50">{`@${e.username}`}</p>
            </div>
            <Button size="sm" disabled={taking.isLoading} onClick={() => void takeOff(e)}>
              Take off
            </Button>
          </li>
        ))}
      </ul>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void addIt();
        }}
      >
        <Field label="Add an editor" hint="Their username, as on their profile.">
          {({ id, describedBy }) => (
            <div className="flex flex-wrap gap-2">
              <input id={id} aria-describedby={describedBy} value={username} onChange={(e) => setUsername(e.target.value)} maxLength={31} autoComplete="off" placeholder="username" className={cx(inputClass, "h-10 min-w-0 flex-1 basis-48")} />
              <Button type="submit" disabled={adding.isLoading || !username.trim()}>
                {adding.isLoading ? "Adding…" : "Add"}
              </Button>
            </div>
          )}
        </Field>
      </form>
      <p role="status" className="empty:hidden">
        {note && <span className={cx("block rounded-2xl px-3.5 py-2.5 text-sm", note.tone === "done" ? "bg-mint-wash text-mint-ink" : "bg-rose-wash text-rose-ink")}>{note.text}</span>}
      </p>
    </section>
  );
}
