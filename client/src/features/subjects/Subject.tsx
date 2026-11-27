// A subject's page (/subjects/:name, the prototype's BuildingHud as a list): its study sets, how you stand in it,
// which set is up next there, and a new study set. A signed-in player can put the subject on their campus (beside the
// title, or under it on a phone, where beside it would squeeze the counts onto two lines), or take it off while they
// haven't started it. Your progress comes from your report card and your campus, which the app keeps
// already, so the page itself asks only for the subject's sets. The search, the order and the page are in the address.
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import type { CampusSubject, ReportCard, Subject as SubjectData } from "@retainlearn/core";
import { useSession } from "#app/session.ts";
import { Bar } from "#components/ui/Bar.tsx";
import { Button, buttonClass } from "#components/ui/Button.tsx";
import { cardClass, cardLinkClass } from "#components/ui/Card.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { Empty } from "#components/ui/Empty.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { IconButton } from "#components/ui/IconButton.tsx";
import type { IconName } from "#components/ui/Icon.tsx";
import { Page } from "#components/ui/Page.tsx";
import { Pager, usePageHeading } from "#components/ui/Pager.tsx";
import { SearchInput } from "#components/ui/SearchInput.tsx";
import { Segmented } from "#components/ui/Segmented.tsx";
import { browserTimeZone, useCampus, useToday } from "#features/campus/campusApi.ts";
import { ROOMS_PER_FLOOR, classFloors } from "#features/campus/scene/layout.ts";
import { SET_STATUS_TONE, subjectPath } from "#features/campus/subjects.ts";
import { useWorld } from "#features/campus/view.ts";
import { setPath } from "#features/classes/modes.ts";
import { useNextClass } from "#features/classroom/useNextClass.ts";
import { cx } from "#utils/cx.ts";
import { useReportCard } from "#features/report-card/reportCardApi.ts";
import { daysAgoInWords } from "#features/report-card/reportCardStats.ts";
import { NewStudySet } from "./NewStudySet.tsx";
import { SETS_PER_PAGE, alsoNeedsAttention, matchesSearch, ordered, roomsPage, subjectProgress, upNextHere } from "./subjectProgress.ts";
import type { Order, Room } from "./subjectProgress.ts";
import { problemOf } from "#api/problem.ts";
import { useAddSubjectMutation, useGetSubjectQuery, useRemoveSubjectMutation } from "./subjectsApi.ts";
import { ADD_ON_PHONE, SETS_GRID, SETS_HEADING, SubjectSkeleton } from "./SubjectSkeleton.tsx";

const FLOORS_PER_PAGE = SETS_PER_PAGE / ROOMS_PER_FLOOR; // the lift: page 2 is floors 4 to 6
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
  const world = useWorld();
  const lobby = world.shown && world.view.kind === "building";
  if (subject.isError) {
    const badName = (subject.error as { status?: unknown }).status === 400;
    return badName ? <NotASubject /> : <Failed retry={() => void subject.refetch()} />;
  }
  // Signed in, the page waits for your progress too (or for it to fail), so the sets' statuses don't pop in late.
  const waiting = session === "checking" || (signedIn && ((!card.data && !card.isError) || (!campus.data && !campus.isError)));
  if (!subject.data || waiting) return <SubjectSkeleton />;
  const onCampus = signedIn && campus.data ? (campus.data.subjects.find((s) => s.category === subject.data?.name) ?? false) : null;
  return <SubjectView subject={subject.data} card={signedIn ? (card.data ?? null) : null} onCampus={onCampus} signedIn={signedIn} lobby={lobby} />;
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
// lobby: in 3D, the subject's page is its building's lobby, a panel over the world with the building opened up behind it
// (D-20): no cards, as the floors are the list; the lift instead of pages.
type ViewProps = { subject: SubjectData; card: ReportCard | null; onCampus: CampusSubject | false | null; signedIn: boolean; lobby: boolean };
function SubjectView({ subject, card, onCampus, signedIn, lobby }: ViewProps) {
  const when = useToday();
  const [params, setParams] = useSearchParams();
  const search = (params.get("search") ?? "").trim();
  // The lobby keeps the building's order: the floors don't reshuffle, so rooms stay where you left them.
  const order: Order = signedIn && !lobby && params.get("order") === "attention" ? "attention" : "building";
  const { rooms, stats } = useMemo(() => subjectProgress(subject, card, when), [subject, card, when]);
  const next = signedIn ? upNextHere(rooms) : null;
  const attention = signedIn ? alsoNeedsAttention(rooms, next?.room ?? null) : [];
  const classes = useNextClass();
  const nextId = next?.room.set._id;
  // Up next here's set, fetched as the page opens, so its Start opens the class at once.
  useEffect(() => {
    if (nextId) classes.prefetch(nextId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per set, not per render
  }, [nextId]);
  const found = useMemo(() => ordered(rooms, order).filter((r) => matchesSearch(r.set, search)), [rooms, order, search]);
  const { items: shown, page, pages, newRoom } = roomsPage(found, { page: Number(params.get("page")) || null, search });
  const heading = usePageHeading(page);
  const [newOpen, setNewOpen] = useState(false);
  // The building's "+ New study set" room links here with ?new=1: the form opens, and the address loses the flag.
  useEffect(() => {
    if (!params.has("new")) return;
    if (signedIn) setNewOpen(true);
    const rest = new URLSearchParams(params);
    rest.delete("new");
    setParams(rest, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- when the flag arrives
  }, [params.has("new")]);
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
      back={lobby ? "/" : "/subjects"}
      panel={lobby ? "lobby" : undefined}
      description={`Study ${subject.name} on RetainLearn: ${counts}, reviewed and quizzed until they stick.`}
      noindex={subject.sets.length === 0}
      actions={
        onCampus === false && (
          <Button tone="primary" size="sm" icon="plus" disabled={adding.isLoading} onClick={addToCampus} className="max-sm:hidden">
            Add to my campus
          </Button>
        )
      }
    >
      <div className="space-y-5">
        {onCampus === false && (
          <Button tone="primary" icon="plus" disabled={adding.isLoading} onClick={addToCampus} className={ADD_ON_PHONE}>
            Add to my campus
          </Button>
        )}
        <div role="status" className="empty:hidden">
          {notice && <p className={notice.tone === "done" ? "rounded-2xl bg-mint-wash px-3.5 py-2.5 text-sm text-mint-ink" : "rounded-2xl bg-rose-wash px-3.5 py-2.5 text-sm text-rose-ink"}>{notice.text}</p>}
        </div>

        {signedIn && stats.started > 0 && (
          <section aria-label={`How you stand in ${subject.name}`} className={lobby ? "max-sm:hidden" : "panel bg-surface p-4"}>
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
          <section aria-label="Up next here" className={cx("flex flex-wrap items-center gap-3", lobby ? "rounded-2xl bg-brand/6 p-3" : "panel bg-surface p-4")}>
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
              <Icon name={statusIcon(next.room)} className="size-5" />
            </span>
            <div className="min-w-0 flex-1 basis-48">
              <p className="text-xs text-ink/50">Up next here</p>
              <p className="font-semibold text-balance">{next.room.set.subtopic}</p>
              <p className="text-sm text-ink/55">{next.why}</p>
            </div>
            {/* The class its classroom would start, in one tap (its set fetched as the page opens). */}
            <Button tone="primary" disabled={classes.opening !== null} aria-label={`Start the next class in ${next.room.set.subtopic}`} onClick={() => void classes.open(next.room.set._id)}>
              {classes.opening === next.room.set._id ? "Opening…" : "Start"}
            </Button>
            {attention.length > 0 && (
              <div className="hidden w-full border-t border-ink/[0.06] pt-3 sm:block">
                <h3 className="mb-1 text-[11px] font-semibold text-ink/50">Also needs attention</h3>
                <ul>
                  {attention.map((r) => (
                    <li key={r.set._id}>
                      <button
                        type="button"
                        aria-label={`Start the next class in ${r.set.subtopic}: ${r.status.label}`}
                        disabled={classes.opening !== null}
                        onClick={() => void classes.open(r.set._id)}
                        onPointerEnter={() => classes.prefetch(r.set._id)}
                        onFocus={() => classes.prefetch(r.set._id)}
                        className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 text-left hover:bg-ink/[0.03] focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-default"
                      >
                        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand/[0.08] text-brand">
                          <Icon name={statusIcon(r)} className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.set.subtopic}</span>
                        <span className="shrink-0 text-xs text-ink/55">{classes.opening === r.set._id ? "Opening…" : r.status.label}</span>
                        <Icon name="chevronRight" className="size-4 shrink-0 text-ink/30" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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

        {lobby ? (
          // The lobby: no cards (the floors are the list), the search once there's more than a page, and the lift.
          <section aria-labelledby="sets-title">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 id="sets-title" ref={heading} tabIndex={-1} className="flex items-baseline gap-1.5 text-sm font-semibold outline-none">
                {search ? `Study sets matching “${search}”` : "Study sets"}
                <span className="text-xs font-normal text-ink/50 tabular-nums">{found.length.toLocaleString("en")}</span>
              </h2>
              {/* Not while the building has its own "+ New study set" room on show. */}
              {!newRoom && (
                <Button size="sm" icon="plus" onClick={() => setNewOpen(true)}>
                  New study set
                </Button>
              )}
            </div>
            {(rooms.length > SETS_PER_PAGE || search) && (
              <div className="flex items-center gap-2">
                <search className="min-w-0 flex-1">
                  <form action={home} method="get" onSubmit={(e) => e.preventDefault()}>
                    <SearchInput
                      name="search"
                      label={`Search ${subject.name}'s study sets`}
                      placeholder="Search this building"
                      value={params.get("search") ?? ""}
                      onChange={(value) => setParams(paramsWith({ search: value, page: 1 }), { replace: true })}
                    />
                  </form>
                </search>
                {pages > 1 && (
                  <div role="group" aria-label="Lift" className="flex shrink-0 items-center rounded-xl border border-ink/10 bg-surface">
                    <IconButton icon="chevronUp" size="sm" label="Up a page of floors" disabled={page >= pages} onClick={() => setParams(paramsWith({ page: page + 1 }))} />
                    <IconButton icon="chevronDown" size="sm" label="Down a page of floors" disabled={page <= 1} onClick={() => setParams(paramsWith({ page: page - 1 }))} />
                  </div>
                )}
              </div>
            )}
            <p role="status" className="sr-only">
              {search ? `${plural(found.length, "study set")} found` : ""}
            </p>
            <p className="mt-1.5 text-[11px] text-ink/50">
              {pages > 1 ? `Floors ${(page - 1) * FLOORS_PER_PAGE + 1}–${(page - 1) * FLOORS_PER_PAGE + classFloors(shown.length + (newRoom ? 1 : 0))}. The lift shows the next ${SETS_PER_PAGE} study sets.` : "Tap a classroom to open it."}
            </p>
          </section>
        ) : (
          <section aria-labelledby="sets-title">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 id="sets-title" ref={heading} tabIndex={-1} className={SETS_HEADING}>
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
              <ul className={SETS_GRID}>
                {shown.map((room) => (
                  <li key={room.set._id}>
                    <RoomCard room={room} signedIn={signedIn} classes={classes} />
                  </li>
                ))}
              </ul>
            )}
            <Pager page={page} pages={pages} href={hrefFor} label={`Pages of ${subject.name}'s study sets`} />
          </section>
        )}

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

// What a set's status looks like as an icon: missed, fading, or a class to do.
const statusIcon = (room: Room): IconName => (room.status.key === "missed" ? "focus" : room.status.key === "fading" ? "clock" : room.status.key === "mastered" ? "check" : "review");

// A study set in the subject (guide: card): its subtopic links to its classroom, over the whole card. Signed in, its
// one status, your mastery, and its next class one tap away (above the card's link). Signed out, a set with nothing
// in it yet still says so.
function RoomCard({ room, signedIn, classes }: { room: Room; signedIn: boolean; classes: ReturnType<typeof useNextClass> }) {
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
      {signedIn && !stats.empty && (
        <div className={cx("pt-3", !stats.started && "mt-auto")}>
          <Button
            size="sm"
            icon={statusIcon(room)}
            disabled={classes.opening !== null}
            aria-label={`${stats.started ? "Next class" : "Start"} in ${set.subtopic}`}
            onClick={() => void classes.open(set._id)}
            onPointerEnter={() => classes.prefetch(set._id)}
            onFocus={() => classes.prefetch(set._id)}
            className="relative z-1 w-full !justify-start"
          >
            {classes.opening === set._id ? "Opening…" : stats.started ? "Next class" : "Start"}
          </Button>
        </div>
      )}
    </article>
  );
}
