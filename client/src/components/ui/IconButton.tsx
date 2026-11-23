// A button that's only an icon. Its label names it for screen readers and shows as a tooltip, so it's required.
import type { ComponentPropsWithRef } from "react";
import { cx } from "#utils/cx.ts";
import { Icon } from "./Icon.tsx";
import type { IconName } from "./Icon.tsx";

type Props = Omit<ComponentPropsWithRef<"button">, "children" | "aria-label"> & { icon: IconName; label: string; size?: "md" | "sm" };

export function IconButton({ icon, label, size = "md", type = "button", className, ...rest }: Props) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        "grid shrink-0 cursor-pointer place-items-center rounded-xl text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink",
        "focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-45",
        size === "sm" ? "size-8" : "size-10",
        className,
      )}
      {...rest}
    >
      <Icon name={icon} className={size === "sm" ? "size-4" : "size-5"} />
    </button>
  );
}
