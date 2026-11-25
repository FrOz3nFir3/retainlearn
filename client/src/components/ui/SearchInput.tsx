// A search box: its label for screen readers, the search icon, and type="search", so the browser offers a clear
// button and the phone keyboard's key says Search. No autocorrect or capitals: what's typed is looked up as it is
// (guide: forms).
import type { ComponentPropsWithRef } from "react";
import { cx } from "#utils/cx.ts";
import { inputClass } from "./Field.tsx";
import { Icon } from "./Icon.tsx";

type Props = Omit<ComponentPropsWithRef<"input">, "type" | "value" | "onChange"> & { value: string; onChange: (value: string) => void; label: string };

export function SearchInput({ value, onChange, label, placeholder, className, ...rest }: Props) {
  return (
    <label className={cx("relative block", className)}>
      <span className="sr-only">{label}</span>
      <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink/40" />
      <input
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? label}
        className={cx(inputClass, "h-10 pl-9")}
        {...rest}
      />
    </label>
  );
}
