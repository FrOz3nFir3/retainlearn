// The campus in 2D (/, the prototype's World2D), for a signed-in player: today's timetable, then each subject you
// study as a card (how warm it is, what you missed, what's fading, your mastery), your report card, and a way to add a
// subject. While the session is checked or the campus loads, its skeleton. The coach, the stadium and paths join it
// with their features, and the 3D campus after.
import { Link } from "react-router-dom";
import type { Campus as CampusData, CampusSubject } from "@retainlearn/core";
import { useSession } from "#app/session.ts";
import { Bar } from "#components/ui/Bar.tsx";
import { Button, buttonClass } from "#components/ui/Button.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { Empty } from "#components/ui/Empty.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { Page } from "#components/ui/Page.tsx";
import { Loading, SkeletonBlock } from "#components/ui/Skeleton.tsx";
import { useCampus } from "./campusApi.ts";
import { SUBJECT_STATUS, pennantOf } from "./subjects.ts";
import { Timetable } from "./Timetable.tsx";

const pct = (x: number) => `${Math.round(x * 100)}%`;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
// The player's day ("2026-11-24") in words, as it is where they are: the date alone, so no time zone can shift it.
const dayName = (day: string) => new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));
// A card whose heading link covers it all, with the focus ring and hover drawn on the card (guide: card).
const CARD =
  "relative flex h-full flex-col rounded-2xl border border-ink/7 bg-surface p-4 transition has-[[data-card-link]:focus-visible]:outline-2 has-[[data-card-link]:focus-visible]:outline-offset-2 has-[[data-card-link]:focus-visible]:outline-brand has-[[data-card-link]:hover]:border-brand/35 motion-safe:has-[[data-card-link]:hover]:-translate-y-0.5";
const CARD_LINK = "outline-none after:absolute after:inset-0 after:rounded-2xl";

export default function Campus() {
  const session = useSession();
  const campus = useCampus(session !== "in");
  if (campus.isError) return <Failed retry={() => void campus.refetch()} />;
  if (!campus.data) return <CampusSkeleton />;
  return <CampusView campus={campus.data} />;
}

function CampusSkeleton() {
  return (
    <Page title="Your campus" back={false}>
      <Loading label="Loading your campus" className="space-y-8">
        <SkeletonBlock className="h-40" />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3">
          {[0, 1, 2].map((i) => (
            <SkeletonBlock key={i} className="h-32" />
          ))}
        </div>
      </Loading>
    </Page>
  );
}

function Failed({ retry }: { retry: () => void }) {
  return (
    <Page title="Your campus" back={false}>
      <Empty icon="building" title="Your campus didn't load" body="Check your connection, then try again." action={<Button tone="primary" onClick={retry}>Try again</Button>} />
    </Page>
  );
}

function CampusView({ campus }: { campus: CampusData }) {
  const fading = new Map(campus.fading.map((f) => [f.category, f.count]));
  const subjects = campus.subjects.toSorted((a, b) => a.plot - b.plot);
  return (
    <Page title="Your campus" eyebrow={dayName(campus.day)} back={false}>
      <Timetable campus={campus} />
      <section aria-labelledby="subjects-title" className="mt-8">
        <h2 id="subjects-title" className="mb-3 font-display text-xl font-semibold">
          Your subjects
        </h2>
        {subjects.length === 0 ? (
          <Empty
            icon="building"
            title="Your campus is empty"
            body="Every subject you study becomes a building here, warming up as you learn. Start a class in any subject."
            action={
              <Link to="/subjects" className={buttonClass("primary")}>
                Find a subject
              </Link>
            }
          />
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3">
            {subjects.map((subject) => (
              <li key={subject.category}>
                <SubjectCard subject={subject} fading={fading.get(subject.category) ?? 0} />
              </li>
            ))}
            <li>
              <article className={CARD}>
                <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
                  <Icon name="report" className="size-5 shrink-0 text-brand" />
                  <Link to="/report-card" data-card-link className={CARD_LINK}>
                    Report card
                  </Link>
                </h3>
                <p className="mt-1 text-xs text-ink/50">How you're doing overall, set by set.</p>
              </article>
            </li>
            <li>
              <Link
                to="/subjects"
                className="flex h-full min-h-24 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/15 p-4 text-sm font-semibold text-brand transition-colors hover:border-brand/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <Icon name="plus" className="size-4" /> Add a subject
              </Link>
            </li>
          </ul>
        )}
      </section>
    </Page>
  );
}

// A subject: a building on the campus, as a card. Its pennant colour is the one it has everywhere.
function SubjectCard({ subject, fading }: { subject: CampusSubject; fading: number }) {
  const status = SUBJECT_STATUS[subject.status];
  return (
    <article className={CARD}>
      <header className="flex items-center gap-2">
        <span aria-hidden="true" className="h-7 w-1.5 shrink-0 rounded-full" style={{ background: pennantOf(subject.category) }} />
        <h3 className="min-w-0 flex-1 font-display text-lg font-semibold text-balance">
          <Link to={`/subjects/${encodeURIComponent(subject.category)}`} data-card-link className={CARD_LINK}>
            {subject.category}
          </Link>
        </h3>
        {subject.missed > 0 && <Chip tone="bell">{`${subject.missed} missed`}</Chip>}
      </header>
      <p className="mt-1 text-xs text-ink/50">{`${plural(subject.started, "study set")} started`}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Chip tone={status.tone}>{status.label}</Chip>
        {fading > 0 && <Chip tone="orange">{`${plural(fading, "player card")} fading`}</Chip>}
      </div>
      {subject.started > 0 && (
        <div className="mt-auto pt-3">
          <Bar value={subject.mastery} label={`Mastery of ${subject.category}: ${pct(subject.mastery)}`} />
        </div>
      )}
    </article>
  );
}
