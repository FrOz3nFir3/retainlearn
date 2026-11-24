// A quiz under way (the prototype's QuizClass): one question at a time, its options as buttons (or keys 1 to 4, A to
// D), what the answer did to your player card the moment it lands, and why on a miss. Each answer is saved as you go
// (useClassSaver), so leaving loses nothing. What an answer does to the flashcard is worked out here with the same rule the
// server uses (answerQuestion in packages/core), so the screen never waits for a save. The end: the score as balls,
// the XP the server counted, the streak and the timetable.
import { useEffect, useRef, useState } from "react";
import { answerQuestion, isPlayerCard, studySetStats, xpForQuestion } from "@retainlearn/core";
import type { ClassMode, ProgressView, QuestionProgress, StudySetContent, When } from "@retainlearn/core";
import { Button } from "#components/ui/Button.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { RichText } from "#components/ui/RichText.tsx";
import { AnswerOption } from "./AnswerOption.tsx";
import { ClassShell, Resumed } from "./ClassShell.tsx";
import { Pips } from "./Pips.tsx";
import type { QuizPlan } from "./quizPlan.ts";
import { answerOptions } from "./quizPlan.ts";
import { Summary } from "./Summary.tsx";
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

type Props = {
  set: StudySetContent;
  progress: ProgressView | null;
  mode: Extract<ClassMode, "quiz" | "retryMissed">;
  when: When;
  plan: QuizPlan;
  start: number; // questions already answered, in a class carried on
  resume: { key: string; seq: number } | null;
  onRestart?: () => void;
};

export function QuizRun({ set, progress, mode, when, plan, start, resume, onRestart }: Props) {
  const questions = plan.questions;
  const [options] = useState(() => questions.map((q) => answerOptions(q)));
  const saver = useClassSaver(set._id, mode, plan.round ?? "pick", resume);
  const [marks, setMarks] = useState<{ correct: boolean | null }[]>(() => Array.from({ length: start }, () => ({ correct: null })));
  const [picked, setPicked] = useState<number | null>(null);
  const [combo, setCombo] = useState(0);
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
    if (answered || !question || !option) return;
    const had = mine[question._id];
    const now = answerQuestion(had, option.correct, { at: new Date(), timeZone: when.timeZone });
    const next = [...marks, { correct: option.correct }];
    setMine((m) => ({ ...m, [question._id]: now }));
    setReward(rewardOf(had, now, option.correct));
    setPicked(i);
    setCombo((c) => (option.correct ? c + 1 : 0));
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
      if (result || (e.target as Element | null)?.closest?.("input, textarea, [contenteditable='true']")) return;
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
    return (
      <ClassShell set={set} mode={mode} progress={1}>
        {result ? (
          <Summary
            setId={set._id}
            title={plan.title ? `${plan.title}: done` : "Quiz finished"}
            result={result}
            hero={<Pips marks={marks.map((m) => ({ correct: m.correct ?? false }))} total={questions.length} index={-1} />}
            lines={[["Right", `${right} of ${marks.length}`]]}
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
            <Pips marks={marks.map((m) => ({ correct: m.correct ?? false }))} total={questions.length} index={answered ? -1 : index} size="size-6" />
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
        <p className="text-xs font-semibold text-brand">Question {index + 1}</p>
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
