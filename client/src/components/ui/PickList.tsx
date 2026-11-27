// Picking one of a long list by typing part of it (guide: forms, "10+ options: <input list> with <datalist>"): the
// browser offers the options that match what's typed, so picking one of 45 flashcards isn't a long scroll. The field
// shows the picked option's label; focusing it selects that text, so typing starts a new search. Text that isn't an
// option's label picks nothing, and goes back to the picked one when you leave the field. Labels must be unique (a
// number in front, say). Pass id and aria-describedby from a Field.
import { useId, useState } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { cx } from "#utils/cx.ts";
import { inputClass } from "./Field.tsx";

export type PickOption = { value: string; label: string };
type Props = Omit<ComponentPropsWithoutRef<"input">, "value" | "onChange" | "list" | "type"> & {
  value: string;
  options: readonly PickOption[];
  onChange: (value: string) => void;
};

export function PickList({ value, options, onChange, className, onFocus, onBlur, ...rest }: Props) {
  const listId = useId();
  const picked = options.find((o) => o.value === value)?.label ?? "";
  const [text, setText] = useState<string | null>(null); // what's typed, while it isn't an option's label
  return (
    <>
      <input
        {...rest}
        type="text"
        list={listId}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        value={text ?? picked}
        onFocus={(e) => {
          e.currentTarget.select();
          onFocus?.(e);
        }}
        onChange={(e) => {
          const typed = e.target.value;
          const match = options.find((o) => o.label === typed);
          if (match) {
            setText(null);
            onChange(match.value);
          } else setText(typed);
        }}
        onBlur={(e) => {
          setText(null);
          onBlur?.(e);
        }}
        className={cx(inputClass, className)}
      />
      <datalist id={listId}>
        {options.map((o) => (
          <option key={o.value} value={o.label} />
        ))}
      </datalist>
    </>
  );
}
