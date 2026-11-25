// A labelled form field: the label, the control, then a hint or the error. children gets the control's id, and the
// id of the hint or error to set as its aria-describedby, so screen readers read it with the control. The note is a
// live region, so an error that appears as you leave the field is read out too (guide: forms).
import { useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { z } from "@retainlearn/core";
import { cx } from "#utils/cx.ts";

// A field you've left with something wrong in it is outlined in the danger colour (:user-invalid, so never before
// you've touched it), as well as getting its error in words.
export const inputClass =
  "w-full rounded-xl border border-ink/12 bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-brand focus:ring-4 focus:ring-brand/10 focus:outline-none user-invalid:border-danger aria-[invalid=true]:border-danger";

type Props = { label: string; hint?: string; error?: string | undefined; children: (ids: { id: string; describedBy: string | undefined }) => ReactNode };

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
      <p id={noteId} aria-live="polite" className={cx("text-xs empty:hidden", error ? "font-medium text-rose-ink" : "text-ink/50")}>
        {note}
      </p>
    </div>
  );
}

type Rules<Name extends string> = Record<Name, (value: string) => string | null>;

// A form's errors (guides: forms, validate-input-after-interaction): a field's error shows once you leave it having
// typed in it, goes as soon as you type in it again, and a submit checks every field and moves focus to the first
// that's wrong. rules: each field's check, by its name, saying what's wrong in words (or null when it's fine). Spread
// field(name) onto the input; check(form) on submit says whether to go on.
export function useFieldErrors<Name extends string>(rules: Rules<Name>) {
  const [errors, setErrors] = useState<Partial<Record<Name, string>>>({});
  const edited = useRef(new Set<Name>());
  const names = Object.keys(rules) as Name[];
  const setError = (name: Name, error: string | null) => setErrors((all) => ({ ...all, [name]: error ?? undefined }));
  return {
    errors,
    field: (name: Name) => ({
      name,
      "aria-invalid": errors[name] ? true : undefined,
      onInput: () => {
        edited.current.add(name);
        if (errors[name]) setError(name, null);
      },
      onBlur: (e: { currentTarget: { value: string } }) => {
        if (edited.current.has(name)) setError(name, rules[name](e.currentTarget.value));
      },
    }),
    check: (form: HTMLFormElement): boolean => {
      const valueOf = (name: Name) => (form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? "";
      const found = Object.fromEntries(names.map((name) => [name, rules[name](valueOf(name)) ?? undefined])) as Partial<Record<Name, string>>;
      setErrors(found);
      const first = names.find((name) => found[name]);
      if (first) (form.elements.namedItem(first) as HTMLElement | null)?.focus();
      return !first;
    },
    // An error from elsewhere (the server's answer) on a field.
    setError,
  };
}

// A field's check from a shared schema (@retainlearn/core), so the form says what the server would: its first
// problem's message, or null when the value fits.
export const schemaRule =
  (schema: z.ZodType) =>
  (value: string): string | null => {
    const result = schema.safeParse(value);
    return result.success ? null : (result.error.issues[0]?.message ?? "Check this.");
  };
