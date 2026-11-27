// A path page's skeleton (PLAN 14.15): loaded with the app, so /paths/:id shows it the moment it's opened, before the
// page's own code and the path arrive. Built from the page's real frame (Path.tsx): the heading with its placeholders,
// the description's line, the progress block (follow, for a signed-in player or one being checked) and step rows in a
// row's shape. In 3D, the side panel over the campus, as the page.
import { useSession } from "#app/session.ts";
import { buttonClass } from "#components/ui/Button.tsx";
import { PageSkeleton } from "#components/ui/Page.tsx";
import { SkeletonBlock, SkeletonText } from "#components/ui/Skeleton.tsx";
import { useWorld } from "#features/campus/view.ts";
import { cx } from "#utils/cx.ts";

export const PATH_WIDTH = "max-w-3xl";
export const PATH_INTRO = "text-sm text-pretty text-ink/65";
export const PROGRESS_BLOCK = "rounded-2xl bg-brand/6 p-4";
export const STEPS_LIST = "space-y-2";
export const STEP_ROW = "relative flex items-start gap-3 rounded-2xl border bg-surface p-3";
export const STEP_NUMBER = "grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold tabular-nums";

export function PathSkeleton() {
  const world = useWorld();
  const overWorld = world.shown && world.view.kind === "path";
  const signedIn = useSession() !== "out";
  return (
    <PageSkeleton label="Loading the path" width={PATH_WIDTH} panel={overWorld ? "side" : undefined}>
      <div className="space-y-5">
        <p className={PATH_INTRO}>
          <SkeletonText className="w-64" />
        </p>
        <div className={PROGRESS_BLOCK}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-semibold">
              <SkeletonText className="w-24" />
            </span>
            <span className="text-xs">
              <SkeletonText className="w-28" />
            </span>
          </div>
          <SkeletonBlock className="mt-2 h-2 w-full rounded-full" />
          {signedIn && <span className={cx(buttonClass("primary"), "mt-3 w-full")}>Follow this path</span>}
        </div>
        <ol className={STEPS_LIST}>
          {Array.from({ length: 3 }, (_, i) => (
            <li key={i} className={cx(STEP_ROW, "border-ink/8")}>
              <SkeletonBlock className={cx(STEP_NUMBER, "bg-ink/6")} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  <SkeletonText className="w-40" />
                </p>
                <p className="text-xs">
                  <SkeletonText className="w-48" />
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </PageSkeleton>
  );
}
