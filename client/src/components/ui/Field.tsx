// A labelled form field: the label, the control, then a hint or the error. children gets the control's id, and the
// id of the hint or error to set as its aria-describedby, so screen readers read it with the control.
import { useId } from "react";
import type { ReactNode } from "react";
import { cx } from "#utils/cx.ts";

export const inputClass =
  "w-full rounded-xl border border-ink/12 bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-brand focus:ring-4 focus:ring-brand/10 focus:outline-none";

type Props = { label: string; hint?: string; error?: string; children: (ids: { id: string; describedBy: string | undefined }) => ReactNode };

export function Field({ label, hint, error, children }: Props) {
  const id = useId();
  const note = error ?? hint;
  const noteId = `${id}-note`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      {children({ id, describedBy: note ? noteId : undefined })}
      {note && (
        <p id={noteId} className={cx("text-xs", error ? "font-medium text-rose-ink" : "text-ink/50")}>
          {note}
        </p>
      )}
    </div>
  );
}
