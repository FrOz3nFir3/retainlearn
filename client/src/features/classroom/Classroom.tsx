// A study set's classroom (/study-sets/:id, the prototype's Classroom): how you stand in it; Study, with what each
// round shows (both its review and its quiz, or one of them: a setting), what to do next, going over or retrying what
// you missed, a mixed quiz of what you hold, and the rounds, in your order or the author's ("Change order"), each opening
// in place to its flashcards and quiz questions; then the teacher's desk (the editor's parts, with their counts), About
// (what it is, who made it and when, its details edited in place) and the noticeboard (the latest changes). While the
// set, your progress and your settings load, its skeleton. Someone not signed in can study, and is told signing in
// saves it. The description is the editor's HTML, shown as user content.
import { Suspense, lazy, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { isPlayerCard, reviewLoad, roundState, setRounds, shortTopic, studyPlan, studySetStats } from "@retainlearn/core";
import type { ProgressView, StudySetContent, StudyView, When } from "@retainlearn/core";
import { useMyUsername } from "#app/hooks.ts";
import { useSession } from "#app/session.ts";
import { Bar } from "#components/ui/Bar.tsx";
import { Button, buttonClass } from "#components/ui/Button.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { Empty } from "#components/ui/Empty.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import type { IconName } from "#components/ui/Icon.tsx";
import { Page } from "#components/ui/Page.tsx";
import { RichText } from "#components/ui/RichText.tsx";
import { Segmented } from "#components/ui/Segmented.tsx";
import { useToday } from "#features/campus/campusApi.ts";
import { subjectPath } from "#features/campus/subjects.ts";
import { useWorld } from "#features/campus/view.ts";
import { setPath, stepPath } from "#features/classes/modes.ts";
import { recallPoints } from "#features/classes/recallPoints.ts";
import { useGetHistoryInfiniteQuery, useGetSuggestionsQuery } from "#features/editor/editorApi.ts";
import { daysAgo } from "#features/editor/shared.ts";
import type { Notice } from "#features/editor/shared.ts";
import { daysAgoInWords } from "#features/report-card/reportCardStats.ts";
import { cx } from "#utils/cx.ts";
import { textOf } from "#utils/safeHtml.ts";
import { useGetProgressQuery, useGetStudySetQuery } from "./classroomApi.ts";
import { ABOUT_LABEL, ClassroomGuestNote, ClassroomSkeleton, DESK_ROW, STUDY_VIEWS_ITEMS } from "./ClassroomSkeleton.tsx";
import { OrderDialog } from "./OrderDialog.tsx";
import { ReadItem } from "./ReadItem.tsx";
import { ReportStudySet } from "./ReportStudySet.tsx";
import { RoundList } from "./Rounds.tsx";
import type { Reading, SetRound } from "./Rounds.tsx";
import { useStudyView } from "./useStudyView.ts";

const pct = (x: number) => `${Math.round(x * 100)}%`;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export default function Classroom() {
  const { id = "" } = useParams();
  const session = useSession();
  const signedIn = session === "in";
  const set = useGetStudySetQuery(id);
  const progress = useGetProgressQuery(id, { skip: !signedIn });
  const study = useStudyView(signedIn);
  const world = useWorld();
  const when = useToday();
  if (set.isError) {
    return (
      <Page title="Not found" back="/subjects">
        <Empty icon="x" title="This study set isn't here" body="It may have been deleted, or the link is wrong." action={<Link to="/subjects" className={buttonClass("primary")}>Find a set</Link>} />
      </Page>
    );
  }
  if (!set.data || session === "checking" || (signedIn && progress.isLoading) || study.loading) return <ClassroomSkeleton />;
  // In 3D, a classroom whose subject is on your campus is a panel over its room, in its building (D-20).
  const overRoom = world.shown && world.view.kind === "room";
  return <ClassroomView set={set.data} progress={progress.data ?? null} when={when} signedIn={signedIn} view={study.view} onView={study.setView} overRoom={overRoom} />;
}

// A way into a class, as a row: what it is, why, and Start. returnTo: where the class goes back to (the classroom).
function Action({ to, returnTo, icon, title, body }: { to: string; returnTo: string; icon: IconName; title: string; body: string }) {
  return (
    <div className="panel flex items-center gap-3 bg-surface p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
        <Icon name={icon} className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-ink/55">{body}</p>
      </div>
      <Link to={to} state={{ returnTo }} className={buttonClass("quiet")}>
        Start
      </Link>
    </div>
  );
}

// The one next thing to do, as a big button (the prototype's UpNext). For a round in Both, its review and its quiz
// side by side: the done one ticked, the one it starts lit.
type Next = { to: string; icon: IconName; label: string; note: string; steps?: { text: string; state: "done" | "now" | "later" }[] };
function UpNext({ next, returnTo }: { next: Next; returnTo: string }) {
  return (
    <Link
      to={next.to}
      state={{ returnTo }}
      className={cx(buttonClass("primary"), "w-full !justify-start gap-3 !px-4 !py-3 text-left")}
      aria-label={`Up next: ${next.label}, ${next.steps ? next.steps.map((s) => `${s.text} ${s.state === "done" ? "done" : s.state === "now" ? "now" : "after"}`).join(", ") : next.note}`}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/15">
        <Icon name={next.icon} className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold text-white/70">Up next</span>
        <span className="block text-[15px] leading-tight">{next.label}</span>
        {next.steps ? (
          <span className="mt-1 flex flex-wrap items-center gap-1 text-[11px] font-semibold">
            {next.steps.map((s, i) => (
              <span key={s.text} className="flex items-center gap-1">
                <span className={cx("flex items-center gap-1 rounded-full px-2 py-0.5", s.state === "now" ? "bg-white text-brand" : s.state === "done" ? "bg-white/15 text-white/85" : "bg-white/10 text-white/60")}>
                  {s.state === "done" && <Icon name="check" className="size-3" />}
                  {s.text}
                </span>
                {i < (next.steps?.length ?? 0) - 1 && <Icon name="chevronRight" className="size-3 text-white/50" />}
              </span>
            ))}
          </span>
        ) : (
          <span className="block text-xs font-medium text-white/75">{next.note}</span>
        )}
      </span>
      <Icon name="chevronRight" className="size-5 shrink-0" />
    </Link>
  );
}

// overRoom: in 3D, the classroom is a panel over its room (the side panel), the building opened up behind it.
type ViewProps = { set: StudySetContent; progress: ProgressView | null; when: When; signedIn: boolean; view: StudyView; onView: (view: StudyView) => void; overRoom: boolean };

function ClassroomView({ set, progress, when, signedIn, view: picked, onView, overRoom }: ViewProps) {
  const order = progress?.order ?? null;
  const rounds: SetRound[] = useMemo(() => setRounds(set, order, (f) => reviewLoad(recallPoints(f.answer).length)), [set, order]);
  const states = rounds.map((r) => roundState(r, progress, when));
  const stats = studySetStats(set, progress, when);
  const held = Object.values(progress?.questions ?? {}).filter((q) => isPlayerCard(q)).length;
  const home = setPath(set._id);
  const reviewer = progress?.reviewer === true;
  const both = set.flashcards.length > 0 && set.questions.length > 0;
  const [reporting, setReporting] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [orderSaved, setOrderSaved] = useState<"mine" | "author's" | null>(null);
  const [reading, setReading] = useState<Reading | null>(null);

  // Up next and what else there is to do here: one rule for everywhere that suggests it (core's studyPlan). A set
  // with only flashcards, or only questions, shows what it has.
  const plan = studyPlan({ rounds, states, progress, when, view: picked, loadOf: (f) => reviewLoad(recallPoints(f.answer).length) });
  const view = plan.view;
  const next = plan.next;
  // In Both, a round says its first topic.
  const topicOf = (n: number) => {
    const first = rounds[n - 1]?.flashcards[0];
    return first ? shortTopic(textOf(first.question)) : "quiz questions";
  };
  const upNextButton: Next | null = next && {
    to: stepPath(set._id, next.action),
    icon: next.icon,
    label: next.kind === "round" && view === "both" && next.round ? `${next.label}: ${topicOf(next.round)}` : next.label,
    note: next.note,
    steps: next.steps,
  };

  return (
    <Page
      title={set.subtopic}
      eyebrow={
        <>
          {set.topic} in {set.category}
          {set.author && (
            <>
              , by{" "}
              <Link to={`/profile/${encodeURIComponent(set.author.username)}`} className="font-semibold text-brand hover:underline">
                @{set.author.username}
              </Link>
            </>
          )}
        </>
      }
      back={subjectPath(set.category)}
      headTitle={`${set.topic}: ${set.subtopic}`}
      description={textOf(set.description) || `Study ${set.topic}: ${set.subtopic}, in ${set.category}, with flashcards and quizzes.`}
      noindex={!set.listed}
      width="max-w-3xl"
      panel={overRoom ? "side" : undefined}
      actions={
        signedIn && (
          <Link to={`${home}/edit`} className={buttonClass("quiet", "sm")}>
            Edit
          </Link>
        )
      }
    >
      <div className="space-y-5">
        {!signedIn && <ClassroomGuestNote returnTo={home} />}

        {signedIn && stats.started && (
          <section aria-label="How you stand in this set" className="panel bg-surface p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-display text-3xl font-semibold tabular-nums">
                {pct(stats.mastery)} <span className="font-sans text-xs font-normal text-ink/50">mastery</span>
              </span>
              {stats.daysAgo != null && <span className="text-xs text-ink/50">Last visit: {daysAgoInWords(stats.daysAgo)}</span>}
            </div>
            <Bar value={stats.mastery} label="Mastery of this set" className="mt-1.5 h-2" />
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Chip>{`${stats.reviewed} of ${stats.flashcards} flashcards seen`}</Chip>
              {stats.missedFlashcards > 0 && <Chip tone="bell">{`Points missed on ${plural(stats.missedFlashcards, "flashcard")}`}</Chip>}
              {stats.missedQuestions > 0 && <Chip tone="rose">{`${plural(stats.missedQuestions, "question")} missed`}</Chip>}
              <Chip tone="brand">{`${plural(held, "player card")} earned`}</Chip>
            </div>
          </section>
        )}

        <section aria-labelledby="study-title" className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h2 id="study-title" className="font-display text-xl font-semibold">
              Study
            </h2>
            {both && <Segmented label="What each round shows" items={STUDY_VIEWS_ITEMS} value={view} onChange={onView} className="ml-auto w-full max-w-[17rem]" />}
          </div>
          {rounds.length === 0 ? (
            <Empty
              icon="review"
              title="Nothing to study yet"
              body="This set has no flashcards or questions yet."
              action={
                signedIn ? (
                  <Link to={`${home}/edit`} className={buttonClass("primary")}>
                    Add flashcards
                  </Link>
                ) : (
                  <Link to="/sign-in" state={{ returnTo: home }} className={buttonClass("primary")}>
                    Sign in to add flashcards
                  </Link>
                )
              }
            />
          ) : (
            <>
              {upNextButton && <UpNext next={upNextButton} returnTo={home} />}
              {plan.others.map((step) => (
                <Action key={step.kind} returnTo={home} to={stepPath(set._id, step.action)} icon={step.icon} title={step.label} body={step.note} />
              ))}

              <div className="pt-2">
                <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <h3 className="font-semibold">Rounds</h3>
                  <span className="text-xs text-ink/50">{order ? <span className="font-semibold text-brand">in your order</span> : "in the author's order"}</span>
                  {set.flashcards.length > 1 &&
                    (signedIn ? (
                      <Button size="sm" className="ml-auto" icon="layers" onClick={() => setOrdering(true)}>
                        Change order
                      </Button>
                    ) : (
                      <Link to="/sign-in" state={{ returnTo: home }} className={cx(buttonClass("quiet", "sm"), "ml-auto")}>
                        Sign in to change the order
                      </Link>
                    ))}
                </div>
                <RoundList set={set} rounds={rounds} states={states} progress={progress} view={view} when={when} current={plan.current} currentTag={plan.currentTag} returnTo={home} onRead={setReading} />
                <p className="mt-1.5 text-xs text-ink/50">Open a round to see its flashcards and quiz questions.</p>
                <p role="status" className="mt-1.5 text-xs font-semibold text-mint-ink empty:hidden">
                  {orderSaved && (orderSaved === "mine" ? "Saved: the rounds follow your order." : "Saved: the rounds follow the author's order again.")}
                </p>
              </div>
            </>
          )}
        </section>

        <TeachersDesk set={set} signedIn={signedIn} reviewer={reviewer} />
        <About set={set} signedIn={signedIn} reviewer={reviewer} />
        <Noticeboard set={set} />

        {signedIn && (
          <Button size="sm" icon="flag" onClick={() => setReporting(true)} className="border-transparent bg-transparent text-ink/55 hover:text-rose-ink">
            Report this set
          </Button>
        )}
      </div>
      {reporting && <ReportStudySet setId={set._id} name={set.subtopic} onClose={() => setReporting(false)} />}
      {ordering && <OrderDialog set={set} order={order} onClose={() => setOrdering(false)} onSaved={setOrderSaved} />}
      {reading && <ReadItem set={set} item={reading} progress={progress} returnTo={home} onClose={() => setReading(null)} />}
    </Page>
  );
}

// The set's editor, by its parts (the prototype's teacher's desk): each a link to that tab, with its count, and who
// you are here (its author, one of its reviewers, or someone whose edits are suggestions). Its reviewers are a count
// for everyone; only they can open the list.
function TeachersDesk({ set, signedIn, reviewer }: { set: StudySetContent; signedIn: boolean; reviewer: boolean }) {
  const suggestions = useGetSuggestionsQuery(set._id, { skip: !signedIn });
  const me = useMyUsername();
  const edit = `${setPath(set._id)}/edit`;
  const waiting = suggestions.data?.length ?? 0;
  const rows: [IconName, string, string, string][] = [
    ["review", "Flashcards", plural(set.flashcards.length, "flashcard"), "flashcards"],
    ["quiz", "Quiz questions", plural(set.questions.length, "question"), "questions"],
    ...(signedIn ? [["inbox", "Review queue", waiting ? `${waiting} waiting` : "Nothing waiting", "review-queue"] as [IconName, string, string, string]] : []),
    ["users", "Reviewers", plural(set.reviewers, "reviewer"), "reviewers"],
    ["clock", "History", "Every change", "history"],
  ];
  return (
    <section aria-labelledby="desk-title">
      <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h2 id="desk-title" className="font-display text-xl font-semibold">
          Teacher's desk
        </h2>
        {signedIn && <Chip tone={reviewer ? "mint" : "brand"}>{me && set.author?.username === me ? "Your set" : reviewer ? "You review it" : "Your edits are suggestions"}</Chip>}
      </div>
      <ul className="divide-y divide-ink/[0.06] overflow-hidden rounded-2xl border border-ink/[0.08] bg-surface">
        {rows.map(([icon, label, note, view]) => {
          const inner = (
            <>
              <Icon name={icon} className="size-4 shrink-0 text-ink/50" />
              <span className="flex-1 font-medium">{signedIn || view === "reviewers" ? label : `See its ${label.toLowerCase()}`}</span>
              <span className={cx("text-xs", view === "review-queue" && waiting ? "font-semibold text-bell-ink" : "text-ink/50")}>{note}</span>
            </>
          );
          return (
            <li key={view}>
              {view === "reviewers" && !reviewer ? (
                <div className={cx(DESK_ROW, "hover:bg-transparent")}>
                  {inner}
                  <span className="size-4 shrink-0" />
                </div>
              ) : (
                <Link to={`${edit}?view=${view}`} className={DESK_ROW}>
                  {inner}
                  <Icon name="chevronRight" className="size-4 shrink-0 text-ink/30" />
                </Link>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-1.5 text-xs text-ink/50">{signedIn ? "The set's reviewers change it directly; anyone else's changes wait for one of them to accept." : "Sign in to suggest changes."}</p>
    </section>
  );
}

// What the set is (the prototype's About): its topic, subtopic and description, when it was made and last changed and
// by whom, and its details edited right here (the editor's Details: its reviewers save, anyone else suggests). The
// dialog's rich text editor is loaded only when it opens.
const DetailsDialog = lazy(() => import("#features/editor/DetailsDialog.tsx").then((m) => ({ default: m.DetailsDialog })));
const onDay = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null);

export function About({ set, signedIn, reviewer }: { set: StudySetContent; signedIn: boolean; reviewer: boolean }) {
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const created = onDay(set.createdAt);
  const updated = onDay(set.updatedAt);
  return (
    <section aria-labelledby="about-title">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 id="about-title" className="font-display text-xl font-semibold">
          About
        </h2>
        {signedIn && (
          <Button size="sm" icon="edit" onClick={() => setEditing(true)}>
            {reviewer ? "Edit details" : "Suggest a change"}
          </Button>
        )}
      </div>
      <div role="status" className="empty:hidden">
        {notice && <p className={cx("mb-2 rounded-xl px-3 py-2 text-sm", NOTICE_TONE[notice.tone])}>{notice.text}</p>}
      </div>
      <div className="rounded-2xl border border-ink/[0.08] bg-surface p-3.5 text-sm">
        <dl className="space-y-2">
          <AboutRow label="Topic">{set.topic}</AboutRow>
          <AboutRow label="Subtopic">{set.subtopic}</AboutRow>
          <AboutRow label="Description">{textOf(set.description) ? <RichText html={set.description} className="!text-sm" /> : <span className="text-ink/45">No description yet</span>}</AboutRow>
        </dl>
        {(created || updated) && (
          <p className="mt-2 border-t border-ink/[0.06] pt-2 text-xs text-ink/50">
            {created && `Created ${created}. `}
            {updated && `Updated ${updated}`}
            {updated && set.updatedBy && (
              <>
                {" by "}
                <Link to={`/profile/${encodeURIComponent(set.updatedBy.username)}`} className="font-semibold text-brand hover:underline">
                  @{set.updatedBy.username}
                </Link>
              </>
            )}
            {updated && "."}
          </p>
        )}
      </div>
      {editing && (
        <Suspense fallback={null}>
          <DetailsDialog set={set} access={reviewer ? "editor" : "contributor"} onClose={() => setEditing(false)} onSaved={setNotice} />
        </Suspense>
      )}
    </section>
  );
}

function AboutRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className={ABOUT_LABEL}>{label}</dt>
      <dd className="min-w-0 flex-1 font-medium">{children}</dd>
    </div>
  );
}
const NOTICE_TONE: Record<Notice["tone"], string> = { mint: "bg-mint-wash text-mint-ink", bell: "bg-bell-wash text-bell-ink", rose: "bg-rose-wash text-rose-ink" };

// The latest changes to the set (the prototype's noticeboard): three, and the way to all of them.
function Noticeboard({ set }: { set: StudySetContent }) {
  const history = useGetHistoryInfiniteQuery({ setId: set._id, search: "" });
  const latest = (history.data?.pages[0]?.logs ?? []).filter((entry) => entry._id && entry.summary).slice(0, 3);
  return (
    <section aria-labelledby="notices-title">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 id="notices-title" className="font-display text-xl font-semibold">
          Noticeboard
        </h2>
        <Link to={`${setPath(set._id)}/edit?view=history`} className="text-xs font-semibold text-brand hover:underline">
          All changes
        </Link>
      </div>
      {history.isLoading ? (
        <p className="text-sm text-ink/50">Loading the latest changes…</p>
      ) : latest.length ? (
        <ul className="space-y-2">
          {latest.map((entry) => (
            <li key={entry._id} className="rounded-2xl border border-ink/[0.07] bg-surface px-3 py-2.5">
              <p className="line-clamp-2 text-sm">{entry.summary.replace(/^Collaborative Edit: /, "")}</p>
              <p className="mt-0.5 text-xs text-ink/50">
                {entry.user.name || "A deleted account"}, {daysAgo(entry.timestamp)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink/50">No changes yet.</p>
      )}
    </section>
  );
}
