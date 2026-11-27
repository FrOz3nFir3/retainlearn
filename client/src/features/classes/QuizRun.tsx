// A quiz under way (the prototype's QuizClass): one question at a time, its options as buttons (or keys 1 to 4, A to
// D), what the answer did to your player card the moment it lands, and why on a miss. Each answer is saved as you go
// (useClassSaver), so leaving loses nothing. Beside each question, what it's worth: a new player card to win, or yours
// and its level, which turns over to what the answer did. What an answer does is worked out here with the same rule
// the server uses (answerQuestion in packages/core), so the screen never waits for a save. The end (the prototype's):
// a round's stars landing (else the balls), the best run, the round's panel with every round to jump to, the player
// cards won, every answer (yours and the right one, for a miss), and the ways on: the flashcards behind your misses,
// retry what you missed, the next round (in the order you study, as the classroom's Up next). And the XP the server
// counted, the streak and the timetable.
import { useEffect, useRef, useState } from "react";
import { answerQuestion, isPlayerCard, nextRound, reviewLoad, roundState, setRounds, studySetStats, upNext, xpForQuestion } from "@retainlearn/core";
import type { ClassMode, ProgressView, QuestionProgress, StudySetContent, When } from "@retainlearn/core";
import { Link } from "react-router-dom";
import { useSignedIn } from "#app/hooks.ts";
import { Button, buttonClass } from "#components/ui/Button.tsx";
import { Stars } from "#features/classroom/Stars.tsx";
import { useStudyView } from "#features/classroom/useStudyView.ts";
import { cx } from "#utils/cx.ts";
import { Icon } from "#components/ui/Icon.tsx";
import { RichText } from "#components/ui/RichText.tsx";
import { textOf } from "#utils/safeHtml.ts";
import { AnswerOption } from "./AnswerOption.tsx";
import { ClassShell, Resumed, useReturnTo } from "./ClassShell.tsx";
import { classPath } from "./modes.ts";
import { Pips } from "./Pips.tsx";
import { recallPoints } from "./recallPoints.ts";
import { RoundStrip } from "./RoundStrip.tsx";
import type { QuizPlan } from "./quizPlan.ts";
import { answerOptions } from "./quizPlan.ts";
import { Summary, useWasCold } from "./Summary.tsx";
import type { ClassResult } from "./Summary.tsx";
import { useClassSaver } from "./useClassSaver.ts";

const PIPS_UP_TO = 12; // more balls than this won't fit a phone's row: a longer quiz shows a bar instead
const MAX_MS = 3_600_000;

type Reward = { kind: "new" | "level" | "kept" | "slip" | "none"; from: number; to: number };

// What an answer did to the question's player card.
function rewardOf(had: QuestionProgress | undefined, now: QuestionProgress, correct: boolean): Reward {
  const from = had?.level ?? 0;
  const to = now.level ?? 0;
  if (correct) return { kind: !isPlayerCard(had) ? "new" : to > from ? "level" : "kept", from, to };
  return { kind: isPlayerCard(had) ? "slip" : "none", from, to };
}

const REWARD_TEXT: Record<Reward["kind"], (r: Reward) => string> = {
  new: () => "New player card! Remember it again after a day or more and it levels up.",
  level: (r) => `Level ${r.from} → ${r.to}: remembered after a gap, so it's stronger.`,
  kept: () => "Right. You hold this player card already: come back to it after a day or more and it levels up.",
  slip: (r) => `Not this time. Your player card slips to level ${r.to}, and it's on your retry list.`,
  none: () => "Not this time. It's on your retry list, and you'll earn the player card when you get it right.",
};

// What a question is worth, beside it before you answer: a new player card to win (face down), or yours and its level.
// Then what the answer did, as the card turns over: won, levelled up, kept, or slipped. It never promises a level up:
// that needs remembering it after a gap.
function Stake({ held, reward }: { held: QuestionProgress | undefined; reward: Reward | null }) {
  const holds = isPlayerCard(held);
  const text = !reward
    ? holds
      ? `Your player card, level ${held?.level}`
      : "A new player card to win"
    : reward.kind === "new"
      ? "New player card"
      : reward.kind === "level"
        ? `Level ${reward.from} → ${reward.to}`
        : reward.kind === "kept"
          ? `Kept, level ${reward.to}`
          : reward.kind === "slip"
            ? `Slips to level ${reward.to}`
            : "Not won yet";
  const faceUp = reward ? reward.kind !== "none" : holds;
  return (
    <span className={cx("ml-auto flex items-center gap-1.5 text-xs font-semibold", !reward ? "text-ink/55" : reward.kind === "none" || reward.kind === "slip" ? "text-rose-ink" : "text-mint-ink")}>
      <span
        key={reward?.kind ?? "before"}
        aria-hidden="true"
        className={cx(
          "grid h-7 w-5 place-items-center rounded-[5px] text-[10px] font-bold text-white shadow-sm ring-1 ring-black/10",
          faceUp ? "bg-brand" : "bg-night",
          reward && "motion-safe:animate-[kit-land_0.5s_both]",
        )}
      >
        {faceUp ? <span className="h-4 w-2.5 rounded-[2px] border border-white/60" /> : "?"}
      </span>
      {text}
    </span>
  );
}

// picked: the answer you chose, null for one given before you left (it isn't kept).
type Answer = { id: string; correct: boolean; picked: string | null; reward: Reward };
// A question answered before you left a class you've carried on: right, missed, or not known (null).
export type Earlier = { id: string; correct: boolean | null };
const NO_REWARD: Reward = { kind: "none", from: 0, to: 0 };

type Props = {
  set: StudySetContent;
  progress: ProgressView | null;
  mode: Extract<ClassMode, "quiz" | "retryMissed">;
  when: When;
  plan: QuizPlan;
  keyRound: string; // what the class is, in its sitting's key (resume.ts)
  earlier: readonly Earlier[]; // in a class carried on, the questions answered before you left
  resume: { key: string; seq: number } | null;
  onRestart?: () => void;
};

export function QuizRun({ set, progress, mode, when, plan, keyRound, earlier, resume, onRestart }: Props) {
  const wasCold = useWasCold(set.category);
  const questions = plan.questions;
  const start = earlier.length;
  const [options] = useState(() => questions.map((q) => answerOptions(q)));
  const saver = useClassSaver(set._id, mode, keyRound, resume);
  const [marks, setMarks] = useState<{ correct: boolean | null }[]>(() => earlier.map((e) => ({ correct: e.correct })));
  const [picked, setPicked] = useState<number | null>(null);
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState(0);
  // This sitting's, for the end: in a class carried on, the earlier ones whose outcome is known come first.
  const [answers, setAnswers] = useState<Answer[]>(() => earlier.flatMap((e) => (e.correct === null ? [] : [{ id: e.id, correct: e.correct, picked: null, reward: NO_REWARD }])));
  const signedIn = useSignedIn();
  const { view } = useStudyView(signedIn);
  const returnTo = useReturnTo(set._id);
  const [mine, setMine] = useState<Record<string, QuestionProgress>>(() => ({ ...(progress?.questions ?? {}) }));
  const [reward, setReward] = useState<Reward | null>(null);
  const [result, setResult] = useState<ClassResult | null>(null);
  const [finishing, setFinishing] = useState(false);
  const xp = useRef(0);
  const shownAt = useRef(performance.now());

  useEffect(() => {
    saver.onSaved = (saved) => {
      xp.current += saved.xp;
    };
  }, [saver]);

  const answered = picked !== null;
  const index = Math.min(marks.length - (answered ? 1 : 0), questions.length - 1);
  const question = questions[index];
  const opts = options[index] ?? [];

  const pick = (i: number) => {
    const option = opts[i];
    // Never more answers than questions: an answer key pressed while the class finishes isn't another answer.
    if (answered || finishing || marks.length >= questions.length || !question || !option) return;
    const had = mine[question._id];
    const now = answerQuestion(had, option.correct, { at: new Date(), timeZone: when.timeZone });
    const next = [...marks, { correct: option.correct }];
    setMine((m) => ({ ...m, [question._id]: now }));
    const got = rewardOf(had, now, option.correct);
    setReward(got);
    setPicked(i);
    setCombo((c) => {
      const run = option.correct ? c + 1 : 0;
      setBest((b) => Math.max(b, run));
      return run;
    });
    setAnswers((list) => [...list, { id: question._id, correct: option.correct, picked: option.html, reward: got }]);
    setMarks(next);
    const ms = Math.min(MAX_MS, Math.round(performance.now() - shownAt.current));
    saver.record({ kind: "question", itemId: question._id, correct: option.correct, ms }, { ids: questions.map((q) => q._id), index: next.length });
  };

  const finish = async () => {
    setFinishing(true);
    const last = await saver.finish().catch(() => null);
    setResult({
      xp: xp.current,
      streak: last?.finished?.streak,
      firstToday: last?.finished?.firstToday,
      timetableDone: last?.finished?.timetableDone,
      masteryBefore: studySetStats(set, progress, when).mastery,
      masteryAfter: studySetStats(set, { ...progress, questions: mine }, when).mastery,
    });
  };

  const next = () => {
    if (!answered) return;
    setPicked(null);
    setReward(null);
    shownAt.current = performance.now();
    if (marks.length >= questions.length) void finish();
  };

  // Keys: 1 to 4 or A to D answer, Enter or → moves on (not also a click on the focused answer, which could answer the
  // next question for you).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (result || finishing || (e.target as Element | null)?.closest?.("input, textarea, [contenteditable='true']")) return;
      const n = "1234".includes(e.key) ? Number(e.key) - 1 : "abcd".indexOf(e.key.toLowerCase());
      if (!answered && n >= 0) pick(n);
      else if (answered && (e.key === "Enter" || e.key === "ArrowRight")) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const right = marks.filter((m) => m.correct).length;
  const pips = questions.length <= PIPS_UP_TO;
  const linked = question?.flashcardId ? set.flashcards.find((f) => f._id === question.flashcardId) : undefined;

  if (result || finishing) {
    // The set's rounds as they stand now, for the round's panel and what's next.
    const after = { setId: set._id, order: progress?.order ?? null, flashcards: progress?.flashcards ?? {}, questions: mine, quiz: progress?.quiz ?? { started: 0, finished: 0 }, classInProgress: null, lastAt: null };
    const rounds = setRounds(set, progress?.order, (f) => reviewLoad(recallPoints(f.answer).length));
    const states = rounds.map((r) => roundState(r, after, when));
    const here = plan.round ? states[rounds.findIndex((r) => r.n === plan.round)] : undefined;
    const quizOnly = view === "quiz" || !set.flashcards.length;
    const onward = plan.round ? (quizOnly ? (() => {
      const r = nextRound(rounds, states);
      return r ? { round: r, mode: "quiz" as const } : null;
    })() : upNext(rounds, states)) : null;
    const won = answers.filter((a) => a.reward.kind === "new" || a.reward.kind === "level");
    const fresh = won.filter((a) => a.reward.kind === "new").length;
    const missedNow = Object.values(mine).filter((q) => q.missedOn != null).length;
    const behind = [...new Set(answers.filter((a) => !a.correct).map((a) => questions.find((q) => q._id === a.id)?.flashcardId).filter((id): id is string => !!id && set.flashcards.some((f) => f._id === id)))];
    const textOfQuestion = (id: string) => questions.find((q) => q._id === id);
    return (
      <ClassShell set={set} mode={mode} progress={1}>
        {result ? (
          <Summary
            setId={set._id}
            warmAgain={wasCold}
            title={plan.round ? `Round ${plan.round} done` : plan.title ? `${plan.title}: done` : "Quiz finished"}
            result={result}
            hero={
              <div className="flex flex-col items-center gap-2 rounded-2xl bg-mist px-4 py-4 text-center">
                {here ? <Stars count={here.stars} className="[&_svg]:size-12 [&_svg]:motion-safe:animate-[kit-land_0.5s_both]" /> : questions.length <= PIPS_UP_TO && <Pips marks={marks} total={questions.length} index={-1} />}
                <p className="text-sm font-semibold">
                  {right} of {marks.length} right{best >= 3 ? `, best run ${best} in a row` : ""}
                </p>
              </div>
            }
            lines={[]}
            extra={
              <>
                {here && plan.round && (
                  <div className="panel bg-surface p-4">
                    <p className="font-semibold">
                      Round {plan.round} of {rounds.length}: {here.right} of {here.total} held as player cards
                    </p>
                    <p className="text-sm text-ink/55">{here.stars === 3 ? "Three stars. This round is done." : "Answer the rest right for three stars. What you missed comes back in “Retry what you missed”."}</p>
                    <RoundStrip setId={set._id} rounds={rounds} states={states} current={plan.round} kind="quiz" returnTo={returnTo} />
                  </div>
                )}
                {won.length > 0 && (
                  <div className="panel bg-surface p-4">
                    <p className="mb-2 text-sm font-semibold">
                      {fresh ? `${fresh} new player card${fresh === 1 ? "" : "s"}` : "Stronger player cards"}
                      {fresh && won.length > fresh ? `, ${won.length - fresh} levelled up` : ""}
                    </p>
                    <ul className="space-y-1.5">
                      {won.map((a) => (
                        <li key={a.id} className="flex items-center gap-2 text-sm">
                          <span aria-hidden="true" className="grid h-7 w-5 shrink-0 place-items-center rounded-[5px] bg-brand shadow-sm ring-1 ring-black/10">
                            <span className="h-4 w-2.5 rounded-[2px] border border-white/60" />
                          </span>
                          <span className="min-w-0 flex-1 truncate">{textOf(textOfQuestion(a.id)?.question ?? "")}</span>
                          <span className="shrink-0 text-xs font-semibold text-mint-ink">{a.reward.kind === "new" ? "New" : `Level ${a.reward.from} → ${a.reward.to}`}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {answers.length > 0 && (
                  <div className="panel bg-surface p-4">
                    <h3 className="mb-2 text-sm font-semibold">Your answers</h3>
                    <ol className="space-y-3">
                      {answers.map((a) => {
                        const q = textOfQuestion(a.id);
                        return (
                          <li key={a.id} className="rounded-xl border border-ink/[0.07] p-3 text-sm">
                            <div className="flex items-start gap-2">
                              <Icon name={a.correct ? "check" : "x"} className={cx("mt-0.5 size-4 shrink-0", a.correct ? "text-mint" : "text-danger")} strokeWidth={2.4} />
                              <span className="sr-only">{a.correct ? "Right: " : "Missed: "}</span>
                              <RichText html={q?.question ?? ""} className="min-w-0 flex-1 !text-sm" />
                            </div>
                            {!a.correct && (
                              <div className="mt-2 grid gap-1 pl-6 text-[13px]">
                                {a.picked !== null && (
                                  <div className="flex gap-1 text-rose-ink">
                                    <span className="shrink-0 font-semibold">You:</span> <RichText html={a.picked} className="min-w-0 !text-[13px] !text-rose-ink" />
                                  </div>
                                )}
                                <div className="flex gap-1 text-mint-ink">
                                  <span className="shrink-0 font-semibold">Answer:</span> <RichText html={q?.answer ?? ""} className="min-w-0 !text-[13px] !text-mint-ink" />
                                </div>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}
              </>
            }
            actions={
              <>
                {behind.length > 0 && (
                  <Link to={`${classPath(set._id, "review")}?ids=${behind.join(",")}`} state={{ returnTo }} className={buttonClass("quiet")}>
                    Review the flashcard{behind.length === 1 ? "" : "s"} behind your misses
                  </Link>
                )}
                {missedNow > 0 && mode !== "retryMissed" && (
                  <Link to={classPath(set._id, "retryMissed")} state={{ returnTo }} className={buttonClass("quiet")}>
                    Retry what you missed ({missedNow})
                  </Link>
                )}
                {onward && (
                  <Link to={`${classPath(set._id, onward.mode)}?round=${onward.round.n}`} state={{ returnTo }} className={buttonClass("quiet")}>
                    {onward.mode === "review" ? "Review" : "Quiz"} round {onward.round.n}
                  </Link>
                )}
              </>
            }
          />
        ) : (
          <p className="text-center text-sm text-ink/60" role="status">
            Saving your answers…
          </p>
        )}
      </ClassShell>
    );
  }
  if (!question) return null;

  return (
    <ClassShell
      set={set}
      mode={mode}
      progressText={pips ? (plan.title ?? "Quiz") : `${plan.title ? `${plan.title} · ` : ""}Question ${index + 1} of ${questions.length}`}
      progress={pips ? undefined : marks.length / questions.length}
      track={
        pips && (
          <div className="flex min-h-6 flex-wrap items-center gap-x-3 gap-y-1.5">
            <Pips marks={marks} total={questions.length} index={answered ? -1 : index} size="size-6" />
            {combo >= 2 && (
              <span key={combo} className="ml-auto rounded-full bg-bell-wash px-2.5 py-0.5 text-xs font-bold text-bell-ink motion-safe:animate-[kit-land_0.5s_both]">
                {combo} in a row
              </span>
            )}
          </div>
        )
      }
      bar={
        answered ? (
          <Button tone="primary" data-autofocus className="w-full sm:w-auto" onClick={next}>
            {marks.length < questions.length ? "Next question" : "See results"}
          </Button>
        ) : (
          <span className="mr-auto text-sm text-ink/50">Pick an answer, or press 1–4</span>
        )
      }
    >
      {onRestart && marks.length === start && start > 0 && (
        <Resumed text={`Picking up where you left off: ${start} of ${questions.length} answered.`} onRestart={onRestart} />
      )}
      <div className="panel bg-surface p-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-xs font-semibold text-brand">Question {index + 1}</p>
          <Stake held={answered ? (progress?.questions[question._id] ?? undefined) : mine[question._id]} reward={answered ? reward : null} />
        </div>
        <RichText html={question.question} className="mt-1 text-[17px] font-medium text-ink" />
      </div>
      <div className="mt-3 grid gap-2">
        {opts.map((option, i) => (
          <AnswerOption
            key={`${question._id}-${i}`}
            html={option.html}
            index={i}
            answered={answered}
            correct={option.correct}
            picked={picked === i}
            xp={xpForQuestion(option.correct)}
            onPick={() => pick(i)}
          />
        ))}
      </div>
      {answered && reward && (
        <div className="mt-4 space-y-3 motion-safe:animate-[kit-rise_0.35s_both]" role="status">
          <p className={reward.kind === "none" || reward.kind === "slip" ? "rounded-2xl bg-rose-wash px-4 py-3 text-sm font-semibold text-rose-ink" : "rounded-2xl bg-mint-wash px-4 py-3 text-sm font-semibold text-mint-ink"}>
            {REWARD_TEXT[reward.kind](reward)}
          </p>
          {linked && (
            <details open={reward.kind === "none" || reward.kind === "slip"} className="panel bg-surface p-4">
              <summary className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-brand">
                <Icon name="review" className="size-4" /> Why? From its flashcard
              </summary>
              <RichText html={linked.answer} className="mt-2" />
            </details>
          )}
        </div>
      )}
    </ClassShell>
  );
}
