// The report card's skeleton (PLAN 14.15): loaded with the app, so the route shows it the moment the report card is
// opened, before its own code arrives, and the report card shows it while its data loads. Built from the report card's
// real frame: the overview's tiles with their labels (each value, and the notes most report cards have, to come), the
// study sets' heading, and rows in a set row's shape. The frame's pieces the report card shares with it are here (the
// tiles, the overview, the sets' heading), so the two can't drift.
import type { ReactNode } from "react";
import { buttonClass } from "#components/ui/Button.tsx";
import { cardClass } from "#components/ui/Card.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import type { IconName } from "#components/ui/Icon.tsx";
import { Page } from "#components/ui/Page.tsx";
import { Loading, SkeletonBlock, SkeletonText } from "#components/ui/Skeleton.tsx";
import { cx } from "#utils/cx.ts";

// The overview's tiles, in order. noted: a tile most report cards show a note under (the skeleton keeps its room).
export const OVERVIEW = [
  { key: "subjects", icon: "building", label: "Subjects on your campus" },
  { key: "sets", icon: "layers", label: "Study sets started" },
  { key: "flashcards", icon: "review", label: "Flashcards reviewed" },
  { key: "accuracy", icon: "quiz", label: "Quiz accuracy", noted: true },
  { key: "cards", icon: "cards", label: "Player cards", noted: true },
  { key: "streak", icon: "flame", label: "Streak" },
  { key: "level", icon: "bolt", label: "Level", noted: true },
] as const satisfies readonly { key: string; icon: IconName; label: string; noted?: true }[];
export type TileKey = (typeof OVERVIEW)[number]["key"];
export type TileValue = { value: ReactNode; note?: ReactNode; warn?: boolean };

// The overview: a label and its value, so a description list. Columns as many as fit, with no breakpoints. Each tile
// shares its row's three tracks (label, value, note: a subgrid), so the values line up even where a label wraps.
export function Overview({ values }: { values: Record<TileKey, TileValue> }) {
  return (
    <section aria-label="Overview">
      <dl className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3">
        {OVERVIEW.map((tile) => {
          const { value, note, warn } = values[tile.key];
          return (
            <div key={tile.key} className="row-span-3 grid grid-rows-subgrid gap-y-1 rounded-2xl border border-ink/7 bg-surface p-3.5">
              <dt className="flex items-start gap-2 text-xs text-ink/55">
                <Icon name={tile.icon} className="size-4 shrink-0 text-brand" />
                {tile.label}
              </dt>
              <dd className="font-display text-2xl font-semibold tabular-nums">{value}</dd>
              {note && <dd className={warn ? "text-xs font-semibold text-orange-ink" : "text-xs text-ink/45"}>{note}</dd>}
            </div>
          );
        })}
      </dl>
    </section>
  );
}

// The study sets' heading, with the search beside it (or its placeholder).
export function StudySetsHeading({ search }: { search: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id="sets-title" className="font-display text-xl font-semibold">
          Your study sets
        </h2>
        <p className="text-sm text-pretty text-ink/55">Flashcard review and quiz results for every set you've started.</p>
      </div>
      {search}
    </div>
  );
}

const coming = Object.fromEntries(
  OVERVIEW.map((tile) => [tile.key, { value: <SkeletonText className="w-12" />, note: "noted" in tile ? <SkeletonText className="w-16" /> : undefined }]),
) as Record<TileKey, TileValue>;

export function ReportCardSkeleton() {
  return (
    <Page title="Report card" eyebrow="Your progress" back={false}>
      <Loading label="Loading your report card">
        <Overview values={coming} />
        <div className="mt-8">
          <StudySetsHeading search={<SkeletonBlock className="h-10 w-full rounded-xl sm:w-72" />} />
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <SetRowSkeleton key={i} />
            ))}
          </div>
        </div>
      </Loading>
    </Page>
  );
}

// A set's row: its titles, chips, two measures and the quiz report's button as placeholders, in their places.
function SetRowSkeleton() {
  return (
    <div className={cx("@container", cardClass)}>
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1 basis-56">
          <p className="font-semibold">
            <SkeletonText className="w-48" />
          </p>
          <p className="text-xs">
            <SkeletonText className="w-36" />
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Chip>
            <SkeletonText className="w-14" />
          </Chip>
          <Chip>
            <SkeletonText className="w-20" />
          </Chip>
        </div>
      </div>
      <div className="mt-3 grid gap-3 @lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i}>
            <p className="mb-1 text-xs">
              <SkeletonText className="w-full" />
            </p>
            <SkeletonBlock className="h-1.5 rounded-full" />
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-end">
        <span className={buttonClass("quiet", "sm")}>
          <SkeletonText className="w-20" />
        </span>
      </div>
    </div>
  );
}
