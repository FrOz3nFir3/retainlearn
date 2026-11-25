// The subjects directory's skeleton (PLAN 14.15): loaded with the app, so the route shows it the moment /subjects is
// opened, before the directory's own code arrives; and its list part, which the directory shows while a page of
// subjects loads. Built from the directory's real frame: its heading, the search box and "New subject" as they look
// (not yet usable, so nothing typed is lost), the list's heading (for the search in the address) and cards in a
// subject card's shape, with the "Add to campus" row for a signed-in player or one being checked.
import { useSearchParams } from "react-router-dom";
import { useSession } from "#app/session.ts";
import { buttonClass } from "#components/ui/Button.tsx";
import { cardClass } from "#components/ui/Card.tsx";
import { inputClass } from "#components/ui/Field.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { Page } from "#components/ui/Page.tsx";
import { Loading, SkeletonBlock, SkeletonText } from "#components/ui/Skeleton.tsx";
import { cx } from "#utils/cx.ts";

export const DIRECTORY_TITLE = { title: "Subjects", eyebrow: "Every subject on RetainLearn" };
export const DIRECTORY_DESCRIPTION = "Every subject on RetainLearn, with its study sets of flashcards and quizzes. Find one to study, or start your own.";
export const LIST_HEADING = "mb-3 flex items-baseline gap-2 font-display text-xl font-semibold outline-none";
export const SUBJECTS_GRID = "grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-3";
export const TOOLBAR = "flex flex-wrap items-center gap-3";
export const SEARCH_BOX = "min-w-0 flex-1 basis-64";

export function SubjectsSkeleton() {
  return (
    <Page title={DIRECTORY_TITLE.title} eyebrow={DIRECTORY_TITLE.eyebrow} back={false} description={DIRECTORY_DESCRIPTION}>
      <div className={TOOLBAR}>
        <div className={SEARCH_BOX}>
          <div className={cx(inputClass, "relative flex h-10 items-center pl-9 text-ink/40")}>
            <Icon name="search" className="absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            Search subjects
          </div>
        </div>
        <span className={buttonClass("primary")}>
          <Icon name="plus" className="size-4 shrink-0" />
          New subject
        </span>
      </div>
      <DirectorySkeleton />
    </Page>
  );
}

export function DirectorySkeleton() {
  const [params] = useSearchParams();
  const search = (params.get("search") ?? "").trim();
  const signedIn = useSession() !== "out";
  return (
    <Loading label="Loading the subjects" className="mt-6">
      <p className={LIST_HEADING}>
        {search ? `Subjects matching “${search}”` : "All subjects"}
        <span className="text-sm font-normal">
          <SkeletonText className="w-5" />
        </span>
      </p>
      <div className={SUBJECTS_GRID}>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className={cardClass}>
            <div className="flex items-center gap-2">
              <SkeletonBlock className="h-7 w-1.5 shrink-0 rounded-full" />
              <p className="min-w-0 flex-1 font-display text-lg font-semibold">
                <SkeletonText className="w-32" />
              </p>
            </div>
            <p className="mt-1 text-xs">
              <SkeletonText className="w-48" />
            </p>
            <p className="text-xs">
              <SkeletonText className="w-24" />
            </p>
            {signedIn && (
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                <span className={buttonClass("quiet", "sm")}>
                  <SkeletonText className="w-24" />
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Loading>
  );
}
