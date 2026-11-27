// The campus in 2D (/, the prototype's World2D), for a signed-in player: your coach (Coach.tsx), today's timetable,
// then each subject you study as a card (how warm it is, what you missed, what's fading, your mastery), your report
// card, and a way to add a subject. While the session is checked or the campus loads, its skeleton. The stadium and
// paths join it with their features, and the 3D campus after.
import { Link } from "react-router-dom";
import type { Campus as CampusData, CampusSubject } from "@retainlearn/core";
import { useMyUsername } from "#app/hooks.ts";
import { useSession } from "#app/session.ts";
import { Bar } from "#components/ui/Bar.tsx";
import { Button, buttonClass } from "#components/ui/Button.tsx";
import { cardClass, cardLinkClass } from "#components/ui/Card.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { Empty } from "#components/ui/Empty.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { Page } from "#components/ui/Page.tsx";
import { useCampus } from "./campusApi.ts";
import { CampusSkeleton, SUBJECTS_GRID, SUBJECTS_HEADING, dayName } from "./CampusSkeleton.tsx";
import { CoachCard, CoachTalk, useCoach } from "./Coach.tsx";
import { SUBJECT_STATUS, pennantOf, subjectPath } from "./subjects.ts";
import { Timetable } from "./Timetable.tsx";

const pct = (x: number) => `${Math.round(x * 100)}%`;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export default function Campus() {
  const session = useSession();
  const campus = useCampus(session !== "in");
  if (campus.isError) return <Failed retry={() => void campus.refetch()} />;
  if (!campus.data) return <CampusSkeleton />;
  return <CampusView campus={campus.data} />;
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
  const coach = useCoach(campus, useMyUsername());
  return (
    <Page title="Your campus" eyebrow={dayName(campus.day)} back={false}>
      <CoachCard who={coach.who} news={coach.news} onTalk={coach.open} />
      {coach.line && <CoachTalk who={coach.who} line={coach.line} lines={coach.lines} onNext={coach.next} onDone={coach.done} />}
      <Timetable campus={campus} />
      <section aria-labelledby="subjects-title" className="mt-8">
        <h2 id="subjects-title" className={SUBJECTS_HEADING}>
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
          <ul className={SUBJECTS_GRID}>
            {subjects.map((subject) => (
              <li key={subject.category}>
                <SubjectCard subject={subject} fading={fading.get(subject.category) ?? 0} />
              </li>
            ))}
            <li>
              <article className={cardClass}>
                <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
                  <Icon name="report" className="size-5 shrink-0 text-brand" />
                  <Link to="/report-card" data-card-link className={cardLinkClass}>
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
    <article className={cardClass}>
      <header className="flex items-center gap-2">
        <span aria-hidden="true" className="h-7 w-1.5 shrink-0 rounded-full" style={{ background: pennantOf(subject.category) }} />
        <h3 className="min-w-0 flex-1 font-display text-lg font-semibold text-balance">
          <Link to={subjectPath(subject.category)} data-card-link className={cardLinkClass}>
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
