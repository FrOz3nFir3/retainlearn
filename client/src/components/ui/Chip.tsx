// A small label: a status, a count, a subject. Each tone reads in both themes (its wash and ink, styles/kit.css).
import type { ReactNode } from "react";
import { cx } from "#utils/cx.ts";

export type ChipTone = "neutral" | "brand" | "bell" | "mint" | "rose" | "cold" | "orange";

const TONES: Record<ChipTone, string> = {
  neutral: "bg-ink/[0.05] text-ink/60",
  brand: "bg-brand/10 text-brand",
  bell: "bg-bell-wash text-bell-ink",
  mint: "bg-mint-wash text-mint-ink",
  rose: "bg-rose-wash text-rose-ink",
  cold: "bg-cold-wash text-cold-ink",
  orange: "bg-orange-wash text-orange-ink",
};

export function Chip({ children, tone = "neutral", className }: { children: ReactNode; tone?: ChipTone; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap", TONES[tone], className)}>
      {children}
    </span>
  );
}
