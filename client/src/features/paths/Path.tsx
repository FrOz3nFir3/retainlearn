// A path's page (/paths/:id, the prototype's PathPanel): where you are along it, its steps, following it, Up next for
// its current step, testing out of a step, its skill, its suggestions and history. Editors edit it and decide on
// suggestions; anyone else signed in suggests changes or copies it. In 3D, the side panel over the campus (D-20).
// Decisions of 2026-11-27 (TRACKER step 4) where it differs from the prototype: no exam match until the stadium, so
// the skill is claimed once every step is done; a declined suggestion's note and outcome shown to its suggester; and
// "Report this path".
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fadingCount, studySetStats, studySetStatus } from "@retainlearn/core";
import type { PathSuggestion, PathView, StepProgress, When } from "@retainlearn/core";
import { problemOf } from "#api/problem.ts";
import { useSession } from "#app/session.ts";
import { Bar } from "#components/ui/Bar.tsx";
import { Button, buttonClass } from "#components/ui/Button.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { Dialog } from "#components/ui/Dialog.tsx";
import { Empty } from "#components/ui/Empty.tsx";
import { Field, inputClass } from "#components/ui/Field.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { Page } from "#components/ui/Page.tsx";
import { toast } from "#components/ui/Toast.tsx";
import { browserTimeZone, useToday } from "#features/campus/campusApi.ts";
import { useWorld } from "#features/campus/view.ts";
import { ReportDialog } from "#features/classroom/ReportDialog.tsx";
import { useNextClass } from "#features/classroom/useNextClass.ts";
import { setPath } from "#features/classes/modes.ts";
import { daysAgo } from "#features/editor/shared.ts";
import { upNextHere } from "#features/subjects/subjectProgress.ts";
import { cx } from "#utils/cx.ts";
import { STATE_CHIP, along, fixText, pathEditPath, pickedClass, stepCounts, stepName, testOutHref } from "./pathView.ts";
import {
  useAcceptSuggestionMutation,
  useClaimSkillMutation,
  useCopyPathMutation,
  useDeclineSuggestionMutation,
  useFollowPathMutation,
  useGetHistoryQuery,
  useGetPathQuery,
  useGetSuggestionsQuery,
  useReportPathMutation,
  useUnfollowPathMutation,
  useWithdrawSuggestionMutation,
} from "./pathsApi.ts";
import { PATH_INTRO, PATH_WIDTH, PROGRESS_BLOCK, PathSkeleton, STEPS_LIST, STEP_NUMBER, STEP_ROW } from "./PathSkeleton.tsx";

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en")} ${n === 1 ? one : many}`;
const SECTION_HEADING = "mb-2 flex items-baseline gap-2 font-display text-lg font-semibold";
const formatDay = (iso: string) => new Date(iso).toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" });

export default function Path() {
  const { id = "" } = useParams();
  const path = useGetPathQuery(id);
  const session = useSession();
  const world = useWorld();
  const overWorld = world.shown && world.view.kind === "path";
  if (path.isError) {
    const gone = (path.error as { status?: unknown }).status === 404 || (path.error as { status?: unknown }).status === 400;
    return gone ? <NotFound overWorld={overWorld} /> : <Failed overWorld={overWorld} retry={() => void path.refetch()} />;
  }
  if (!path.data || session === "checking") return <PathSkeleton />;
  return <PathPage view={path.data} signedIn={session === "in"} overWorld={overWorld} />;
}

function NotFound({ overWorld }: { overWorld: boolean }) {
  return (
    <Page title="Path not found" back="/paths" width={PATH_WIDTH} noindex panel={overWorld ? "side" : undefined}>
      <Empty icon="path" title="This path doesn't exist" body="It may have been deleted, or it's private." action={<Link to="/paths" className={buttonClass("primary")}>All paths</Link>} />
    </Page>
  );
}

function Failed({ overWorld, retry }: { overWorld: boolean; retry: () => void }) {
  return (
    <Page title="Path" back="/paths" width={PATH_WIDTH} noindex panel={overWorld ? "side" : undefined}>
      <Empty icon="path" title="This path didn't load" body="Check your connection, then try again." action={<Button tone="primary" onClick={retry}>Try again</Button>} />
    </Page>
  );
}

function PathPage({ view, signedIn, overWorld }: { view: PathView; signedIn: boolean; overWorld: boolean }) {
  const when = useToday();
  const navigate = useNavigate();
  const progress = useMemo(() => along(view, when), [view, when]);
  const [copy, copying] = useCopyPathMutation();
  const [reporting, setReporting] = useState(false);
  const [report, reportState] = useReportPathMutation();
  const you = view.you;
  const canEdit = you?.canEdit ?? false;
  const problems = canEdit ? fixText(view) : null;

  const copyIt = async () => {
    try {
      const made = await copy(view._id).unwrap();
      toast("Copied to your paths. Only you can see it until you make it public");
      navigate(pathEditPath(made._id));
    } catch (error) {
      toast(problemOf(error, "The path wasn't copied. Check your connection, then try again."), "bell");
    }
  };

  return (
    <Page
      title={view.title}
      eyebrow={`Skill path in ${view.category}`}
      back="/paths"
      width={PATH_WIDTH}
      description={view.description || `A skill path in ${view.category} on RetainLearn: ${plural(progress.total, "step")}, in order.`}
      noindex={view.visibility === "private" || !view.listed}
      panel={overWorld ? "side" : undefined}
      actions={
        canEdit && (
          <Link to={pathEditPath(view._id)} className={buttonClass("quiet", "sm")}>
            <Icon name="edit" className="size-4 shrink-0" />
            Edit
          </Link>
        )
      }
    >
      <div className="space-y-5">
        <p className={PATH_INTRO}>{`${view.description ? `${view.description} ` : ""}${view.author ? `By @${view.author.username}.` : ""}`}</p>

        {(view.visibility === "private" || you?.isAuthor || (view.visibility === "public" && !view.listed && canEdit)) && (
          <div className="flex flex-wrap gap-1.5">
            {view.visibility === "private" && (
              <Chip tone="cold">
                <Icon name="lock" className="size-3" /> {you?.isAuthor ? "Only you can see it" : "Only its editors can see it"}
              </Chip>
            )}
            {you?.isAuthor && <Chip tone="mint">Your path</Chip>}
            {view.visibility === "public" && !view.listed && canEdit && <Chip tone="orange">Not listed yet: new accounts' paths wait a few days</Chip>}
          </div>
        )}

        {signedIn && you && !canEdit && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Link to={pathEditPath(view._id)} className={buttonClass("quiet", "sm")}>
                <Icon name="edit" className="size-4 shrink-0" />
                Suggest changes
              </Link>
              <Button size="sm" icon="copy" disabled={copying.isLoading} onClick={() => void copyIt()}>
                {copying.isLoading ? "Copying…" : "Copy to my paths"}
              </Button>
            </div>
            <p className="text-xs text-pretty text-ink/50">{`Only @${view.author?.username ?? "its author"} and this path's editors change it directly. Your changes go to them for review.`}</p>
          </div>
        )}

        {canEdit && <Suggestions view={view} />}
        {you?.suggestion && !canEdit && <YourSuggestion pathId={view._id} suggestion={you.suggestion} />}

        {problems && (
          <p role="note" className="flex items-start gap-2 rounded-2xl bg-bell-wash px-3.5 py-2.5 text-sm text-pretty text-bell-ink">
            <Icon name="bell" className="mt-0.5 size-4 shrink-0" />
            <span>
              {problems}{" "}
              <Link to={pathEditPath(view._id)} className="font-semibold underline underline-offset-2">
                Fix
              </Link>
            </span>
          </p>
        )}

        <ProgressBlock view={view} done={progress.done} total={progress.total} signedIn={signedIn} />

        {signedIn && you?.following && progress.current && <UpNext view={view} entry={progress.current} index={progress.steps.indexOf(progress.current)} when={when} />}

        {progress.total === 0 ? (
          <Empty icon="path" title="Nothing to study here yet" body={canEdit ? "Every step's content is gone. Edit the path to add new steps." : "Its study sets aren't available right now."} />
        ) : (
          <section aria-labelledby="path-steps">
            <h2 id="path-steps" className={SECTION_HEADING}>
              Steps <span className="text-sm font-normal text-ink/50 tabular-nums">{progress.total}</span>
            </h2>
            <ol className={STEPS_LIST}>
              {progress.steps.map((entry, i) => (
                <StepRow key={entry.step.id} view={view} entry={entry} n={i + 1} signedIn={signedIn} upNext={!!you?.following && entry === progress.current} />
              ))}
            </ol>
          </section>
        )}

        <SkillCard view={view} done={progress.done} total={progress.total} complete={progress.complete} signedIn={signedIn} />

        <History pathId={view._id} />

        {signedIn && !you?.isAuthor && (
          <Button size="sm" icon="flag" onClick={() => setReporting(true)} className="border-transparent bg-transparent text-ink/55 hover:text-rose-ink">
            Report this path
          </Button>
        )}
      </div>
      {reporting && <ReportDialog kind="path" name={view.title} send={(body) => report({ id: view._id, ...body }).unwrap()} sending={reportState.isLoading} onClose={() => setReporting(false)} />}
    </Page>
  );
}

// How far along it you are, and following it (one path at a time: following this one stops the other).
function ProgressBlock({ view, done, total, signedIn }: { view: PathView; done: number; total: number; signedIn: boolean }) {
  const [follow, following] = useFollowPathMutation();
  const [unfollow, unfollowing] = useUnfollowPathMutation();
  const you = view.you;
  const start = async () => {
    try {
      await follow({ id: view._id, tz: browserTimeZone() }).unwrap();
      toast(`Following "${view.title}"`);
    } catch (error) {
      toast(problemOf(error, "That didn't work. Check your connection, then try again."), "bell");
    }
  };
  return (
    <section aria-label="Your progress" className={PROGRESS_BLOCK}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold">{`${done} of ${plural(total, "step")}`}</span>
        {you?.skill ? <Chip tone="mint">Skill earned</Chip> : <span className="text-xs text-ink/55">{view.exam ? "then a final exam" : "no exam: finish them all"}</span>}
      </div>
      <Bar value={total ? done / total : 0} label={`Steps done in ${view.title}`} tone={total && done === total ? "mint" : "brand"} className="mt-2 h-2" />
      {signedIn && you && total > 0 && (
        <>
          {you.following ? (
            <div className="mt-3 flex h-10 items-center gap-3">
              <Chip tone="brand">
                <Icon name="check" className="size-3" /> Following
              </Chip>
              <button type="button" disabled={unfollowing.isLoading} onClick={() => void unfollow(view._id)} className="cursor-pointer text-sm font-semibold text-ink/60 underline-offset-2 hover:text-ink hover:underline disabled:cursor-default">
                Stop following
              </button>
            </div>
          ) : (
            <Button tone="primary" icon="path" disabled={following.isLoading} onClick={() => void start()} className="mt-3 w-full">
              {following.isLoading ? "Following…" : "Follow this path"}
            </Button>
          )}
          {you.following && <p className="mt-2 text-xs text-pretty text-ink/55">Your daily timetable picks classes from your current step, and the trail on your campus leads to it.</p>}
        </>
      )}
      {!signedIn && (
        <p className="mt-3 text-sm text-ink/65">
          <Link to="/sign-in" state={{ returnTo: `/paths/${view._id}` }} className="font-semibold text-brand underline-offset-2 hover:underline">
            Sign in
          </Link>{" "}
          to follow it, suggest changes or make your own copy.
        </p>
      )}
    </section>
  );
}

// Up next, for the path you follow: its current step's next class. A whole set's is the one its classroom would start;
// a picked step is studied as one class of its own (pickedClass).
function UpNext({ view, entry, index, when }: { view: PathView; entry: StepProgress; index: number; when: When }) {
  const classes = useNextClass();
  const picked = entry.step.flashcardIds != null;
  const own = picked ? pickedClass(view._id, entry) : null;
  const why = picked ? (own?.note ?? "") : wholeSetWhy(view, entry, when);
  return (
    <section aria-label="Up next" className="flex flex-wrap items-center gap-3 rounded-2xl bg-brand/6 p-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
        <Icon name={own?.icon ?? "flag"} className="size-5" />
      </span>
      <div className="min-w-0 flex-1 basis-48">
        <p className="text-xs text-ink/50">{`Up next · Step ${index + 1}: ${stepName({ ...entry.step, set: entry.set })}`}</p>
        <p className="font-semibold text-balance">{own?.label ?? entry.set.title}</p>
        <p className="text-sm text-ink/55">{why}</p>
      </div>
      {own ? (
        <Link to={own.href} state={{ returnTo: `/paths/${view._id}` }} className={buttonClass("primary")}>
          Start
        </Link>
      ) : (
        <Button tone="primary" disabled={classes.opening !== null} onClick={() => void classes.open(entry.set._id)} onPointerEnter={() => classes.prefetch(entry.set._id)}>
          {classes.opening === entry.set._id ? "Opening…" : "Start"}
        </Button>
      )}
    </section>
  );
}

// Why a whole set is next, as its subject's page says it ("2 missed", "Not started yet").
function wholeSetWhy(view: PathView, entry: StepProgress, when: When): string {
  const progress = view.you?.progress[entry.set._id];
  const fading = fadingCount(entry.set, progress, when);
  const stats = studySetStats(entry.set, progress, when);
  const room = { set: { _id: entry.set._id, topic: "", subtopic: entry.set.title, flashcards: stats.flashcards, questions: stats.questions }, stats, status: studySetStatus(stats, fading), fading };
  return upNextHere([room])?.why ?? "Carry on where you left off";
}

// A step: its number (a tick when done with nothing missed), its name, its state, what it holds and, signed in, how
// far into it you are. The row opens its classroom; under it, a picked step's own class and "Skip with a test".
function StepRow({ view, entry, n, signedIn, upNext }: { view: PathView; entry: StepProgress; n: number; signedIn: boolean; upNext: boolean }) {
  const { step, set, stats, state, testedOut } = entry;
  const missed = stats.missedFlashcards + stats.missedQuestions;
  const done = state === "done";
  const name = stepName({ ...step, set });
  const chip = testedOut ? { label: "Test passed", tone: "mint" as const } : STATE_CHIP[state];
  const own = step.flashcardIds != null && (state === "current" || state === "open") && !upNext ? pickedClass(view._id, entry) : null;
  const canTestOut = signedIn && !done && stats.questions > 0;
  return (
    <li className={cx(STEP_ROW, state === "current" ? "border-brand/40" : "border-ink/8")}>
      <span
        aria-hidden="true"
        className={cx(STEP_NUMBER, done && !missed ? "bg-mint text-white" : done ? "bg-mint-wash text-mint-ink" : state === "current" ? "bg-brand text-white" : "bg-ink/6 text-ink/60")}
      >
        {done && !missed ? <Icon name="check" className="size-4" /> : n}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="min-w-0 font-semibold text-balance">
            <Link to={setPath(set._id)} className="outline-none after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-brand">
              {name}
            </Link>
          </h3>
          <Chip tone={chip.tone}>{chip.label}</Chip>
        </div>
        {step.title && <p className="text-xs text-ink/50">{set.title}</p>}
        <p className="text-xs text-ink/55">{stepCounts({ ...step, set })}</p>
        {signedIn && stats.started && (
          <>
            <p className="text-xs text-ink/55">
              {stats.flashcards ? `${stats.reviewed} of ${plural(stats.flashcards, "flashcard")} seen` : `${stats.answered} of ${plural(stats.questions, "question")} answered`}
              {missed > 0 && <span className="text-bell-ink">{` · ${missed} missed`}</span>}
            </p>
            <Bar value={stats.mastery} label={`Mastery of ${name}`} tone={done ? "mint" : "brand"} className="mt-1.5 h-1.5" />
          </>
        )}
        {(own || canTestOut) && (
          <div className="relative z-1 mt-2 flex flex-wrap gap-2">
            {own && (
              <Link to={own.href} state={{ returnTo: `/paths/${view._id}` }} title={own.note} className={buttonClass("quiet", "sm")}>
                <Icon name={own.icon} className="size-4 shrink-0" />
                {own.label}
              </Link>
            )}
            {canTestOut && (
              <Link
                to={testOutHref(view._id, set._id, step.id)}
                state={{ returnTo: `/paths/${view._id}` }}
                title="Already know it? Up to 10 of its quiz questions; 80% right and the step counts as done"
                className={buttonClass("quiet", "sm")}
              >
                <Icon name="skip" className="size-4 shrink-0" />
                Skip with a test
              </Link>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

// The skill: earned once every step is done. With the exam on, the match against Professor Quill comes with the
// stadium (decision 1); until then, finishing every step earns it.
function SkillCard({ view, done, total, complete, signedIn }: { view: PathView; done: number; total: number; complete: boolean; signedIn: boolean }) {
  const [claim, claiming] = useClaimSkillMutation();
  const skill = view.you?.skill;
  const left = total - done;
  const claimIt = async () => {
    try {
      await claim({ id: view._id, tz: browserTimeZone() }).unwrap();
      toast("Skill earned");
    } catch (error) {
      toast(problemOf(error, "The skill wasn't saved. Check your connection, then try again."), "bell");
    }
  };
  return (
    <section aria-labelledby="path-skill" className={cx("rounded-2xl border-2 border-dashed p-4", skill || complete ? "border-bell/50 bg-bell-wash/50" : "border-ink/12")}>
      <h2 id="path-skill" className="flex items-center gap-2 font-semibold">
        <Icon name="trophy" className="size-4 text-bell-ink" />
        {view.exam ? "Final exam" : "The skill"}
      </h2>
      <p className="mt-1 text-sm text-pretty text-ink/65">
        {view.exam
          ? "A match against Professor Quill with this path's questions, once the stadium opens. Until then, mastering every step earns the skill. It shows on your profile and your report card."
          : "This path has no final exam: master every step to earn the skill. It shows on your profile and your report card."}
      </p>
      {skill ? (
        <p className="mt-2 text-sm font-semibold text-mint-ink">{`Earned on ${formatDay(skill.at)}.`}</p>
      ) : (
        signedIn && (
          <Button tone={complete ? "primary" : undefined} icon="trophy" disabled={!complete || claiming.isLoading} onClick={() => void claimIt()} className="mt-3">
            {complete ? (claiming.isLoading ? "Claiming…" : "Claim the skill") : `Finish ${plural(left, "more step")} first`}
          </Button>
        )
      )}
    </section>
  );
}

// For the path's editors: the suggestions waiting for them, each accepted (its own changes applied to the path as it
// is now) or declined with a note its suggester sees.
function Suggestions({ view }: { view: PathView }) {
  const list = useGetSuggestionsQuery(view._id);
  const [accept, accepting] = useAcceptSuggestionMutation();
  const [declining, setDeclining] = useState<PathSuggestion | null>(null);
  const open = (list.data?.suggestions ?? []).filter((s) => s.status === "open");
  if (!open.length) return null;
  const acceptIt = async (s: PathSuggestion) => {
    try {
      await accept({ id: view._id, suggestionId: s._id }).unwrap();
      toast(`Accepted @${s.by?.username ?? "someone"}'s changes`);
    } catch (error) {
      toast(problemOf(error, "The suggestion wasn't applied. Check your connection, then try again."), "bell");
    }
  };
  return (
    <section aria-labelledby="path-suggestions" className="rounded-2xl border border-bell/40 bg-bell-wash/40 p-3.5">
      <h2 id="path-suggestions" className="text-sm font-semibold">{`Suggested changes (${open.length})`}</h2>
      <ul className="mt-2 space-y-3">
        {open.map((s) => (
          <li key={s._id} className="rounded-xl bg-surface p-3">
            <p className="text-xs text-ink/55">{`@${s.by?.username ?? "someone"} · ${daysAgo(s.at)}`}</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
              {s.summary.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            {s.stale && <p className="mt-2 text-xs text-pretty text-bell-ink">The path changed after this was suggested. Accepting applies just these changes to the current version.</p>}
            <div className="mt-2 flex flex-wrap justify-end gap-2">
              <Button size="sm" onClick={() => setDeclining(s)}>
                Decline
              </Button>
              <Button size="sm" tone="primary" disabled={accepting.isLoading} onClick={() => void acceptIt(s)}>
                Accept
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {declining && <DeclineDialog pathId={view._id} suggestion={declining} onClose={() => setDeclining(null)} />}
    </section>
  );
}

// Declining, with a note for whoever suggested it (optional).
function DeclineDialog({ pathId, suggestion, onClose }: { pathId: string; suggestion: PathSuggestion; onClose: () => void }) {
  const [decline, declining] = useDeclineSuggestionMutation();
  const [note, setNote] = useState("");
  const send = async () => {
    try {
      await decline({ id: pathId, suggestionId: suggestion._id, note: note.trim() }).unwrap();
      toast("Suggestion declined");
      onClose();
    } catch (error) {
      toast(problemOf(error, "The suggestion wasn't declined. Check your connection, then try again."), "bell");
    }
  };
  return (
    <Dialog
      title="Decline this suggestion?"
      eyebrow={`@${suggestion.by?.username ?? "someone"}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button tone="danger" disabled={declining.isLoading} onClick={() => void send()}>
            {declining.isLoading ? "Declining…" : "Decline"}
          </Button>
        </>
      }
    >
      <Field label="A note for them (optional)" hint="They see it with their suggestion.">
        {({ id, describedBy }) => <textarea id={id} aria-describedby={describedBy} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3} className={inputClass} />}
      </Field>
    </Dialog>
  );
}

// Your suggestion on someone else's path: waiting, accepted or declined (with their note), until it expires.
function YourSuggestion({ pathId, suggestion }: { pathId: string; suggestion: PathSuggestion }) {
  const [withdraw, withdrawing] = useWithdrawSuggestionMutation();
  const status = { open: { label: "Pending review", tone: "bell" as const }, accepted: { label: "Accepted", tone: "mint" as const }, declined: { label: "Declined", tone: "rose" as const } }[suggestion.status];
  const withdrawIt = async () => {
    try {
      await withdraw(pathId).unwrap();
      toast("Suggestion withdrawn");
    } catch (error) {
      toast(problemOf(error, "That didn't work. Check your connection, then try again."), "bell");
    }
  };
  return (
    <section aria-labelledby="your-suggestion" className="rounded-2xl border border-ink/10 bg-surface p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="your-suggestion" className="text-sm font-semibold">
          Your suggestion
        </h2>
        <span className="text-xs text-ink/50">{daysAgo(suggestion.at)}</span>
        <Chip tone={status.tone}>{status.label}</Chip>
      </div>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
        {suggestion.summary.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {suggestion.note && <p className="mt-2 rounded-xl bg-ink/[0.04] px-3 py-2 text-sm text-pretty">{`“${suggestion.note}”`}</p>}
      {suggestion.status === "open" && (
        <Button size="sm" disabled={withdrawing.isLoading} onClick={() => void withdrawIt()} className="mt-2">
          Withdraw
        </Button>
      )}
    </section>
  );
}

// What changed and who changed it: the newest three, then how many more, all of them a page at a time on request.
function History({ pathId }: { pathId: string }) {
  const [shown, setShown] = useState(1); // pages on show, once "Show all" is pressed
  const [all, setAll] = useState(false);
  const first = useGetHistoryQuery({ id: pathId, page: 1 });
  const data = first.data;
  if (!data || !data.entries.length) return null;
  const line = (e: (typeof data.entries)[number]) =>
    `${daysAgo(e.at)} · ${e.kind === "suggestion" ? `@${e.from?.username ?? "someone"}'s changes, accepted by @${e.by?.username ?? "someone"}` : `${e.kind === "created" ? "Created" : e.kind === "deleted" ? "Deleted" : "Edited"} by @${e.by?.username ?? "someone"}`}: ${e.summary.join("; ")}`;
  const entries = all ? data.entries : data.entries.slice(0, 3);
  const more = data.total - entries.length;
  return (
    <section aria-labelledby="path-history">
      <h2 id="path-history" className={SECTION_HEADING}>
        History
      </h2>
      <ul className="space-y-1.5 text-sm text-pretty text-ink/70">
        {entries.map((e) => (
          <li key={e._id}>{line(e)}</li>
        ))}
        {all && Array.from({ length: shown - 1 }, (_, i) => <HistoryPage key={i + 2} pathId={pathId} page={i + 2} line={line} />)}
      </ul>
      {!all && more > 0 && (
        <button type="button" onClick={() => setAll(true)} className="mt-1.5 cursor-pointer text-sm font-semibold text-brand underline-offset-2 hover:underline">
          {`and ${plural(more, "earlier change")}: show them`}
        </button>
      )}
      {all && shown < data.pages && (
        <Button size="sm" onClick={() => setShown((n) => n + 1)} className="mt-2">
          Show more
        </Button>
      )}
    </section>
  );
}

function HistoryPage({ pathId, page, line }: { pathId: string; page: number; line: (e: NonNullable<ReturnType<typeof useGetHistoryQuery>["data"]>["entries"][number]) => string }) {
  const data = useGetHistoryQuery({ id: pathId, page }).data;
  return <>{data?.entries.map((e) => <li key={e._id}>{line(e)}</li>)}</>;
}
