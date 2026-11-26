// The classroom's skeleton (PLAN 14.15): loaded with the app, so the route shows it the moment a classroom is opened,
// before the classroom's own code arrives, and the classroom shows it while the set, your progress and your settings
// load. Built from the classroom's real frame: the heading's placeholders (and Edit's, signed in), how you stand
// (signed in, or being checked) or a guest's note, Study with what each round shows, Up next, the rounds' heading
// over rows in a round's shape, the teacher's desk, the noticeboard, and "Report this set".
import { useSession } from "#app/session.ts";
import { buttonClass } from "#components/ui/Button.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import type { IconName } from "#components/ui/Icon.tsx";
import { PageSkeleton } from "#components/ui/Page.tsx";
import { Segmented } from "#components/ui/Segmented.tsx";
import { SkeletonBlock, SkeletonText } from "#components/ui/Skeleton.tsx";
import { cx } from "#utils/cx.ts";

export const STUDY_VIEWS_ITEMS = [
  { value: "both", label: "Both" },
  { value: "review", label: "Review", icon: "review" },
  { value: "quiz", label: "Quiz", icon: "quiz" },
] as const;
export const DESK_ROW = "flex items-center gap-3 px-3.5 py-2.5 text-sm hover:bg-ink/[0.03] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand";

export function ClassroomSkeleton() {
  const signedIn = useSession() !== "out";
  const desk: [IconName, string][] = [
    ["review", "Flashcards"],
    ["quiz", "Quiz questions"],
    ...(signedIn ? [["inbox", "Review queue"] as [IconName, string]] : []),
    ["clock", "History"],
  ];
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
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="font-display text-xl font-semibold">Study</p>
            <div className="pointer-events-none ml-auto w-full max-w-[17rem]" inert>
              <Segmented label="What each round shows" items={STUDY_VIEWS_ITEMS} value="both" onChange={() => {}} />
            </div>
          </div>
          <div className={cx(buttonClass("primary"), "w-full !justify-start gap-3 !px-4 !py-3")}>
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/15" />
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold text-white/70">Up next</span>
              <span className="block text-[15px] leading-tight">
                <SkeletonText className="w-48" />
              </span>
              <span className="block text-xs">
                <SkeletonText className="w-56" />
              </span>
            </span>
          </div>
          <div className="pt-2">
            <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <p className="font-semibold">Rounds</p>
              <span className="text-xs">
                <SkeletonText className="w-24" />
              </span>
              <span className={cx(buttonClass("quiet", "sm"), "ml-auto")}>
                {signedIn && <Icon name="layers" className="size-4 shrink-0" />}
                {signedIn ? "Change order" : "Sign in to change the order"}
              </span>
            </div>
            <div className="divide-y divide-ink/[0.06] overflow-hidden rounded-2xl border border-ink/[0.08] bg-surface">
              {[0, 1, 2].map((i) => (
                <RoundRowSkeleton key={i} />
              ))}
            </div>
            <p className="mt-1.5 text-xs text-ink/50">Open a round to see its flashcards and quiz questions.</p>
          </div>
        </div>
        <div>
          <p className="mb-2 font-display text-xl font-semibold">Teacher's desk</p>
          <div className="divide-y divide-ink/[0.06] overflow-hidden rounded-2xl border border-ink/[0.08] bg-surface">
            {desk.map(([icon, label]) => (
              <div key={label} className={DESK_ROW}>
                <Icon name={icon} className="size-4 shrink-0 text-ink/50" />
                <span className="flex-1 font-medium">{signedIn ? label : `See its ${label.toLowerCase()}`}</span>
                <span className="text-xs">
                  <SkeletonText className="w-16" />
                </span>
                <Icon name="chevronRight" className="size-4 shrink-0 text-ink/30" />
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-ink/50">{signedIn ? "The set's reviewers change it directly; anyone else's changes wait for one of them to accept." : "Sign in to suggest changes."}</p>
        </div>
        <div>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <p className="font-display text-xl font-semibold">Noticeboard</p>
            <span className="text-xs font-semibold text-brand">All changes</span>
          </div>
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-ink/[0.07] bg-surface px-3 py-2.5">
                <p className="text-sm">
                  <SkeletonText className="w-3/4" />
                </p>
                <p className="mt-0.5 text-xs">
                  <SkeletonText className="w-32" />
                </p>
              </div>
            ))}
          </div>
        </div>
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

// A round: its name, its two buttons and its topics, as placeholders in their places.
function RoundRowSkeleton() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 px-3 py-2">
      <span className="flex min-h-7 items-center gap-1.5">
        <Icon name="chevronRight" className="size-4 shrink-0 text-ink/40" />
        <span className="text-sm font-semibold">
          <SkeletonText className="w-16" />
        </span>
      </span>
      <span className="flex items-center gap-1.5">
        {[0, 1].map((i) => (
          <span key={i} className="flex min-h-7 items-center rounded-lg border border-ink/12 px-2 text-[11px] font-semibold pointer-coarse:min-h-9">
            <SkeletonText className="w-14" />
          </span>
        ))}
      </span>
      <p className="col-span-2 mt-0.5 pl-[22px] text-xs">
        <SkeletonText className="w-2/3" />
      </p>
    </div>
  );
}
