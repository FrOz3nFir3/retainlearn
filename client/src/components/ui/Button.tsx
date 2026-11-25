// A button with the kit's look. tone: primary for the one main action on a screen, quiet for the others, danger for
// what can't be undone. An icon goes before the text where it helps say what the button does. buttonClass gives a
// link the same look.
import type { ComponentPropsWithRef } from "react";
import { cx } from "#utils/cx.ts";
import { Icon } from "./Icon.tsx";
import type { IconName } from "./Icon.tsx";

export type ButtonTone = "primary" | "quiet" | "danger";
export type ButtonSize = "md" | "sm";

const TONES: Record<ButtonTone, string> = {
  primary: "bg-brand text-white hover:bg-brand-deep",
  quiet: "border border-ink/10 bg-surface text-ink hover:bg-ink/[0.04]",
  danger: "bg-danger text-white hover:bg-danger-deep",
};
const SIZES: Record<ButtonSize, string> = { md: "px-3.5 py-2 text-sm", sm: "px-2.5 py-1.5 text-xs" };

export const buttonClass = (tone: ButtonTone = "quiet", size: ButtonSize = "md"): string =>
  cx(
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-45",
    TONES[tone],
    SIZES[size],
  );

type Props = ComponentPropsWithRef<"button"> & { tone?: ButtonTone; size?: ButtonSize; icon?: IconName };

export function Button({ tone = "quiet", size = "md", icon, type = "button", className, children, ...rest }: Props) {
  return (
    <button type={type} className={cx(buttonClass(tone, size), className)} {...rest}>
      {icon && <Icon name={icon} className="size-4 shrink-0" />}
      {children}
    </button>
  );
}
