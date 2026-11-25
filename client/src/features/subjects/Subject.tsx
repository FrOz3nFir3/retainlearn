// A subject's page (/subjects/:name, the prototype's BuildingHud as a list): its study sets, how you stand in it,
// which set is up next there, and a new study set. A signed-in player can put the subject on their campus, or take it
// off while they haven't started it. Your progress comes from your report card and your campus, which the app keeps
// already, so the page itself asks only for the subject's sets. The search, the order and the page are in the address.
import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import type { CampusSubject, ReportCard, Subject as SubjectData } from "@retainlearn/core";
import { useSession } from "#app/session.ts";
import { Bar } from "#components/ui/Bar.tsx";
import { Button, buttonClass } from "#components/ui/Button.tsx";
import { cardClass, cardLinkClass } from "#components/ui/Card.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { Empty } from "#components/ui/Empty.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { Page } from "#components/ui/Page.tsx";
import { Pager, usePageHeading } from "#components/ui/Pager.tsx";
import { SearchInput } from "#components/ui/SearchInput.tsx";
import { Segmented } from "#components/ui/Segmented.tsx";
import { Loading, SkeletonBlock, SkeletonLine } from "#components/ui/Skeleton.tsx";
import { browserTimeZone, useCampus, useToday } from "#features/campus/campusApi.ts";
import { SET_STATUS_TONE, subjectPath } from "#features/campus/subjects.ts";
import { setPath } from "#features/classes/modes.ts";
import { useReportCard } from "#features/report-card/reportCardApi.ts";
import { daysAgoInWords } from "#features/report-card/reportCardStats.ts";
import { NewStudySet } from "./NewStudySet.tsx";
import { matchesSearch, ordered, subjectProgress, upNextHere } from "./subjectProgress.ts";
import type { Order, Room } from "./subjectProgress.ts";
import { problemOf, useAddSubjectMutation, useGetSubjectQuery, useRemoveSubjectMutation } from "./subjectsApi.ts";

const SETS_PER_PAGE = 12;
const pct = (x: number) => `${Math.round(x * 100)}%`;
const plural = (n: number, word: string) => `${n.toLocaleString("en")} ${word}${n === 1 ? "" : "s"}`;
const ORDERS = [
  { value: "building", label: "Building order" },
  { value: "attention", label: "Needs attention" },
] as const;

export default function Subject() {
  const { name = "" } = useParams();
  const subject = useGetSubjectQuery(name);
  const session = useSession();
  const signedIn = session === "in";
  const campus = useCampus(!signedIn);
  const card = useReportCard(!signedIn);
  if (subject.isError) {
    const badName = (subject.error as { status?: unknown }).status === 400;
    return badName ? <NotASubject /> : <Failed retry={() => void subject.refetch()} />;
  }
  // Signed in, the page waits for your progress too (or for it to fail), so the sets' statuses don't pop in late.
  const waiting = session === "checking" || (signedIn && ((!card.data && !card.isError) || (!campus.data && !campus.isError)));
  if (!subject.data || waiting) return <SubjectSkeleton />;
  const onCampus = signedIn && campus.data ? (campus.data.subjects.find((s) => s.category === subject.data?.name) ?? false) : null;
  return <SubjectView subject={subject.data} card={signedIn ? (card.data ?? null) : null} onCampus={onCampus} signedIn={signedIn} />;
}

function SubjectSkeleton() {
  return (
    <div className="flex-1 bg-mist">
      <Loading label="Loading the subject" className="mx-auto max-w-5xl space-y-5 px-4 pt-5 sm:px-6">
        <SkeletonLine className="h-8 w-1/3" />
        <SkeletonBlock className="h-24" />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonBlock key={i} className="h-32" />
          ))}
        </div>
      </Loading>
    </div>
  );
}

function NotASubject() {
  return (
    <Page title="Not a subject" back="/subjects" noindex>
      <Empty icon="x" title="This isn't a subject's address" body="A subject's name can't have / ? # % or \ in it. Find it among the subjects." action={<Link to="/subjects" className={buttonClass("primary")}>Browse subjects</Link>} />
    </Page>
  );
}

function Failed({ retry }: { retry: () => void }) {
  return (
    <Page title="Subject" back="/subjects" noindex>
      <Empty icon="layers" title="This subject didn't load" body="Check your connection, then try again." action={<Button tone="primary" onClick={retry}>Try again</Button>} />
    </Page>
  );
}

type Notice = { tone: "done" | "failed"; text: string };

// onCampus: the subject on your campus, false when it isn't there, null when signed out (or the campus didn't load).
function SubjectView({ subject, card, onCampus, signedIn }: { subject: SubjectData; card: ReportCard | null; onCampus: CampusSubject | false | null; signedIn: boolean }) {
  const when = useToday();
  const [params, setParams] = useSearchParams();
  const search = (params.get("search") ?? "").trim();
  const order: Order = signedIn && params.get("order") === "attention" ? "attention" : "building";
  const { rooms, stats } = useMemo(() => subjectProgress(subject, card, when), [subject, card, when]);
  const next = signedIn ? upNextHere(rooms) : null;
  const found = useMemo(() => ordered(rooms, order).filter((r) => matchesSearch(r.set, search)), [rooms, order, search]);
  const pages = Math.max(1, Math.ceil(found.length / SETS_PER_PAGE));
  const page = Math.min(pages, Math.max(1, Math.floor(Number(params.get("page"))) || 1));
  const shown = found.slice((page - 1) * SETS_PER_PAGE, page * SETS_PER_PAGE);
  const heading = usePageHeading(page);
  const [newOpen, setNewOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [addSubject, adding] = useAddSubjectMutation();
  const [removeSubject, removing] = useRemoveSubjectMutation();
  const home = subjectPath(subject.name);

  // The address for a change of search, order or page (page 1, the building order and no search are left out).
  const paramsWith = (change: { search?: string; order?: Order; page?: number }) => {
    const query = new URLSearchParams();
    const s = change.search ?? search;
    const o = change.order ?? order;
    const p = change.page ?? page;
    if (s) query.set("search", s);
    if (o === "attention") query.set("order", o);
    if (p > 1) query.set("page", String(p));
    return query;
  };
  const hrefFor = (p: number) => {
    const query = paramsWith({ page: p }).toString();
    return query ? `${home}?${query}` : home;
  };

  const run = async (action: () => Promise<unknown>, done: string, failed: string) => {
    setNotice(null);
    try {
      await action();
      setNotice({ tone: "done", text: done });
    } catch (error) {
      setNotice({ tone: "failed", text: problemOf(error, failed) });
    }
  };
  const addToCampus = () =>
    void run(() => addSubject({ name: subject.name, tz: browserTimeZone() }).unwrap(), `${subject.name} is on your campus now.`, `${subject.name} wasn't added. Check your connection, then try again.`);
  const takeOff = () =>
    void run(() => removeSubject(subject.name).unwrap(), `${subject.name} is off your campus. Add it again any time.`, `${subject.name} wasn't taken off. Check your connection, then try again.`);

  const counts = `${plural(subject.sets.length, "study set")}, ${plural(stats.flashcards, "flashcard")}, ${plural(stats.questions, "question")}`;
  return (
    <Page
      title={subject.name}
      eyebrow={counts}
      back="/subjects"
      description={`Study ${subject.name} on RetainLearn: ${counts}, reviewed and quizzed until they stick.`}
      noindex={subject.sets.length === 0}
      actions={
        onCampus === false && (
          <Button tone="primary" size="sm" icon="plus" disabled={adding.isLoading} onClick={addToCampus}>
            Add to my campus
          </Button>
        )
      }
    >
      <div className="space-y-5">
        <div role="status" className="empty:hidden">
          {notice && <p className={notice.tone === "done" ? "rounded-2xl bg-mint-wash px-3.5 py-2.5 text-sm text-mint-ink" : "rounded-2xl bg-rose-wash px-3.5 py-2.5 text-sm text-rose-ink"}>{notice.text}</p>}
        </div>

        {signedIn && stats.started > 0 && (
          <section aria-label={`How you stand in ${subject.name}`} className="panel bg-surface p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-display text-3xl font-semibold tabular-nums">{pct(stats.mastery)}</span>
              <span className="text-xs text-ink/50">{`mastery, ${plural(stats.started, "set")} started`}</span>
            </div>
            <Bar value={stats.mastery} label={`Mastery of ${subject.name}`} className="mt-1.5 h-2" />
            {stats.missed > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {stats.missedFlashcards > 0 && <Chip tone="bell">{`Points missed on ${plural(stats.missedFlashcards, "flashcard")}`}</Chip>}
                {stats.missedQuestions > 0 && <Chip tone="rose">{`${plural(stats.missedQuestions, "question")} missed`}</Chip>}
              </div>
            )}
          </section>
        )}

        {next ? (
          <section aria-label="Up next here" className="panel flex flex-wrap items-center gap-3 bg-surface p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
              <Icon name="focus" className="size-5" />
            </span>
            <div className="min-w-0 flex-1 basis-48">
              <p className="text-xs text-ink/50">Up next here</p>
              <p className="font-semibold text-balance">{next.room.set.subtopic}</p>
              <p className="text-sm text-ink/55">{next.why}</p>
            </div>
            <Link to={setPath(next.room.set._id)} className={buttonClass("primary")}>
              Open its classroom
            </Link>
          </section>
        ) : (
          signedIn &&
          stats.started > 0 && (
            <section aria-label="Up next here" className="rounded-2xl bg-mint-wash p-4 text-mint-ink">
              <p className="font-semibold">All caught up here</p>
              <p className="text-sm">Nothing missed, nothing fading and nothing new. A quiz keeps it that way.</p>
            </section>
          )
        )}

        <section aria-labelledby="sets-title">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 id="sets-title" ref={heading} tabIndex={-1} className="flex items-baseline gap-2 font-display text-xl font-semibold outline-none">
              {search ? `Study sets matching “${search}”` : "Study sets"}
              <span className="text-sm font-normal text-ink/50 tabular-nums">{found.length.toLocaleString("en")}</span>
            </h2>
            {signedIn ? (
              <Button icon="plus" onClick={() => setNewOpen(true)}>
                New study set
              </Button>
            ) : (
              <Link to="/sign-in" state={{ returnTo: home }} className={buttonClass("quiet")}>
                Sign in to add a study set
              </Link>
            )}
          </div>
          {(rooms.length > SETS_PER_PAGE || search || (signedIn && rooms.length > 1)) && (
            <div className="mb-3 flex flex-wrap items-center gap-3">
              {(rooms.length > SETS_PER_PAGE || search) && (
                <search className="min-w-0 flex-1 basis-56">
                  <form action={home} method="get" onSubmit={(e) => e.preventDefault()}>
                    <SearchInput
                      name="search"
                      label={`Search ${subject.name}'s study sets`}
                      placeholder="Search these study sets"
                      value={params.get("search") ?? ""}
                      onChange={(value) => setParams(paramsWith({ search: value, page: 1 }), { replace: true })}
                    />
                  </form>
                </search>
              )}
              {signedIn && rooms.length > 1 && (
                <Segmented label="Order of the study sets" items={ORDERS} value={order} onChange={(value) => setParams(paramsWith({ order: value, page: 1 }), { replace: true })} />
              )}
            </div>
          )}
          <p role="status" className="sr-only">
            {search ? `${plural(found.length, "study set")} found` : ""}
          </p>

          {rooms.length === 0 ? (
            <Empty
              icon="layers"
              title={`No study sets in ${subject.name} yet`}
              body="Make the first: give it a topic and the part of it it covers, then add its flashcards."
              action={
                signedIn ? (
                  <Button tone="primary" icon="plus" onClick={() => setNewOpen(true)}>
                    New study set
                  </Button>
                ) : (
                  <Link to="/sign-in" state={{ returnTo: home }} className={buttonClass("primary")}>
                    Sign in to make one
                  </Link>
                )
              }
            />
          ) : shown.length === 0 ? (
            <Empty icon="search" title={`Nothing matches “${search}”`} body="Try a different word, or clear the search." />
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3">
              {shown.map((room) => (
                <li key={room.set._id}>
                  <RoomCard room={room} signedIn={signedIn} />
                </li>
              ))}
            </ul>
          )}
          <Pager page={page} pages={pages} href={hrefFor} label={`Pages of ${subject.name}'s study sets`} />
        </section>

        {onCampus && onCampus.started === 0 && (
          <div className="flex justify-center border-t border-ink/7 pt-5">
            <Button size="sm" disabled={removing.isLoading} onClick={takeOff}>
              Take it off my campus
            </Button>
          </div>
        )}
      </div>
      {newOpen && <NewStudySet subject={subject.name} onCampus={Boolean(onCampus)} onClose={() => setNewOpen(false)} />}
    </Page>
  );
}

// A study set in the subject (guide: card): its subtopic links to its classroom, over the whole card. Signed in, its
// one status and your mastery; signed out, a set with nothing in it yet still says so.
function RoomCard({ room, signedIn }: { room: Room; signedIn: boolean }) {
  const { set, stats, status } = room;
  return (
    <article className={cardClass}>
      <p className="text-xs text-ink/50">{set.topic}</p>
      <h3 className="font-semibold text-balance">
        <Link to={setPath(set._id)} data-card-link className={cardLinkClass}>
          {set.subtopic}
        </Link>
      </h3>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {(signedIn || stats.empty) && <Chip tone={SET_STATUS_TONE[status.key]}>{status.label}</Chip>}
        {!stats.empty && <span className="text-[11px] text-ink/50">{`${plural(set.flashcards, "flashcard")}, ${plural(set.questions, "question")}`}</span>}
      </div>
      {signedIn && stats.started && !stats.empty && (
        <div className="mt-auto pt-3">
          <Bar value={stats.mastery} label={`Mastery of ${set.subtopic}: ${pct(stats.mastery)}`} />
          <p className="mt-1 flex justify-between gap-2 text-[11px] text-ink/50">
            <span>{`${pct(stats.mastery)} mastered`}</span>
            {stats.daysAgo != null && <span>{`Studied ${daysAgoInWords(stats.daysAgo)}`}</span>}
          </p>
        </div>
      )}
    </article>
  );
}
