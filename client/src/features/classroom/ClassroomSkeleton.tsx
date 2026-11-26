// The classroom's skeleton (PLAN 14.15): loaded with the app, so the route shows it the moment a classroom is opened,
// before the classroom's own code arrives, and the classroom shows it while the set and your progress load. Built from
// the classroom's real frame: the heading's placeholders (and Edit's, signed in), how you stand (signed in, or being
// checked) or a guest's note, Up next, the rounds' heading over rows in a round's shape, and "Report this set".
import { useSession } from "#app/session.ts";
import { buttonClass } from "#components/ui/Button.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { PageSkeleton } from "#components/ui/Page.tsx";
import { SkeletonBlock, SkeletonText } from "#components/ui/Skeleton.tsx";
import { cx } from "#utils/cx.ts";

export function ClassroomSkeleton() {
  const signedIn = useSession() !== "out";
  return (
    <PageSkeleton
      label="Loading the classroom"
      width="max-w-3xl"
      actions={
        signedIn && (
          <span className={buttonClass("quiet", "sm")}>
            <SkeletonText className="w-6" />
          </span>
        )
      }
    >
      <div className="space-y-5">
        {signedIn ? (
          <div className="panel bg-surface p-4">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-3xl font-semibold">
                <SkeletonText className="w-16" />
              </span>
            </div>
            <SkeletonBlock className="mt-1.5 h-2 rounded-full" />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["w-28", "w-24"].map((w) => (
                <Chip key={w}>
                  <SkeletonText className={w} />
                </Chip>
              ))}
            </div>
          </div>
        ) : (
          <p className="rounded-2xl bg-bell-wash px-3.5 py-3 text-sm">
            <SkeletonText className="w-full" />
            <SkeletonText className="w-1/2" />
          </p>
        )}
        <div className="panel flex items-center gap-3 bg-surface p-4">
          <SkeletonBlock className="size-10 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              <SkeletonText className="w-44" />
            </p>
            <p className="text-sm">
              <SkeletonText className="w-64" />
            </p>
          </div>
          <span className={buttonClass("quiet")}>
            <SkeletonText className="w-9" />
          </span>
        </div>
        <section>
          <p className="mb-2 font-display text-xl font-semibold">Rounds</p>
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <RoundRowSkeleton key={i} />
            ))}
          </div>
        </section>
        {signedIn && (
          <span className={cx(buttonClass("quiet", "sm"), "border-transparent bg-transparent text-ink/55")}>
            <Icon name="flag" className="size-4 shrink-0" />
            Report this set
          </span>
        )}
      </div>
    </PageSkeleton>
  );
}

// A round: its number, topic, a chip and its two buttons as placeholders, in their places.
function RoundRowSkeleton() {
  return (
    <div className="rounded-2xl border border-ink/[0.07] bg-surface p-4">
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <SkeletonBlock className="size-9 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            <SkeletonText className="w-56" />
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Chip>
              <SkeletonText className="w-28" />
            </Chip>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {[0, 1].map((i) => (
            <span key={i} className={buttonClass("quiet", "sm")}>
              <SkeletonText className="w-10" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
