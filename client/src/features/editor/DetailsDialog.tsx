// The set's details: its topic, subtopic and subject (checked by the rules a new set is checked with, NewStudySet in
// core) and its description. Only what changed is sent, in one save. Moving it to another subject moves it to that
// subject's building. Editors save; anyone else signed in suggests the change.
import { useState } from "react";
import type { FormEvent } from "react";
import { NewStudySet, STUDY_SET_SUBTOPIC_MAX, STUDY_SET_TOPIC_MAX, SUBJECT_NAME_MAX } from "@retainlearn/core";
import type { StudySetContent } from "@retainlearn/core";
import { problemOf } from "#api/problem.ts";
import { Button } from "#components/ui/Button.tsx";
import { Dialog } from "#components/ui/Dialog.tsx";
import { Field, inputClass, schemaRule, useFieldErrors } from "#components/ui/Field.tsx";
import { RichField } from "#components/ui/RichEditor.tsx";
import { useSaveStudySetMutation } from "./editorApi.ts";
import { SAVE_LABEL, isBlank, savedNotice } from "./shared.ts";
import type { Access, Notice } from "./shared.ts";

const FORM = "study-set-details";

type Props = { set: StudySetContent; access: Exclude<Access, "guest">; onClose: () => void; onSaved: (notice: Notice) => void };

export function DetailsDialog({ set, access, onClose, onSaved }: Props) {
  const form = useFieldErrors({
    topic: schemaRule(NewStudySet.shape.mainTopic),
    subtopic: schemaRule(NewStudySet.shape.subTopic),
    subject: schemaRule(NewStudySet.shape.category),
  });
  const [description, setDescription] = useState({ html: set.description, changed: false });
  const [problem, setProblem] = useState<string | null>(null);
  const [save, saving] = useSaveStudySetMutation();

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProblem(null);
    if (!form.check(e.currentTarget)) return;
    const data = new FormData(e.currentTarget);
    const parsed = NewStudySet.parse({ mainTopic: data.get("topic"), subTopic: data.get("subtopic"), category: data.get("subject") });
    const change = {
      ...(parsed.mainTopic !== set.topic ? { "main-topic": parsed.mainTopic } : {}),
      ...(parsed.subTopic !== set.subtopic ? { "sub-topic": parsed.subTopic } : {}),
      ...(parsed.category !== set.category ? { category: parsed.category } : {}),
      ...(description.changed ? { description: isBlank(description.html) ? "" : description.html } : {}),
    };
    if (!Object.keys(change).length) return onClose();
    try {
      const { suggested } = await save({ setId: set._id, change }).unwrap();
      onSaved(savedNotice(suggested, "Saved the set's details.", "Suggestion for the set's details sent."));
      onClose();
    } catch (error) {
      setProblem(
        (error as { status?: unknown }).status === 409
          ? "Another study set has this topic, subtopic and subject. Change one of them."
          : problemOf(error, "That didn't save. Check your connection and try again."),
      );
    }
  };

  return (
    <Dialog
      title="The set's details"
      eyebrow={set.subtopic}
      onClose={onClose}
      wide
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" form={FORM} tone="primary" disabled={saving.isLoading}>
            {saving.isLoading ? "Saving…" : SAVE_LABEL[access]}
          </Button>
        </>
      }
    >
      <form id={FORM} noValidate onSubmit={(e) => void submit(e)} className="space-y-4">
        <div role="alert" className="empty:hidden">
          {problem && <p className="rounded-xl bg-rose-wash px-3 py-2 text-sm text-rose-ink">{problem}</p>}
        </div>
        <Field label="Topic" hint="What it's about. For example: JavaScript" error={form.errors.topic}>
          {({ id, describedBy }) => (
            <input id={id} aria-describedby={describedBy} {...form.field("topic")} defaultValue={set.topic} required maxLength={STUDY_SET_TOPIC_MAX} autoComplete="off" className={inputClass} />
          )}
        </Field>
        <Field label="Subtopic" hint="The part of it this set covers. For example: Closures" error={form.errors.subtopic}>
          {({ id, describedBy }) => (
            <input id={id} aria-describedby={describedBy} {...form.field("subtopic")} defaultValue={set.subtopic} required maxLength={STUDY_SET_SUBTOPIC_MAX} autoComplete="off" className={inputClass} />
          )}
        </Field>
        <Field label="Subject" hint="The subject it belongs to, and so its building on the campus. For example: Programming" error={form.errors.subject}>
          {({ id, describedBy }) => (
            <input id={id} aria-describedby={describedBy} {...form.field("subject")} defaultValue={set.category} required maxLength={SUBJECT_NAME_MAX} autoComplete="off" className={inputClass} />
          )}
        </Field>
        <RichField
          label="Description"
          value={set.description}
          onChange={(html, changed) => setDescription({ html, changed })}
          hint="Optional: a line or two on what the set covers, shown on its classroom."
          placeholder="What the set covers"
          compact
          className="min-h-16"
        />
      </form>
    </Dialog>
  );
}
