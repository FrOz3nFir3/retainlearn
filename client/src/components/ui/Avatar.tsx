// A person as their initials in a circle (the prototype's Avatar). Decorative: their name is given beside it or in
// its button's label.
import { cx } from "#utils/cx.ts";

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => Array.from(word)[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span aria-hidden="true" className={cx("grid size-8 shrink-0 place-items-center rounded-full bg-brand-deep text-xs font-bold text-white", className)}>
      {initialsOf(name)}
    </span>
  );
}
