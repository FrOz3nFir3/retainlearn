// A subject page's skeleton (PLAN 14.15): loaded with the app, so the route shows it the moment a subject is opened,
// before the page's own code arrives, and the page shows it while the subject loads. Built from the page's real frame:
// the subject's name (from the address, as it's kept), its counts to come, on a phone "Add to my campus" (signed in,
// unless your campus is loaded and has the subject), Up next (signed in, or being checked), and the study sets' heading
// over cards in a set's shape. In 3D it's a panel over the world, as the page is: the lobby's for a subject on your
// campus, the list's (the same content, a wider panel) for one off it.
import { useParams } from "react-router-dom";
import { subjectName } from "@retainlearn/core";
import { useSession } from "#app/session.ts";
import { useCampus } from "#features/campus/campusApi.ts";
import { keptSubjects, plays3d, useBroken, useWorld } from "#features/campus/view.ts";
import { cx } from "#utils/cx.ts";
import { buttonClass } from "#components/ui/Button.tsx";
import { cardClass } from "#components/ui/Card.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { Page } from "#components/ui/Page.tsx";
import { Loading, SkeletonBlock, SkeletonText } from "#components/ui/Skeleton.tsx";

export const SETS_HEADING = "flex items-baseline gap-2 font-display text-xl font-semibold outline-none";
export const SETS_GRID = "grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3";
// "Add to my campus" on a phone: the whole width, under the title (beside it on wider screens).
export const ADD_ON_PHONE = "w-full sm:hidden";
// In 3D, the note on a subject off your campus: it has no building, so its page is the list (the prototype's note). The
// page and its skeleton both show it.
export function OffCampusNote() {
  return <p className="text-xs text-pretty text-ink/50">This subject isn't on your campus yet, so it shows as a list. Add it to see its building.</p>;
}

export function SubjectSkeleton() {
  const name = subjectName(useParams().name ?? "");
  const session = useSession();
  const signedIn = session !== "out";
  const campus = useCampus(session !== "in");
  // Before your campus loads (a page opened straight from its address), this browser's copy of its subjects says.
  const onCampus = campus.data ? campus.data.subjects.some((s) => s.category === name) : keptSubjects().includes(name);
  const world = useWorld();
  const overWorld = world.shown && world.view.kind === "building";
  const broken = useBroken();
  if (overWorld && onCampus) return <LobbySkeleton name={name} />;
  return (
    <Page title={name} eyebrow={<SkeletonText className="w-56" />} back="/subjects" panel={overWorld ? "list" : undefined}>
      <Loading label={`Loading ${name}`} className="space-y-5">
        {signedIn && !onCampus && plays3d(campus.data) && !broken && <OffCampusNote />}
        {signedIn && !onCampus && (
          <span className={cx(buttonClass("primary"), ADD_ON_PHONE)}>
            <Icon name="plus" className="size-4 shrink-0" />
            Add to my campus
          </span>
        )}
        {signedIn && (
          <div className={cx("flex flex-wrap items-center gap-3", overWorld ? "rounded-2xl bg-brand/6 p-3" : "panel bg-surface p-4")}>
            <SkeletonBlock className="size-10 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 basis-48">
              <p className="text-xs">
                <SkeletonText className="w-20" />
              </p>
              <p className="font-semibold">
                <SkeletonText className="w-40" />
              </p>
              <p className="text-sm">
                <SkeletonText className="w-28" />
              </p>
            </div>
            <span className={buttonClass("primary")}>Start</span>
          </div>
        )}
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className={SETS_HEADING}>
              Study sets
              <span className="text-sm font-normal">
                <SkeletonText className="w-4" />
              </span>
            </p>
            <span className={buttonClass("quiet")}>
              {signedIn && <Icon name="plus" className="size-4 shrink-0" />}
              {signedIn ? "New study set" : "Sign in to add a study set"}
            </span>
          </div>
          <div className={SETS_GRID}>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className={cardClass}>
                <p className="text-xs">
                  <SkeletonText className="w-20" />
                </p>
                <p className="font-semibold">
                  <SkeletonText className="w-36" />
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Chip>
                    <SkeletonText className="w-16" />
                  </Chip>
                </div>
                {/* Signed in, each set's next class, one tap away. */}
                {signedIn && (
                  <div className="mt-auto pt-3">
                    <span className={cx(buttonClass("quiet", "sm"), "w-full justify-start!")}>
                      <SkeletonText className="w-20" />
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Loading>
    </Page>
  );
}

// In 3D, the page is its building's lobby (Subject.tsx): the panel's frame, Up next here and the study sets' heading
// with the lift's line, as placeholders in their places.
function LobbySkeleton({ name }: { name: string }) {
  return (
    <Page title={name} eyebrow={<SkeletonText className="w-48" />} back="/" panel="lobby">
      <Loading label={`Loading ${name}`} className="space-y-5">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-brand/6 p-3">
          <SkeletonBlock className="size-10 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 basis-48">
            <p className="text-xs">
              <SkeletonText className="w-20" />
            </p>
            <p className="font-semibold">
              <SkeletonText className="w-36" />
            </p>
            <p className="text-sm">
              <SkeletonText className="w-24" />
            </p>
          </div>
          <span className={buttonClass("primary")}>Start</span>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="flex items-baseline gap-1.5 text-sm font-semibold">
              Study sets
              <span className="text-xs font-normal">
                <SkeletonText className="w-4" />
              </span>
            </p>
          </div>
          <p className="mt-1.5 text-[11px]">
            <SkeletonText className="w-36" />
          </p>
        </div>
      </Loading>
    </Page>
  );
}
