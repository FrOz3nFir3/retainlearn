// A 2D page: its heading (Back, the title and its actions), then the content. The heading scrolls with the page: the
// app's top bar is the one bar that stays (guide: content-first-noise-reduction, no stacked sticky bars), and a long
// title wraps rather than being cut short (guide: form-factor-adaptation). back: where Back goes (otherwise the
// previous page), or false for a page the main navigation leads to. onBack replaces it, to ask before throwing changes
// away.
// The page's title is the browser tab's too (headTitle, when it should say more), with its description for search
// engines and link previews; noindex keeps a page out of search results (an unlisted set's, P0-14).
// panel: the page as a panel over the 3D world (D-20) rather than a page of its own: the same heading and content, the
// world round it. "lobby": a subject inside its building, on the left (on top, on a phone); "list": a subject off your
// campus, which has no building, its sets as cards in a wider panel on the left (from under the top bar to above the
// tab bar, on a phone); "side": a classroom, or the subjects list, on the right (a sheet from the bottom, above the tab
// bar, on a phone). Each fits the screen's dynamic height (dvh) and keeps clear of the tab bar and the phone's safe
// area (guides: responsive-design, form-factor-adaptation). The panel scrolls itself; the world doesn't.
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "@dr.pogodin/react-helmet";
import { cx } from "#utils/cx.ts";
import { Icon } from "./Icon.tsx";
import { IconButton } from "./IconButton.tsx";
import { Loading, SkeletonText } from "./Skeleton.tsx";

// The page's frame, shared with its skeleton (PageSkeleton) so the two line up exactly.
const FRAME = "flex-1 bg-mist text-ink";
const BODY = "mx-auto px-4 pt-5 pb-16 sm:px-6";
const HEADER = "mb-5 flex items-center gap-3";
const EYEBROW = "text-xs text-ink/50";
const TITLE = "font-display text-2xl font-semibold text-balance sm:text-3xl";
export type PanelPlace = "lobby" | "list" | "side";
const PANEL: Record<PanelPlace, string> = {
  lobby: "fixed inset-x-3 top-[4.25rem] max-h-[45dvh] sm:top-20 md:right-auto md:left-5 md:w-[340px] md:max-h-[calc(100dvh-6rem)]",
  list: "fixed inset-x-3 top-[4.25rem] max-h-[calc(100dvh-8.75rem-env(safe-area-inset-bottom,0px))] sm:top-20 sm:max-h-[calc(100dvh-9.5rem-env(safe-area-inset-bottom,0px))] md:right-auto md:left-5 md:w-[min(760px,calc(100vw-2.5rem))] md:max-h-[calc(100dvh-6rem)]",
  side: "fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px))] max-h-[55dvh] max-md:rounded-b-none! md:inset-x-auto md:top-20 md:right-5 md:bottom-4 md:max-h-none md:w-[min(440px,calc(100vw-2.5rem))]",
};
const PANEL_FRAME = "panel z-20 overflow-y-auto overscroll-contain text-ink";
const PANEL_BODY = "p-4";
const PANEL_HEADER = "mb-4 flex items-start gap-2";
const PANEL_TITLE = "font-display text-xl leading-tight font-semibold text-balance";
const frameOf = (panel: PanelPlace | undefined) => (panel ? cx(PANEL_FRAME, PANEL[panel]) : FRAME);

type Props = {
  title: string;
  eyebrow?: ReactNode;
  back?: string | false;
  onBack?: () => void;
  actions?: ReactNode;
  children: ReactNode;
  width?: string;
  headTitle?: string;
  description?: string;
  noindex?: boolean;
  panel?: PanelPlace;
};

export function Page({ title, eyebrow, back, onBack, actions, children, width = "max-w-5xl", headTitle, description, noindex = false, panel }: Props) {
  const navigate = useNavigate();
  const goBack = () => (onBack ? onBack() : back ? navigate(back) : navigate(-1));
  const tabTitle = `${headTitle ?? title} - RetainLearn`;
  return (
    <div className={frameOf(panel)}>
      <Helmet>
        <title>{tabTitle}</title>
        <meta property="og:title" content={tabTitle} />
        {description && <meta name="description" content={description} />}
        {description && <meta property="og:description" content={description} />}
        {noindex && <meta name="robots" content="noindex" />}
      </Helmet>
      <div className={panel ? PANEL_BODY : cx(BODY, width)}>
        <header className={panel ? PANEL_HEADER : HEADER}>
          {back !== false && <IconButton icon="arrowLeft" label="Back" onClick={goBack} size={panel ? "sm" : "md"} />}
          <div className="min-w-0 flex-1">
            {eyebrow && <p className={EYEBROW}>{eyebrow}</p>}
            <h1 className={panel ? PANEL_TITLE : TITLE}>{title}</h1>
          </div>
          {actions}
        </header>
        {children}
      </div>
    </div>
  );
}

// A page whose title comes with its data (a study set's): the same frame and heading, with the Back arrow (back), and
// placeholders where the eyebrow and the title go, then the content's skeleton (children). Screen readers hear label.
// A page whose title is known already uses Page itself, with Loading in it. panel: as Page's.
type SkeletonProps = { label: string; width?: string; eyebrow?: boolean; back?: boolean; actions?: ReactNode; children: ReactNode; panel?: PanelPlace };
export function PageSkeleton({ label, width = "max-w-5xl", eyebrow = true, back = true, actions, children, panel }: SkeletonProps) {
  return (
    <div className={frameOf(panel)}>
      <Loading label={label} className={panel ? PANEL_BODY : cx(BODY, width)}>
        <div className={panel ? PANEL_HEADER : HEADER}>
          {back && (
            <span className={cx("grid shrink-0 place-items-center text-ink/25", panel ? "size-8" : "size-10")}>
              <Icon name="arrowLeft" className={panel ? "size-4" : "size-5"} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            {eyebrow && (
              <div className={EYEBROW}>
                <SkeletonText className="w-44" />
              </div>
            )}
            <div className={panel ? PANEL_TITLE : TITLE}>
              <SkeletonText className={panel ? "w-40" : "w-64"} />
            </div>
          </div>
          {actions}
        </div>
        {children}
      </Loading>
    </div>
  );
}
