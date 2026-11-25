// A 2D page: its heading (Back, the title and its actions), then the content. The heading scrolls with the page: the
// app's top bar is the one bar that stays (guide: content-first-noise-reduction, no stacked sticky bars), and a long
// title wraps rather than being cut short (guide: form-factor-adaptation). back: where Back goes (otherwise the
// previous page), or false for a page the main navigation leads to. onBack replaces it, to ask before throwing changes
// away.
// The page's title is the browser tab's too (headTitle, when it should say more), with its description for search
// engines and link previews; noindex keeps a page out of search results (an unlisted set's, P0-14).
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "@dr.pogodin/react-helmet";
import { cx } from "#utils/cx.ts";
import { IconButton } from "./IconButton.tsx";

type Props = {
  title: string;
  eyebrow?: string;
  back?: string | false;
  onBack?: () => void;
  actions?: ReactNode;
  children: ReactNode;
  width?: string;
  headTitle?: string;
  description?: string;
  noindex?: boolean;
};

export function Page({ title, eyebrow, back, onBack, actions, children, width = "max-w-5xl", headTitle, description, noindex = false }: Props) {
  const navigate = useNavigate();
  const goBack = () => (onBack ? onBack() : back ? navigate(back) : navigate(-1));
  const tabTitle = `${headTitle ?? title} - RetainLearn`;
  return (
    <div className="flex-1 bg-mist text-ink">
      <Helmet>
        <title>{tabTitle}</title>
        <meta property="og:title" content={tabTitle} />
        {description && <meta name="description" content={description} />}
        {description && <meta property="og:description" content={description} />}
        {noindex && <meta name="robots" content="noindex" />}
      </Helmet>
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
