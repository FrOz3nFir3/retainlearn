// The campus's skeleton (PLAN 14.15): loaded with the app, so the route shows it the moment the campus is opened,
// before the campus's own code arrives, and the campus shows it while its data loads. Two, as the campus shows in 2D or
// 3D (this device's last, view.ts):
// - the 2D page's, from its real frame: today's date, the coach's card, the timetable's section and heading, and the
//   subjects' heading over cards in a subject card's shape;
// - the 3D campus's: the world's loading screen under its HUD (the view switch, the map buttons, the slim timetable).
// The frame's pieces the campus shares with them are here, so they can't drift.
import { useEffect } from "react";
import type { ReactNode } from "react";
import { Helmet } from "@dr.pogodin/react-helmet";
import { cardClass } from "#components/ui/Card.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { IconButton } from "#components/ui/IconButton.tsx";
import { Page } from "#components/ui/Page.tsx";
import { Segmented } from "#components/ui/Segmented.tsx";
import { Loading, SkeletonBlock, SkeletonCircle, SkeletonText } from "#components/ui/Skeleton.tsx";
import { cx } from "#utils/cx.ts";
import { useToday } from "./campusApi.ts";
import { PHASES, localHour, phaseOf } from "./daytime.ts";
import { guessView, webglWorks } from "./view.ts";
import type { MapCommand } from "./view.ts";

export const SUBJECTS_HEADING = "mb-3 font-display text-xl font-semibold";
export const SUBJECTS_GRID = "grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3";

// The player's day ("2026-11-24") in words, as it is where they are: the date alone, so no time zone can shift it.
export const dayName = (day: string) => new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));

// Today's timetable's look: a section of the 2D page ("page"), or the 3D campus's slim bar ("slim", the prototype's),
// its period buttons in its header and its lines cut short to keep it low.
export const TIMETABLE_LOOK = {
  page: {
    dots: "mb-3 flex items-center gap-1.5 pointer-coarse:gap-2.5",
    dot: "size-7 pointer-coarse:size-10",
    box: "flex flex-wrap items-center gap-3 rounded-2xl bg-brand/6 p-3",
    text: "min-w-0 flex-1 basis-48",
    line: "text-pretty",
  },
  slim: {
    dots: "ml-1 flex items-center gap-1 pointer-coarse:gap-1.5",
    dot: "size-6 pointer-coarse:size-8",
    box: "flex items-center gap-3 rounded-2xl bg-brand/6 p-3",
    text: "min-w-0 flex-1",
    line: "truncate",
  },
} as const;
export type TimetableLook = keyof typeof TIMETABLE_LOOK;

// Today's timetable's section: its heading, how many of the day's periods are done (or that count's placeholder), and
// in the slim bar the period buttons beside the heading (dots).
type SectionProps = { look?: TimetableLook; count?: ReactNode; dots?: ReactNode; children: ReactNode };
export function TimetableSection({ look = "page", count, dots, children }: SectionProps) {
  const slim = look === "slim";
  return (
    <section aria-labelledby="timetable-title" className={slim ? HUD_TIMETABLE : "rounded-2xl border border-ink/7 bg-surface p-3.5"}>
      <div className={cx("flex items-center gap-2", slim ? "mb-2.5" : "mb-3")}>
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-bell-wash text-bell-ink">
          <Icon name="bell" className="size-4" />
        </span>
        <h2 id="timetable-title" className="text-sm font-semibold whitespace-nowrap">
          Today's timetable
        </h2>
        {dots}
        {/* On a phone the slim bar's buttons say it: the words would push the heading onto two lines. */}
        {count && <span className={cx("ml-auto text-xs text-ink/50 tabular-nums", slim && "whitespace-nowrap max-sm:sr-only")}>{count}</span>}
      </div>
      {children}
    </section>
  );
}

// The coach's card (Coach.tsx), above the timetable: shared with this skeleton so the two are the same size.
export const COACH_CARD = "panel mb-5 flex w-full items-center gap-3 bg-surface p-3.5 text-left";

// The 3D campus's frame (Campus3D.tsx): the world fills the screen under the bars, and the HUD floats over it. Its
// controls sit top right, under the top bar; the slim timetable bottom left, over the tab bar on phones.
export const WORLD_LAYER = "campus-world fixed inset-0 bg-chalk";
export const HUD_LAYER = "pointer-events-none absolute inset-0 z-10";
export const HUD_CONTROLS = "absolute top-[4.25rem] right-3 flex flex-col items-end gap-2 sm:top-20 sm:right-5";
const HUD_TIMETABLE =
  "panel pointer-events-auto absolute inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] p-3 md:right-auto md:bottom-4 md:left-5 md:w-[min(460px,calc(100vw-2.5rem))]";

// The campus as you see it: 3D or the 2D map, on the campus itself in both (the prototype's CampusControls).
const VIEWS = [
  { value: true, label: "3D", icon: "cube" },
  { value: false, label: "2D map", icon: "grid" },
] as const;
export function ViewSwitch({ in3d, onPick }: { in3d: boolean; onPick?: (in3d: boolean) => void }) {
  return <Segmented label="Campus view" items={VIEWS} value={in3d} onChange={(value) => onPick?.(value)} />;
}

// The map's buttons, under the switch on a computer (a phone has pinch and two-finger turns).
const MAP_BUTTONS: { icon: "plus" | "minus" | "rotateLeft" | "rotateRight" | "home"; label: string; kind: MapCommand["kind"]; value: number }[] = [
  { icon: "plus", label: "Zoom in", kind: "zoom", value: 0.8 },
  { icon: "minus", label: "Zoom out", kind: "zoom", value: 1.25 },
  { icon: "rotateLeft", label: "Turn left", kind: "rotate", value: Math.PI / 4 },
  { icon: "rotateRight", label: "Turn right", kind: "rotate", value: -Math.PI / 4 },
  { icon: "home", label: "Show the whole campus", kind: "home", value: 0 },
];
export function MapButtons({ onCommand }: { onCommand?: (kind: MapCommand["kind"], value: number) => void }) {
  return (
    <div role="group" aria-label="Map" className="panel pointer-events-auto hidden flex-col rounded-2xl p-1 md:flex">
      {MAP_BUTTONS.map((b) => (
        <IconButton key={b.icon} icon={b.icon} label={b.label} onClick={() => onCommand?.(b.kind, b.value)} />
      ))}
    </div>
  );
}

// The world while its code and models load: the sky of the hour fading down to the campus's green, and a line saying so.
export function WorldBackdrop() {
  const sky = PHASES[phaseOf(localHour())].sky;
  return (
    <div className="absolute inset-0 grid place-items-center" style={{ background: `linear-gradient(${sky} 10%, color-mix(in oklab, ${sky} 55%, #b8d4c0))` }}>
      <p className="rounded-full bg-surface/85 px-4 py-2 text-sm font-semibold text-ink/70 shadow-sm motion-safe:animate-pulse">Opening your campus</p>
    </div>
  );
}

export function CampusSkeleton() {
  return guessView() ? <Campus3DSkeleton /> : <Campus2DSkeleton />;
}

export const CAMPUS_TITLE = "Your campus - RetainLearn";

function Campus3DSkeleton() {
  // The world's code (and with it its models) starts loading now, beside the campus's own code and data.
  useEffect(() => void import("./scene/World.tsx"), []);
  return (
    <div className={WORLD_LAYER}>
      <Helmet>
        <title>{CAMPUS_TITLE}</title>
      </Helmet>
      <h1 className="sr-only">Your campus</h1>
      <Loading label="Loading your campus">
        <WorldBackdrop />
        <div className={HUD_LAYER}>
          <div className={HUD_CONTROLS} inert>
            <div className="panel rounded-2xl p-1">
              <ViewSwitch in3d />
            </div>
            <MapButtons />
          </div>
          <TimetableSkeleton look="slim" />
        </div>
      </Loading>
    </div>
  );
}

function Campus2DSkeleton() {
  const { today } = useToday();
  return (
    <Page title="Your campus" eyebrow={dayName(today)} back={false} actions={webglWorks() ? <ViewSwitchSkeleton /> : undefined}>
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

// The 2D page's switch as it will be, out of reach until the page is there.
function ViewSwitchSkeleton() {
  return (
    <div inert aria-hidden="true">
      <ViewSwitch in3d={false} />
    </div>
  );
}

// The timetable: its periods' buttons and the box under them as placeholders, the shape of a day with periods (most).
function TimetableSkeleton({ look = "page" }: { look?: TimetableLook }) {
  const shape = TIMETABLE_LOOK[look];
  const dots = (
    <div className={shape.dots}>
      {[0, 1, 2].map((i) => (
        <SkeletonCircle key={i} className={shape.dot} />
      ))}
    </div>
  );
  return (
    <TimetableSection look={look} count={<SkeletonText className="w-16" />} dots={look === "slim" ? dots : undefined}>
      {look === "page" && dots}
      <div className={shape.box}>
        <div className={shape.text}>
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
        <SkeletonBlock className="h-9 w-24 shrink-0 rounded-xl" />
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
