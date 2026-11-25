// "New study set" in a subject (the prototype's NewSetModal): its topic and the part of it the set covers, checked as
// you leave each field and on submit, by the rules the server checks them with. Created, its classroom opens, where
// its flashcards are added from Edit, and its subject goes on your campus if it isn't there yet (your sets live in
// your buildings).
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { NewStudySet as NewStudySetBody, STUDY_SET_SUBTOPIC_MAX, STUDY_SET_TOPIC_MAX } from "@retainlearn/core";
import { Button } from "#components/ui/Button.tsx";
import { Dialog } from "#components/ui/Dialog.tsx";
import { Field, inputClass, schemaRule, useFieldErrors } from "#components/ui/Field.tsx";
import { browserTimeZone } from "#features/campus/campusApi.ts";
import { setPath } from "#features/classes/modes.ts";
import { problemOf } from "#api/problem.ts";
import { useAddSubjectMutation, useCreateStudySetMutation } from "./subjectsApi.ts";

const FORM = "new-study-set";

export function NewStudySet({ subject, onCampus, onClose }: { subject: string; onCampus: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [createStudySet, { isLoading }] = useCreateStudySetMutation();
  const [addSubject] = useAddSubjectMutation();
  const form = useFieldErrors({ mainTopic: schemaRule(NewStudySetBody.shape.mainTopic), subTopic: schemaRule(NewStudySetBody.shape.subTopic) });
  const [failed, setFailed] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFailed(null);
    if (!form.check(e.currentTarget)) return;
    const data = new FormData(e.currentTarget);
    try {
      const set = await createStudySet({ mainTopic: String(data.get("mainTopic")), subTopic: String(data.get("subTopic")), category: subject }).unwrap();
      if (!onCampus) void addSubject({ name: subject, tz: browserTimeZone() });
      navigate(setPath(set._id));
    } catch (error) {
      const duplicate = (error as { status?: unknown }).status === 409;
      setFailed(duplicate ? `${subject} has a study set with this topic and subtopic already. Open it, or name this one differently.` : problemOf(error, "The study set wasn't created. Check your connection, then try again."));
    }
  };

  return (
    <Dialog
      title="New study set"
      eyebrow={`In ${subject}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" form={FORM} tone="primary" disabled={isLoading}>
            {isLoading ? "Creating…" : "Create study set"}
          </Button>
        </>
      }
    >
      <form id={FORM} noValidate onSubmit={(e) => void submit(e)} className="space-y-4">
        <Field label="Topic" hint="What it's about. For example: JavaScript" error={form.errors.mainTopic}>
          {({ id, describedBy }) => (
            <input id={id} aria-describedby={describedBy} {...form.field("mainTopic")} required maxLength={STUDY_SET_TOPIC_MAX} autoComplete="off" enterKeyHint="next" className={inputClass} />
          )}
        </Field>
        <Field label="Subtopic" hint="The part of it this set covers, short and specific. For example: Closures" error={form.errors.subTopic}>
          {({ id, describedBy }) => (
            <input id={id} aria-describedby={describedBy} {...form.field("subTopic")} required maxLength={STUDY_SET_SUBTOPIC_MAX} autoComplete="off" enterKeyHint="done" className={inputClass} />
          )}
        </Field>
        <div role="alert" className="empty:hidden">
          {failed && <p className="rounded-2xl bg-rose-wash px-3.5 py-2.5 text-sm text-rose-ink">{failed}</p>}
        </div>
      </form>
    </Dialog>
  );
}
