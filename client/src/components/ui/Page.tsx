// A 2D page: its heading (Back, the title and its actions), then the content. The heading scrolls with the page: the
// app's top bar is the one bar that stays (guide: content-first-noise-reduction, no stacked sticky bars), and a long
// title wraps rather than being cut short (guide: form-factor-adaptation). back: where Back goes (otherwise the
// previous page), or false for a page the main navigation leads to. onBack replaces it, to ask before throwing changes
// away.
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { cx } from "#utils/cx.ts";
import { IconButton } from "./IconButton.tsx";

type Props = { title: string; eyebrow?: string; back?: string | false; onBack?: () => void; actions?: ReactNode; children: ReactNode; width?: string };

export function Page({ title, eyebrow, back, onBack, actions, children, width = "max-w-5xl" }: Props) {
  const navigate = useNavigate();
  const goBack = () => (onBack ? onBack() : back ? navigate(back) : navigate(-1));
  return (
    <div className="flex-1 bg-mist text-ink">
      <div className={cx("mx-auto px-4 pt-5 pb-16 sm:px-6", width)}>
        <header className="mb-5 flex items-center gap-3">
          {back !== false && <IconButton icon="arrowLeft" label="Back" onClick={goBack} />}
          <div className="min-w-0 flex-1">
            {eyebrow && <p className="text-xs text-ink/50">{eyebrow}</p>}
            <h1 className="font-display text-2xl font-semibold text-balance sm:text-3xl">{title}</h1>
          </div>
          {actions}
        </header>
        {children}
      </div>
    </div>
  );
}
