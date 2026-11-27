// The report card (/report-card, the prototype's ReportCard): how you stand overall, then every study set you've
// started, with search. A set's row opens its classroom, where "Up next" is (working that out needs the set's content,
// which the report card doesn't read), and its quiz report lists each question as you stand on it, with a reset.
// Someone signed out is asked to sign in, and comes back here after; while the session is being checked, the skeleton.
import { useEffect, useMemo, useRef, useState } from "react";
import type { Ref } from "react";
import { Link } from "react-router-dom";
import type { ReportCard as ReportCardData } from "@retainlearn/core";
import { useSession } from "#app/session.ts";
import { Bar } from "#components/ui/Bar.tsx";
import type { BarTone } from "#components/ui/Bar.tsx";
import { Button, buttonClass } from "#components/ui/Button.tsx";
import { cardClass, cardLinkClass } from "#components/ui/Card.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { Confirm } from "#components/ui/Confirm.tsx";
import { Empty } from "#components/ui/Empty.tsx";
import { Page } from "#components/ui/Page.tsx";
import { SearchInput } from "#components/ui/SearchInput.tsx";
import { browserTimeZone, useCampus, useToday } from "#features/campus/campusApi.ts";
import { SkillsSection } from "#features/paths/Skills.tsx";
import { SET_STATUS_TONE } from "#features/campus/subjects.ts";
import { cx } from "#utils/cx.ts";
import { setPath } from "#features/classes/modes.ts";
import { QuizReport } from "./QuizReport.tsx";
import { Overview, ReportCardSkeleton, StudySetsHeading } from "./ReportCardSkeleton.tsx";
import type { TileKey, TileValue } from "./ReportCardSkeleton.tsx";
import { useReportCard, useResetQuizMutation } from "./reportCardApi.ts";
import { daysAgoInWords, matchesSearch, overview, studiedSets } from "./reportCardStats.ts";
import type { StudiedSet } from "./reportCardStats.ts";

const SHOWN = 10; // sets shown at first, and added by each "Show more"
const pct = (x: number) => `${Math.round(x * 100)}%`;
const plural = (n: number, word: string) => `${n.toLocaleString("en")} ${word}${n === 1 ? "" : "s"}`;

export default function ReportCard() {
  const session = useSession();
  const card = useReportCard(session !== "in");
  if (session === "out") return <SignedOut />;
  if (card.isError) return <Failed retry={() => void card.refetch()} />;
  if (!card.data) return <ReportCardSkeleton />;
  return <ReportCardView card={card.data} />;
}

function SignedOut() {
  return (
    <Page title="Report card" back={false}>
      <Empty
        icon="report"
        title="Sign in to see your report card"
        body="Your progress, flashcards and player cards are saved to your account. Sign in and you'll come straight back here."
        action={
          <Link to="/sign-in" state={{ returnTo: "/report-card" }} className={buttonClass("primary")}>
            Sign in
          </Link>
        }
      />
    </Page>
  );
}

function Failed({ retry }: { retry: () => void }) {
  return (
    <Page title="Report card" back={false}>
      <Empty icon="report" title="Your report card didn't load" body="Check your connection, then try again." action={<Button tone="primary" onClick={retry}>Try again</Button>} />
    </Page>
  );
}

type Notice = { tone: "done" | "failed"; text: string };

// What each of the overview's tiles shows, from the report card and the totals worked out from it.
function tileValues(card: ReportCardData, totals: ReturnType<typeof overview>): Record<TileKey, TileValue> {
  return {
    subjects: { value: totals.subjects.toLocaleString("en") },
    sets: { value: totals.setsStarted.toLocaleString("en") },
    flashcards: { value: totals.flashcardsReviewed.toLocaleString("en") },
    accuracy: { value: totals.accuracy == null ? "None yet" : pct(totals.accuracy), note: totals.answers ? plural(totals.answers, "answer") : undefined },
    cards: {
      value: totals.playerCards.toLocaleString("en"),
      note: totals.playerCards ? (totals.fading ? `${totals.fading.toLocaleString("en")} fading` : "All fresh") : undefined,
      warn: totals.fading > 0,
    },
    streak: { value: plural(card.streak.count, "day") },
    level: { value: card.level.toLocaleString("en"), note: `${card.xp.toLocaleString("en")} XP` },
  };
}

function ReportCardView({ card }: { card: ReportCardData }) {
  const when = useToday();
  // The path you follow, for Skills (from your campus, usually loaded already).
  const campus = useCampus(useSession() !== "in");
  const sets = useMemo(() => studiedSets(card, when), [card, when]);
  const totals = useMemo(() => overview(card, sets), [card, sets]);
  const [reportFor, setReportFor] = useState<string | null>(null);
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [resetQuiz] = useResetQuizMutation();
  const find = (setId: string | null) => sets.find((s) => s.set.setId === setId)?.set;
  const reporting = find(reportFor);
  const resetting = find(resetFor);

  const reset = async (setId: string, name: string) => {
    setNotice(null);
    try {
      await resetQuiz({ setId, tz: when.timeZone ?? browserTimeZone() }).unwrap();
      setNotice({ tone: "done", text: `Quiz progress reset for ${name}.` });
    } catch {
      setNotice({ tone: "failed", text: `Quiz progress for ${name} wasn't reset. Check your connection, then try again.` });
    }
  };

  return (
    <Page title="Report card" eyebrow="Your progress" back={false}>
      <Overview values={tileValues(card, totals)} />
      <StudySets sets={sets} notice={notice} onQuizReport={setReportFor} />
      <SkillsSection skills={card.skills} path={campus.data?.player.path ?? null} />
      {reporting && (
        <QuizReport
          set={reporting}
          onClose={() => setReportFor(null)}
          onReset={() => {
            setReportFor(null);
            setResetFor(reporting.setId);
          }}
        />
      )}
      {resetting && (
        <Confirm
          title="Reset quiz progress?"
          tone="danger"
          confirmLabel="Reset quiz progress"
          body={
            <>
              Your answers and what you missed in <strong className="font-semibold text-ink">{resetting.subtopic}</strong> are cleared, so you can quiz it
              afresh. Your player cards and flashcard progress are kept.
            </>
          }
          onConfirm={() => void reset(resetting.setId, resetting.subtopic)}
          onClose={() => setResetFor(null)}
        />
      )}
    </Page>
  );
}

// Your study sets, the most recently studied first, with search and "Show more". After "Show more", focus moves to the
// first set it added, so a keyboard carries on from there; the count found is announced as you type.
function StudySets({ sets, notice, onQuizReport }: { sets: StudiedSet[]; notice: Notice | null; onQuizReport: (setId: string) => void }) {
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(SHOWN);
  const [focusFrom, setFocusFrom] = useState<number | null>(null);
  const firstAdded = useRef<HTMLAnchorElement>(null);
  const found = useMemo(() => sets.filter((s) => matchesSearch(s, query)), [sets, query]);
  const visible = found.slice(0, shown);
  const more = found.length - visible.length;
  useEffect(() => {
    if (focusFrom != null) firstAdded.current?.focus();
  }, [focusFrom]);

  return (
    <section aria-labelledby="sets-title" className="mt-8">
      <StudySetsHeading
        search={
          sets.length > 0 && (
            <SearchInput
              label="Search your study sets"
              placeholder="Search your study sets"
              value={query}
              onChange={(value) => {
                setQuery(value);
                setShown(SHOWN);
                setFocusFrom(null);
              }}
              className="w-full sm:w-72"
            />
          )
        }
      />
      <p role="status" className="sr-only">
        {query.trim() ? `${plural(found.length, "study set")} found` : ""}
      </p>
      <div role="status">
        {notice && <p className={notice.tone === "done" ? "mb-3 rounded-2xl bg-mint-wash px-3.5 py-2.5 text-sm text-mint-ink" : "mb-3 rounded-2xl bg-rose-wash px-3.5 py-2.5 text-sm text-rose-ink"}>{notice.text}</p>}
      </div>

      {sets.length === 0 ? (
        <Empty
          icon="review"
          title="No study sets yet"
          body="Start a class in any subject and it shows up here."
          action={
            <Link to="/subjects" className={buttonClass("primary")}>
              Find a subject
            </Link>
          }
        />
      ) : found.length === 0 ? (
        <Empty icon="search" title={`Nothing matches "${query.trim()}"`} body="Try a different word, or clear the search." />
      ) : (
        <ul className="space-y-3">
          {visible.map((s, i) => (
            <SetRow key={s.set.setId} studied={s} onQuizReport={() => onQuizReport(s.set.setId)} linkRef={i === focusFrom ? firstAdded : undefined} />
          ))}
        </ul>
      )}
      {more > 0 && (
        <Button
          className="mt-4 w-full sm:w-auto"
          onClick={() => {
            setFocusFrom(visible.length);
            setShown((n) => n + SHOWN);
          }}
        >
          {`Show ${Math.min(SHOWN, more)} more`}
        </Button>
      )}
    </section>
  );
}

// A set you've started (guide: card): an article whose title links to its classroom, the link stretched over the whole
// card, with the quiz report a button of its own above it. The two measures sit side by side when the card is wide
// enough, whatever the screen (a container query).
function SetRow({ studied, onQuizReport, linkRef }: { studied: StudiedSet; onQuizReport: () => void; linkRef?: Ref<HTMLAnchorElement> | undefined }) {
  const { set, stats, status } = studied;
  const answers = stats.right + stats.wrong;
  return (
    <li>
      <article className={cx("@container", cardClass)}>
        <header className="flex flex-wrap items-start gap-x-3 gap-y-2">
          <hgroup className="min-w-0 flex-1 basis-56">
            <h3 className="font-semibold text-balance">
              <Link ref={linkRef} to={setPath(set.setId)} data-card-link className={cardLinkClass}>
                {set.subtopic}
              </Link>
            </h3>
            <p className="text-xs text-ink/50">
              {set.category}, {set.topic}
            </p>
          </hgroup>
          <div className="flex flex-wrap gap-1.5">
            <Chip tone={SET_STATUS_TONE[status.key]}>{status.label}</Chip>
            {stats.daysAgo != null && <Chip>{`Studied ${daysAgoInWords(stats.daysAgo)}`}</Chip>}
          </div>
        </header>
        <div className="mt-3 grid gap-3 @lg:grid-cols-2">
          <Measure
            title="Flashcard review"
            detail={stats.flashcards ? `${stats.reviewed.toLocaleString("en")} of ${plural(stats.flashcards, "flashcard")}` : "No flashcards yet"}
            value={stats.explored}
          />
          <Measure
            title="Quiz accuracy"
            detail={stats.accuracy == null ? (stats.questions ? "No answers yet" : "No questions yet") : `${pct(stats.accuracy)} right, ${plural(answers, "answer")}`}
            value={stats.accuracy ?? 0}
            tone="mint"
          />
        </div>
        {/* For any set with questions, so it stays where focus comes back to after a reset. */}
        {set.questionCount > 0 && (
          <footer className="mt-3 flex justify-end">
            <Button size="sm" icon="report" onClick={onQuizReport} className="relative z-1">
              Quiz report
            </Button>
          </footer>
        )}
      </article>
    </li>
  );
}

function Measure({ title, detail, value, tone }: { title: string; detail: string; value: number; tone?: BarTone }) {
  return (
    <div>
      <p className="mb-1 flex flex-wrap items-baseline justify-between gap-x-2 text-xs">
        <span className="font-semibold text-ink/70">{title}</span>
        <span className="text-ink/50 tabular-nums">{detail}</span>
      </p>
      <Bar value={value} label={`${title}: ${detail}`} {...(tone ? { tone } : {})} />
    </div>
  );
}
