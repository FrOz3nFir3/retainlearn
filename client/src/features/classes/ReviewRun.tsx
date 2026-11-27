// A review under way (the prototype's ReviewRun): its flashcards one at a time, point by point (PointsFlashcard) or whole
// (WholeFlashcard), with every recall point in the header's track. Each flashcard is saved as you finish it
// (useClassSaver), with the points you marked, so leaving loses at most the one you're on. The end (the prototype's):
// the share of recall points you knew on a ring, the flashcards with points missed before and after, the round's panel
// with every round to jump to, the next class (after a round: its quiz, else the questions you missed in it, else what's
// up next), what comes back sooner, and the XP, streak and timetable.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { quizDone, reviewFlashcard, reviewLoad, roundState, setRounds, studySetStats, upNext } from "@retainlearn/core";
import type { FlashcardProgress, ProgressView, StudySetContent, When } from "@retainlearn/core";
import { buttonClass } from "#components/ui/Button.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { ClassShell, Resumed, SAVE_FAILED, useReturnTo } from "./ClassShell.tsx";
import { classPath } from "./modes.ts";
import { PointsFlashcard } from "./PointsFlashcard.tsx";
import type { FlashcardResult } from "./PointsFlashcard.tsx";
import { PointTrack } from "./PointTrack.tsx";
import { recallPoints } from "./recallPoints.ts";
import { RoundStrip } from "./RoundStrip.tsx";
import type { PointState } from "./PointTrack.tsx";
import type { ReviewPlan } from "./reviewPlan.ts";
import { byPoints } from "./reviewPlan.ts";
import { Ring } from "./Ring.tsx";
import { Summary, useWasCold } from "./Summary.tsx";
import type { ClassResult } from "./Summary.tsx";
import { useClassSaver, useSaveFailed } from "./useClassSaver.ts";
import { WholeFlashcard } from "./WholeFlashcard.tsx";

const MAX_MS = 3_600_000;

type Props = {
  set: StudySetContent;
  progress: ProgressView | null;
  mode: "review" | "reviewMissed";
  when: When;
  plan: ReviewPlan;
  keyRound: string; // what the class is, in its sitting's key (resume.ts)
  start: number; // flashcards already done, in a class carried on
  resume: { key: string; seq: number } | null;
  onRestart?: () => void;
};

export function ReviewRun({ set, progress, mode, when, plan, keyRound, start, resume, onRestart }: Props) {
  const wasCold = useWasCold(set.category);
  const flashcards = plan.flashcards;
  const saver = useClassSaver(set._id, mode, keyRound, resume);
  const problem = useSaveFailed(saver) ? SAVE_FAILED : null;
  const [index, setIndex] = useState(start);
  const [marks, setMarks] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<FlashcardResult[]>([]);
  const [mine, setMine] = useState<Record<string, FlashcardProgress>>(() => ({ ...(progress?.flashcards ?? {}) }));
  const [result, setResult] = useState<ClassResult | null>(null);
  const [finishing, setFinishing] = useState(false);
  const xp = useRef(0);
  const shownAt = useRef(performance.now());
  const returnTo = useReturnTo(set._id);

  useEffect(() => {
    saver.onSaved = (saved) => {
      xp.current += saved.xp;
    };
  }, [saver]);

  const finishFlashcard = (done: FlashcardResult) => {
    const flashcard = flashcards[index];
    if (!flashcard) return;
    setMine((m) => ({ ...m, [flashcard._id]: reviewFlashcard(m[flashcard._id], done.knew, { at: new Date(), timeZone: when.timeZone, points: done.points }) }));
    const ms = Math.min(MAX_MS, Math.round(performance.now() - shownAt.current));
    saver.record({ kind: "flashcard", itemId: flashcard._id, knew: done.knew, points: done.points, ms }, { ids: flashcards.map((c) => c._id), index: index + 1 });
    setResults((r) => [...r, done]);
    setMarks({});
    shownAt.current = performance.now();
    if (index + 1 < flashcards.length) {
      setIndex(index + 1);
      return;
    }
    setFinishing(true);
    void saver
      .finish()
      .catch(() => null)
      .then((last) => {
        const after = { ...progress, flashcards: { ...(progress?.flashcards ?? {}), ...mine, [flashcard._id]: reviewFlashcard(mine[flashcard._id], done.knew, { at: new Date(), timeZone: when.timeZone, points: done.points }) } };
        setResult({
          xp: xp.current,
          streak: last?.finished?.streak,
          firstToday: last?.finished?.firstToday,
          timetableDone: last?.finished?.timetableDone,
          masteryBefore: studySetStats(set, progress, when).mastery,
          masteryAfter: studySetStats(set, after, when).mastery,
        });
      });
  };

  const shellBase = { set, mode, problem };
  if (result || finishing) {
    const all = [...results];
    const known = all.reduce((n, r) => n + r.known, 0);
    const total = all.reduce((n, r) => n + r.weight, 0);
    const share = total ? known / total : 0;
    const comeBack = all.filter((r) => !r.knew);
    const missedNow = Object.values(mine).filter((f) => f.missedOn != null).length;
    const missedBefore = Object.values(progress?.flashcards ?? {}).filter((f) => f.missedOn != null).length;
    const quizIds = set.questions.filter((q) => q.flashcardId && plan.flashcards.some((c) => c._id === q.flashcardId)).map((q) => q._id);
    // The set's rounds as they stand now, for the round's panel and what's next.
    const after = { setId: set._id, order: progress?.order ?? null, flashcards: mine, questions: progress?.questions ?? {}, quiz: progress?.quiz ?? { started: 0, finished: 0 }, classInProgress: null, lastAt: null };
    const rounds = setRounds(set, progress?.order, (f) => reviewLoad(recallPoints(f.answer).length));
    const states = rounds.map((r) => roundState(r, after, when));
    const at = plan.round ? rounds.findIndex((r) => r.n === plan.round) : -1;
    const round = rounds[at];
    const here = states[at];
    const missedInRound = round ? round.questions.filter((q) => progress?.questions[q._id]?.missedOn != null).map((q) => q._id) : [];
    const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
    const onward = round && here ? (round.questions.length && !quizDone(here) ? { round, mode: "quiz" as const } : missedInRound.length ? null : upNext(rounds, states)) : null;
    const next =
      mode === "reviewMissed"
        ? Object.values(progress?.questions ?? {}).some((q) => q.missedOn != null) && { to: classPath(set._id, "retryMissed"), title: "Next: retry the questions you missed", body: "The quiz questions you got wrong, now that you've gone over them." }
        : round
          ? missedInRound.length && here && quizDone(here)
            ? { to: `${classPath(set._id, "retryMissed")}?ids=${missedInRound.join(",")}`, title: `Next: retry ${plural(missedInRound.length, "quiz question")} you missed`, body: "The ones in this round, now that you've gone over it." }
            : onward && {
                to: `${classPath(set._id, onward.mode)}?round=${onward.round.n}`,
                title: `Next: ${onward.mode === "review" ? "review" : "quiz"} round ${onward.round.n}`,
                body:
                  onward.mode === "quiz"
                    ? `${plural(onward.round.questions.length, "quiz question")}${onward.round.n === plan.round ? " on what you just reviewed, while it's fresh" : ""}. Each one you get right becomes a player card.`
                    : `${plural(onward.round.flashcards.length, "flashcard")}, about ${onward.round.load} recall points.`,
              }
          : quizIds.length > 0 && {
              to: `${classPath(set._id, "quiz")}?ids=${quizIds.join(",")}`,
              title: `Next: ${quizIds.length} quiz questions on these flashcards`,
              body: "On what you just reviewed, while it's fresh. Each one you get right becomes a player card.",
            };
    return (
      <ClassShell {...shellBase} progress={1}>
        {result ? (
          <Summary
            setId={set._id}
            warmAgain={wasCold}
            title={mode === "reviewMissed" ? "Gone over" : plan.round ? `Round ${plan.round} reviewed` : "Review done"}
            result={result}
            hero={
              <div className="flex items-center justify-center gap-4 rounded-2xl bg-mist px-4 py-4">
                <Ring value={share} size="size-16" tone={share >= 0.8 ? "text-mint" : share >= 0.5 ? "text-bell" : "text-danger"}>
                  {Math.round(share * 100)}%
                </Ring>
                <div className="min-w-0 text-sm">
                  <p className="font-semibold">
                    {known} of {total} recall points
                  </p>
                  <p className="text-ink/60">
                    {all.length} flashcard{all.length === 1 ? "" : "s"}: {all.length - comeBack.length} solid{comeBack.length ? `, ${comeBack.length} to revisit` : ""}
                  </p>
                </div>
              </div>
            }
            lines={missedBefore || missedNow ? [["Flashcards with points you missed", `${missedBefore} → ${missedNow}`]] : []}
            extra={
              <>
                {round && here && (
                  <div className="panel bg-surface p-4">
                    <p className="font-semibold">
                      Round {round.n} of {rounds.length}: {here.reviewed} of {here.flashcards} flashcards reviewed
                    </p>
                    <p className="text-sm text-ink/55">{here.weak ? `${here.weak === 1 ? "1 has" : `${here.weak} have`} points you missed: they wait in “Go over what you missed”.` : "Nothing missed in this round."}</p>
                    <RoundStrip setId={set._id} rounds={rounds} states={states} current={round.n} kind="review" returnTo={returnTo} />
                  </div>
                )}
                {next && (
                  <div className="panel flex items-center gap-3 bg-surface p-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                      <Icon name={next.to.includes("/retry-missed") ? "focus" : next.to.includes("/review") ? "review" : "quiz"} className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{next.title}</p>
                      <p className="text-sm text-ink/55">{next.body}</p>
                    </div>
                    <Link to={next.to} state={{ returnTo }} className={buttonClass("primary")}>
                      Start
                    </Link>
                  </div>
                )}
                {comeBack.length > 0 && (
                  <div className="panel bg-surface p-4 text-sm">
                    <h3 className="mb-2 font-semibold">Coming back sooner</h3>
                    <ul className="space-y-1.5 text-ink/70">
                      {comeBack.map((r) => (
                        <li key={r.id} className="line-clamp-2">
                          {r.missed.length ? `${r.missed.slice(0, 4).join(", ")}${r.missed.length > 4 ? "…" : ""}` : "The whole flashcard"}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            }
            actions={
              mode !== "reviewMissed" && missedNow > 0 ? (
                <Link to={classPath(set._id, "reviewMissed")} state={{ returnTo }} className={buttonClass("quiet")}>
                  Go over what you missed ({missedNow})
                </Link>
              ) : undefined
            }
          />
        ) : (
          <p className="text-center text-sm text-ink/60" role="status">
            Saving your review…
          </p>
        )}
      </ClassShell>
    );
  }

  const flashcard = flashcards[index];
  if (!flashcard) return null;
  // Every point in this class, flashcard by flashcard, for the header's track. A flashcard reviewed whole counts as one point.
  const groups: PointState[][] = flashcards.map((c, i) => {
    const keys = byPoints(c) ? c.points.map((p) => p.key) : [c._id];
    const done = i < index ? results[i - start] : undefined;
    const marked: Record<string, boolean | undefined> = i < index ? (done ? (byPoints(c) ? Object.fromEntries(done.points.map((p) => [p.key, p.knew])) : { [c._id]: done.knew }) : {}) : i === index && byPoints(c) ? marks : {};
    const at = i === index ? keys.findIndex((k) => marked[k] === undefined) : -1;
    return keys.map((k, j) => (marked[k] === true ? "knew" : marked[k] === false ? "missed" : j === at ? "now" : "later"));
  });
  const totalPoints = flashcards.reduce((n, c) => n + (byPoints(c) ? c.points.length : 1), 0);
  const donePoints = results.reduce((n, r) => n + r.weight, 0) + Object.keys(marks).length;
  const where = plan.round ? `Round ${plan.round}${plan.again ? " again" : ""} · ` : plan.picked ? "Your pick · " : "";
  const shell = { ...shellBase, progressText: `${where}Flashcard ${index + 1} of ${flashcards.length}, ${donePoints} of ${totalPoints} points`, track: <PointTrack groups={groups} /> };
  const notice = onRestart && index === start && start > 0 && !Object.keys(marks).length ? <Resumed text={`Picking up where you left off: flashcard ${index + 1} of ${flashcards.length}.`} onRestart={onRestart} /> : undefined;

  return byPoints(flashcard) ? (
    <PointsFlashcard key={flashcard._id} shell={shell} flashcard={flashcard} last={index + 1 >= flashcards.length} marks={marks} onMark={(key, knew) => setMarks((m) => ({ ...m, [key]: knew }))} onDone={finishFlashcard} notice={notice} />
  ) : (
    <WholeFlashcard key={flashcard._id} shell={shell} flashcard={flashcard} onDone={finishFlashcard} notice={notice} />
  );
}
