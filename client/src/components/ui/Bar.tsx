// How far along something is: a native <progress> (guide: progress), so screen readers hear its name and share.
// value: 0 to 1. tone: the fill's colour, a role from styles/kit.css.
import type { CSSProperties } from "react";
import { cx } from "#utils/cx.ts";

export type BarTone = "brand" | "mint" | "bell" | "rose" | "cold";

const FILLS: Record<BarTone, string> = {
  brand: "var(--color-brand)",
  mint: "var(--color-mint)",
  bell: "var(--color-bell)",
  rose: "var(--color-danger)",
  cold: "var(--color-cold)",
};

export function Bar({ value, label, tone = "brand", className }: { value: number; label: string; tone?: BarTone; className?: string }) {
  return (
    <progress
      className={cx("kit-bar", className)}
      value={Math.min(1, Math.max(0, value))}
      max={1}
      aria-label={label}
      style={{ "--kit-bar-fill": FILLS[tone] } as CSSProperties}
    />
  );
}
