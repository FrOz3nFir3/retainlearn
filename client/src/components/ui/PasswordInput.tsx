// A password field with a button to show what's typed (guide: forms: a <button type="button"> with aria-pressed, so
// what's typed can be checked; pasting stays allowed). Everything else goes to the input: its name, autocomplete
// (current-password or new-password), the field's ids and the form's error handling.
import { useState } from "react";
import type { ComponentPropsWithRef } from "react";
import { cx } from "#utils/cx.ts";
import { inputClass } from "./Field.tsx";
import { Icon } from "./Icon.tsx";

type Props = Omit<ComponentPropsWithRef<"input">, "type">;

export function PasswordInput({ className, ...rest }: Props) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input type={shown ? "text" : "password"} autoCapitalize="none" autoCorrect="off" spellCheck={false} className={cx(inputClass, "h-11 pr-11", className)} {...rest} />
      <button
        type="button"
        aria-pressed={shown}
        aria-label="Show password"
        title={shown ? "Hide password" : "Show password"}
        onClick={() => setShown((s) => !s)}
        className="absolute inset-y-0 right-0 grid w-11 cursor-pointer place-items-center rounded-r-xl text-ink/45 hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
      >
        <Icon name="eye" className={cx("size-4.5", shown && "text-brand")} />
      </button>
    </div>
  );
}
