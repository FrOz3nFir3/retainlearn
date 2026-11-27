// Skill paths' skeleton (PLAN 14.15): loaded with the app, so /paths shows it the moment it's opened, before the list's
// own code arrives; and its list part, which the page shows while a page of paths loads. Built from the page's real
// frame: its heading, the directory's tabs, the intro, the search box and "New path" as they look, the filter for a
// signed-in player, the list's heading (from the address) and cards in a path card's shape.
import { useSearchParams } from "react-router-dom";
import { useSession } from "#app/session.ts";
import { buttonClass } from "#components/ui/Button.tsx";
import { cardClass } from "#components/ui/Card.tsx";
import { inputClass } from "#components/ui/Field.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { Page } from "#components/ui/Page.tsx";
import { Loading, SkeletonBlock, SkeletonText } from "#components/ui/Skeleton.tsx";
import { useWorld } from "#features/campus/view.ts";
import { DirectoryTabs } from "#features/subjects/DirectoryTabs.tsx";
import { LIST_HEADING, SEARCH_BOX, SUBJECTS_GRID, TOOLBAR } from "#features/subjects/SubjectsSkeleton.tsx";
import { cx } from "#utils/cx.ts";

export const PATHS_TITLE = { title: "Skill paths", eyebrow: "Guided routes through study sets that add up to a skill" };
export const PATHS_DESCRIPTION = "Skill paths on RetainLearn: study sets in order, adding up to a skill. Follow one, or build your own from study sets and the flashcards in them.";
export const PATHS_INTRO = "mb-4 text-sm text-pretty text-ink/60";
export const PATHS_FILTERS = "mt-3 flex flex-wrap items-center gap-2";

// The list's heading for what's asked: yours, a subject's, a search's, or every path.
export function pathsHeading({ mine, subject, search }: { mine: boolean; subject: string | null; search: string }): string {
  const base = mine ? "Your paths" : subject ? `Paths in ${subject}` : "All paths";
  return search ? `${base} matching “${search}”` : base;
}

export function PathsSkeleton() {
  const world = useWorld();
  const overWorld = world.shown && world.view.kind === "paths";
  const signedIn = useSession() !== "out";
  return (
    <Page title={PATHS_TITLE.title} eyebrow={PATHS_TITLE.eyebrow} back={overWorld ? "/" : false} description={PATHS_DESCRIPTION} panel={overWorld ? "side" : undefined}>
      <DirectoryTabs />
      <p className={PATHS_INTRO}>Follow one, or build your own from study sets and the flashcards in them.</p>
      <div className={TOOLBAR}>
        <div className={SEARCH_BOX}>
          <div className={cx(inputClass, "relative flex h-10 items-center pl-9 text-ink/40")}>
            <Icon name="search" className="absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            Search paths
          </div>
        </div>
        <span className={buttonClass("primary")}>
          <Icon name="plus" className="size-4 shrink-0" />
          New path
        </span>
      </div>
      <FiltersSkeleton signedIn={signedIn} />
      <PathListSkeleton />
    </Page>
  );
}

// "All paths | Yours" (the kit's Segmented, as it looks) for a signed-in player, and a subject's chip (?subject=).
export const WHOSE_WIDTH = "w-52";
export const SUBJECT_CHIP = "inline-flex items-center gap-1 rounded-full bg-brand/8 px-2.5 py-1 text-xs font-semibold text-brand";
function FiltersSkeleton({ signedIn }: { signedIn: boolean }) {
  const [params] = useSearchParams();
  const subject = params.get("subject");
  if (!signedIn && !subject) return null;
  const mine = params.get("mine") === "1";
  const option = (on: boolean) => cx("flex flex-1 items-center justify-center gap-1.5 rounded-[10px] px-2 py-1.5 text-xs font-semibold whitespace-nowrap", on ? "bg-surface text-ink shadow-sm" : "text-ink/55");
  return (
    <div className={PATHS_FILTERS}>
      {signedIn && (
        <div className={cx("flex min-w-0 rounded-xl bg-ink/[0.06] p-0.5", WHOSE_WIDTH)}>
          <span className={option(!mine)}>All paths</span>
          <span className={option(mine)}>Yours</span>
        </div>
      )}
      {subject && (
        <span className={SUBJECT_CHIP}>
          In {subject}
          <Icon name="x" className="size-3.5" />
        </span>
      )}
    </div>
  );
}

export function PathListSkeleton() {
  const [params] = useSearchParams();
  const signedIn = useSession() !== "out";
  const heading = pathsHeading({ mine: params.get("mine") === "1", subject: params.get("subject"), search: (params.get("search") ?? "").trim() });
  return (
    <Loading label="Loading the paths" className="mt-6">
      <p className={LIST_HEADING}>
        {heading}
        <span className="text-sm font-normal">
          <SkeletonText className="w-5" />
        </span>
      </p>
      <div className={SUBJECTS_GRID}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={cardClass}>
            <div className="flex items-start gap-2">
              <SkeletonBlock className="size-8 shrink-0 rounded-xl" />
              <p className="min-w-0 flex-1 font-display text-lg font-semibold">
                <SkeletonText className="w-40" />
              </p>
            </div>
            <p className="mt-1.5 text-sm">
              <SkeletonText className="w-52" />
            </p>
            <p className="mt-1 text-xs">
              <SkeletonText className="w-56" />
            </p>
            {signedIn && (
              <div className="mt-auto flex items-center gap-2 pt-3">
                <SkeletonBlock className="h-1.5 flex-1 rounded-full" />
                <span className="text-xs">
                  <SkeletonText className="w-6" />
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Loading>
  );
}
