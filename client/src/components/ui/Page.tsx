// A full 2D page: a sticky header with Back, the title and its actions, then the content. back: where Back goes
// (otherwise the previous page). onBack replaces it, to ask before throwing changes away.
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { cx } from "#utils/cx.ts";
import { IconButton } from "./IconButton.tsx";

type Props = { title: string; eyebrow?: string; back?: string; onBack?: () => void; actions?: ReactNode; children: ReactNode; width?: string };

export function Page({ title, eyebrow, back, onBack, actions, children, width = "max-w-5xl" }: Props) {
  const navigate = useNavigate();
  const goBack = () => (onBack ? onBack() : back ? navigate(back) : navigate(-1));
  return (
    <div className="min-h-dvh bg-mist text-ink">
      <header className="sticky top-0 z-10 border-b border-ink/[0.06] bg-surface/85 backdrop-blur-xl">
        <div className={cx("mx-auto flex items-center gap-3 px-4 py-3 sm:px-6", width)}>
          <IconButton icon="arrowLeft" label="Back" onClick={goBack} />
          <div className="min-w-0 flex-1">
            {eyebrow && <p className="truncate text-xs text-ink/50">{eyebrow}</p>}
            <h1 className="truncate font-display text-xl font-semibold sm:text-2xl">{title}</h1>
          </div>
          {actions}
        </div>
      </header>
      <div className={cx("mx-auto px-4 py-5 pb-28 sm:px-6", width)}>{children}</div>
    </div>
  );
}
