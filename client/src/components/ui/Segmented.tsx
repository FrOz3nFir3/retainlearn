// A choice of a few options side by side. Real radio buttons under the look, so arrow keys move between them and
// screen readers hear a group with its name (guide: forms). items: each option's value, label and optional icon.
// wrap: pills that wrap onto more lines, for more options than fit across a phone.
import { useId } from "react";
import { cx } from "#utils/cx.ts";
import { Icon } from "./Icon.tsx";
import type { IconName } from "./Icon.tsx";

type Item<T> = { value: T; label: string; icon?: IconName };
type Props<T> = { label: string; items: readonly Item<T>[]; value: T; onChange: (value: T) => void; wrap?: boolean; className?: string };

export function Segmented<T extends string | boolean>({ label, items, value, onChange, wrap = false, className }: Props<T>) {
  const name = useId();
  return (
    <fieldset className={cx("min-w-0", wrap ? "flex flex-wrap gap-1.5" : "flex rounded-xl bg-ink/[0.06] p-0.5", className)}>
      <legend className="sr-only">{label}</legend>
      {items.map((item, i) => {
        const on = item.value === value;
        const look = wrap
          ? cx("rounded-full px-3 py-1.5", on ? "bg-surface text-ink shadow-sm ring-1 ring-ink/15" : "bg-ink/[0.06] text-ink/60 hover:text-ink")
          : cx("flex-1 justify-center rounded-[10px] px-2 py-1.5", on ? "bg-surface text-ink shadow-sm" : "text-ink/55 hover:text-ink");
        return (
          <label
            key={String(item.value)}
            className={cx("flex cursor-pointer items-center gap-1.5 text-xs font-semibold whitespace-nowrap has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand", look)}
          >
            <input type="radio" name={name} value={i} checked={on} onChange={() => onChange(item.value)} className="sr-only" />
            {item.icon && <Icon name={item.icon} className="size-3.5" />}
            {item.label}
          </label>
        );
      })}
    </fieldset>
  );
}
