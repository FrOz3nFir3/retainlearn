// The path editor's skeleton (PLAN 14.15): loaded with the app, so /paths/new and /paths/:id/edit show it the moment
// they're opened, before the editor's code (and the path) arrive. Built from the editor's real frame (PathEditor.tsx):
// its heading ("New path", or a placeholder for the path's title), the fields' box with each field's label and shape,
// the steps' heading, and the footer with its buttons.
import { useParams } from "react-router-dom";
import { buttonClass } from "#components/ui/Button.tsx";
import { Page, PageSkeleton } from "#components/ui/Page.tsx";
import { Loading, SkeletonBlock, SkeletonText } from "#components/ui/Skeleton.tsx";
import { cx } from "#utils/cx.ts";
import { PATH_WIDTH } from "./PathSkeleton.tsx";

export const EDITOR_FIELDS = "space-y-4 rounded-2xl border border-ink/[0.07] bg-surface p-4 sm:p-5";
// Stays at the bottom of the screen while the path scrolls: above the phone's tab bar, clear of the safe area.
export const EDITOR_FOOTER =
  "sticky bottom-0 -mx-4 flex flex-wrap items-center gap-2 border-t border-ink/[0.06] bg-mist/95 px-4 py-3 backdrop-blur max-md:bottom-[calc(3.75rem+max(0.25rem,env(safe-area-inset-bottom,0px)))] sm:-mx-6 sm:px-6 md:pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]";

const LABEL = "mb-1.5 text-sm font-semibold";
const HINT = "mt-1 text-xs";

export function PathEditorSkeleton() {
  const { id } = useParams();
  const body = (
    <div className="space-y-5">
      <div className={EDITOR_FIELDS}>
        {["Title", "Subject"].map((label) => (
          <div key={label}>
            <p className={LABEL}>{label}</p>
            <SkeletonBlock className="h-10 w-full rounded-xl" />
            <p className={HINT}>
              <SkeletonText className="w-40" />
            </p>
          </div>
        ))}
        <div>
          <p className={LABEL}>What it's for</p>
          <SkeletonBlock className="h-16 w-full rounded-xl" />
          <p className={HINT}>
            <SkeletonText className="w-64" />
          </p>
        </div>
        <div>
          <p className={LABEL}>Who can see it</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <SkeletonBlock className="h-16 rounded-xl" />
            <SkeletonBlock className="h-16 rounded-xl" />
          </div>
        </div>
        <SkeletonBlock className="h-16 w-full rounded-xl" />
      </div>
      <div className="flex items-center gap-3">
        <p className="flex-1 font-display text-lg font-semibold">Steps</p>
      </div>
      <SkeletonBlock className="h-40 w-full rounded-2xl" />
      <div className={EDITOR_FOOTER}>
        <span className={cx(buttonClass("quiet"), "ml-auto sm:order-3 sm:ml-0")}>Cancel</span>
        <span className={cx(buttonClass("primary"), "sm:order-4")}>{id ? "Save path" : "Create path"}</span>
      </div>
    </div>
  );
  return id ? (
    <PageSkeleton label="Loading the path" width={PATH_WIDTH} eyebrow>
      {body}
    </PageSkeleton>
  ) : (
    <Page title="New path" eyebrow="Skill path" back="/paths" width={PATH_WIDTH} noindex>
      <Loading label="Loading the editor">{body}</Loading>
    </Page>
  );
}
