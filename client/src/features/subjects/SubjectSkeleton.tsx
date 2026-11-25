// A subject page's skeleton (PLAN 14.15): loaded with the app, so the route shows it the moment a subject is opened,
// before the page's own code arrives, and the page shows it while the subject loads. Built from the page's real frame:
// the subject's name (from the address, as it's kept), its counts to come, Up next (signed in, or being checked), and
// the study sets' heading over cards in a set's shape.
import { useParams } from "react-router-dom";
import { subjectName } from "@retainlearn/core";
import { useSession } from "#app/session.ts";
import { buttonClass } from "#components/ui/Button.tsx";
import { cardClass } from "#components/ui/Card.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { Page } from "#components/ui/Page.tsx";
import { Loading, SkeletonBlock, SkeletonText } from "#components/ui/Skeleton.tsx";

export const SETS_HEADING = "flex items-baseline gap-2 font-display text-xl font-semibold outline-none";
export const SETS_GRID = "grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3";

export function SubjectSkeleton() {
  const name = subjectName(useParams().name ?? "");
  const signedIn = useSession() !== "out";
  return (
    <Page title={name} eyebrow={<SkeletonText className="w-56" />} back="/subjects">
      <Loading label={`Loading ${name}`} className="space-y-5">
        {signedIn && (
          <div className="panel flex flex-wrap items-center gap-3 bg-surface p-4">
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
            <SkeletonBlock className="h-9 w-40 rounded-xl" />
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
              </div>
            ))}
          </div>
        </div>
      </Loading>
    </Page>
  );
}
