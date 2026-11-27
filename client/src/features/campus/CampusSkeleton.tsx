// The campus's skeleton (PLAN 14.15): loaded with the app, so the route shows it the moment the campus is opened,
// before the campus's own code arrives, and the campus shows it while its data loads. Built from the campus's real
// frame: today's date (the browser knows it), the timetable's section and heading, and the subjects' heading over
// cards in a subject card's shape. The frame's pieces the campus shares with it are here, so the two can't drift.
import type { ReactNode } from "react";
import { cardClass } from "#components/ui/Card.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { Page } from "#components/ui/Page.tsx";
import { Loading, SkeletonBlock, SkeletonCircle, SkeletonText } from "#components/ui/Skeleton.tsx";
import { useToday } from "./campusApi.ts";

export const SUBJECTS_HEADING = "mb-3 font-display text-xl font-semibold";
export const SUBJECTS_GRID = "grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3";

// The player's day ("2026-11-24") in words, as it is where they are: the date alone, so no time zone can shift it.
export const dayName = (day: string) => new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));

// Today's timetable's section: its heading, and how many of the day's periods are done (or that count's placeholder).
export function TimetableSection({ count, children }: { count?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby="timetable-title" className="rounded-2xl border border-ink/7 bg-surface p-3.5">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-lg bg-bell-wash text-bell-ink">
          <Icon name="bell" className="size-4" />
        </span>
        <h2 id="timetable-title" className="text-sm font-semibold">
          Today's timetable
        </h2>
        {count && <span className="ml-auto text-xs text-ink/50 tabular-nums">{count}</span>}
      </div>
      {children}
    </section>
  );
}

// The coach's card (Coach.tsx), above the timetable: shared with this skeleton so the two are the same size.
export const COACH_CARD = "panel mb-5 flex w-full items-center gap-3 bg-surface p-3.5 text-left";

export function CampusSkeleton() {
  const { today } = useToday();
  return (
    <Page title="Your campus" eyebrow={dayName(today)} back={false}>
      <Loading label="Loading your campus">
        <div className={COACH_CARD}>
          <SkeletonBlock className="size-11 shrink-0 rounded-2xl" />
          <span className="min-w-0 flex-1">
            <span className="block font-display text-lg font-semibold">
              <SkeletonText className="w-32" />
            </span>
            <span className="block text-xs">
              <SkeletonText className="w-44" />
            </span>
          </span>
        </div>
        <TimetableSkeleton />
        <div className="mt-8">
          <p className={SUBJECTS_HEADING}>Your subjects</p>
          <div className={SUBJECTS_GRID}>
            {[0, 1, 2].map((i) => (
              <SubjectCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </Loading>
    </Page>
  );
}

// The timetable: its periods' buttons and the box under them as placeholders, the shape of a day with periods (most).
function TimetableSkeleton() {
  return (
    <TimetableSection count={<SkeletonText className="w-16" />}>
      <div className="mb-3 flex items-center gap-1.5 pointer-coarse:gap-2.5">
        {[0, 1, 2].map((i) => (
          <SkeletonCircle key={i} className="size-7 pointer-coarse:size-10" />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-brand/6 p-3">
        <div className="min-w-0 flex-1 basis-48">
          <p className="text-[11px] font-semibold">
            <SkeletonText className="w-28" />
          </p>
          <p className="text-sm leading-snug font-semibold">
            <SkeletonText className="w-48" />
          </p>
          <p className="text-xs">
            <SkeletonText className="w-32" />
          </p>
          <p className="mt-0.5 text-[11px] font-semibold">
            <SkeletonText className="w-40" />
          </p>
        </div>
        <SkeletonBlock className="h-9 w-24 rounded-xl" />
      </div>
    </TimetableSection>
  );
}

// A subject card: its pennant, name, line, chip and mastery bar as placeholders, in their places.
function SubjectCardSkeleton() {
  return (
    <div className={cardClass}>
      <div className="flex items-center gap-2">
        <SkeletonBlock className="h-7 w-1.5 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 font-display text-lg font-semibold">
          <SkeletonText className="w-32" />
        </div>
      </div>
      <p className="mt-1 text-xs">
        <SkeletonText className="w-28" />
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Chip>
          <SkeletonText className="w-20" />
        </Chip>
      </div>
      <div className="mt-auto pt-3">
        <SkeletonBlock className="h-1.5 rounded-full" />
      </div>
    </div>
  );
}
