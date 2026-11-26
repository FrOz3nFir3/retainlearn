// "Report this set" (P0-14), from the classroom: why (one of core's reasons) and an optional note. One report per
// person per set; once enough people report a set, it's unlisted until someone checks it. Sent, the dialog says thanks.
// The author can't report their own set (the server says so, and that's shown).
import { useState } from "react";
import type { FormEvent } from "react";
import { REPORT_NOTE_MAX, StudySetReport } from "@retainlearn/core";
import type { StudySetReportBody } from "@retainlearn/core";
import { problemOf } from "#api/problem.ts";
import { Button } from "#components/ui/Button.tsx";
import { Dialog } from "#components/ui/Dialog.tsx";
import { Field, inputClass } from "#components/ui/Field.tsx";
import { useReportStudySetMutation } from "./classroomApi.ts";

const FORM = "report-study-set";
const REASONS: Record<StudySetReportBody["reason"], string> = {
  spam: "Spam or advertising",
  offensive: "Offensive or inappropriate",
  wrong: "Wrong or misleading",
  other: "Something else",
};

export function ReportStudySet({ setId, name, onClose }: { setId: string; name: string; onClose: () => void }) {
  const [report, { isLoading }] = useReportStudySetMutation();
  const [sent, setSent] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [reasonError, setReasonError] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProblem(null);
    const data = new FormData(e.currentTarget);
    const body = StudySetReport.safeParse({ reason: data.get("reason") ?? undefined, note: data.get("note") ?? "" });
    if (!body.success) {
      setReasonError(body.error.issues[0]?.message ?? "Choose a reason.");
      e.currentTarget.querySelector<HTMLInputElement>('input[name="reason"]')?.focus();
      return;
    }
    try {
      await report({ setId, ...body.data }).unwrap();
      setSent(true);
    } catch (error) {
      setProblem(problemOf(error, "The report wasn't sent. Check your connection and try again."));
    }
  };

  if (sent) {
    return (
      <Dialog title="Thanks for telling us" eyebrow={name} onClose={onClose} footer={<Button onClick={onClose}>Close</Button>}>
        <p className="text-sm text-ink/70">We'll take a look. If enough people report a set, it's taken out of the subjects until someone checks it.</p>
      </Dialog>
    );
  }
  return (
    <Dialog
      title="Report this set"
      eyebrow={name}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" form={FORM} tone="danger" disabled={isLoading}>
            {isLoading ? "Sending…" : "Send report"}
          </Button>
        </>
      }
    >
      <form id={FORM} noValidate onSubmit={(e) => void submit(e)} className="space-y-4">
        <div role="alert" className="empty:hidden">
          {problem && <p className="rounded-xl bg-rose-wash px-3 py-2 text-sm text-rose-ink">{problem}</p>}
        </div>
        <fieldset aria-describedby={reasonError ? "report-reason-error" : undefined}>
          <legend className="text-sm font-semibold">What's wrong with it?</legend>
          <div className="mt-2 space-y-2">
            {Object.entries(REASONS).map(([value, label]) => (
              <label key={value} className="flex cursor-pointer items-center gap-3 text-sm">
                <input type="radio" name="reason" value={value} required onChange={() => setReasonError(null)} className="size-4 accent-brand" />
                {label}
              </label>
            ))}
          </div>
          <p id="report-reason-error" aria-live="polite" className="mt-1.5 text-xs font-medium text-rose-ink empty:hidden">
            {reasonError}
          </p>
        </fieldset>
        <Field label="Anything to add? (optional)" hint={`Up to ${REPORT_NOTE_MAX} characters.`}>
          {({ id, describedBy }) => <textarea id={id} name="note" aria-describedby={describedBy} maxLength={REPORT_NOTE_MAX} rows={3} className={inputClass} />}
        </Field>
      </form>
    </Dialog>
  );
}
