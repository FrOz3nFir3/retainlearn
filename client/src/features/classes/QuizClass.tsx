// A quiz class: /study-sets/:id/quiz (?round=n, ?mix=1 or ?ids=…) and /study-sets/:id/retry-missed (retry what
// you missed). While the set and your progress load, the class's skeleton. The same class left halfway today is
// carried on (resume.ts), with the way to start afresh. The questions are chosen once, as the class starts, so saving answers
// (which updates your progress) never reshuffles them.
import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { dayKey, reviewLoad } from "@retainlearn/core";
import type { ProgressView, StudySetContent, When } from "@retainlearn/core";
import { useSession } from "#app/session.ts";
import { buttonClass } from "#components/ui/Button.tsx";
import { Empty } from "#components/ui/Empty.tsx";
import { browserTimeZone } from "#features/campus/campusApi.ts";
import { useGetProgressQuery, useGetStudySetQuery } from "#features/classroom/classroomApi.ts";
import { ClassShell } from "./ClassShell.tsx";
import { ClassSkeleton } from "./ClassSkeleton.tsx";
import { classPath } from "./modes.ts";
import { planQuiz } from "./quizPlan.ts";
import type { QuizPlan } from "./quizPlan.ts";
import { QuizRun } from "./QuizRun.tsx";
import type { Earlier } from "./QuizRun.tsx";
import { recallPoints } from "./recallPoints.ts";
import { answeredBefore, carryOn, keyRound } from "./resume.ts";

type Mode = "quiz" | "retryMissed";

export default function QuizClass({ mode }: { mode: Mode }) {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const session = useSession();
  const signedIn = session === "in";
  const set = useGetStudySetQuery(id);
  const progress = useGetProgressQuery(id, { skip: !signedIn });
  if (set.isError) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-mist p-4">
        <Empty icon="x" title="This study set isn't here" body="It may have been deleted, or the link is wrong." action={<Link to="/subjects" className={buttonClass("primary")}>Find a set</Link>} />
      </div>
    );
  }
  if (!set.data || session === "checking" || (signedIn && progress.isLoading)) return <ClassSkeleton label="Loading the quiz" mode={mode} />;
  return <QuizStart key={`${mode}:${id}?${params}`} set={set.data} progress={progress.data ?? null} mode={mode} params={params} />;
}

// earlier: in a class carried on, the questions answered before leaving and how they went (resume.ts).
type Run = { plan: QuizPlan; keyRound: string; start: number; earlier: Earlier[]; resume: { key: string; seq: number } | null; id: number };

function QuizStart({ set, progress, mode, params }: { set: StudySetContent; progress: ProgressView | null; mode: Mode; params: URLSearchParams }) {
  const [when] = useState<When>(() => {
    const timeZone = browserTimeZone();
    return { today: dayKey(new Date(), timeZone), timeZone };
  });
  const ids = params.get("ids");
  const choice = { round: Number(params.get("round")) || null, mix: params.get("mix") === "1", picked: ids ? new Set(ids.split(",")) : null };
  const fresh = (): Run => {
    const plan = planQuiz(set, progress, mode === "retryMissed", when, choice, (f) => reviewLoad(recallPoints(f.answer).length));
    return { plan, keyRound: keyRound(plan.round, choice.mix), start: 0, earlier: [], resume: null, id: Date.now() };
  };
  const [run, setRun] = useState<Run>(() => {
    const asked = fresh();
    const left = carryOn(progress?.classInProgress, mode, when.today, { round: asked.keyRound, ids: choice.picked });
    if (!left) return asked;
    const byId = new Map(set.questions.map((q) => [q._id, q]));
    const questions = left.ids.flatMap((qid) => byId.get(qid) ?? []);
    if (questions.length !== left.ids.length) return asked;
    const earlier = left.ids.slice(0, left.index).map((qid) => ({ id: qid, correct: answeredBefore(progress?.questions[qid], when) }));
    return { ...asked, plan: { ...asked.plan, questions }, start: left.index, earlier, resume: { key: left.key, seq: left.seq }, id: 0 };
  });

  if (!run.plan.questions.length) {
    return (
      <ClassShell set={set} mode={mode}>
        <Empty
          icon="quiz"
          title={mode === "retryMissed" ? "Nothing to retry" : "No quiz questions yet"}
          body={mode === "retryMissed" ? "Every question you missed has been answered right since. Take a regular quiz instead." : "This set has no questions yet."}
          action={
            mode === "retryMissed" ? (
              <Link to={classPath(set._id, "quiz")} className={buttonClass("primary")}>
                Take a quiz
              </Link>
            ) : undefined
          }
        />
      </ClassShell>
    );
  }
  return (
    <QuizRun
      key={run.id}
      set={set}
      progress={progress}
      mode={mode}
      when={when}
      plan={run.plan}
      keyRound={run.keyRound}
      earlier={run.earlier}
      resume={run.resume}
      onRestart={run.resume ? () => setRun(fresh()) : undefined}
    />
  );
}
