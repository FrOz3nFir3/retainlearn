// A review class: /study-sets/:id/review (?round=n or ?ids=…) and /study-sets/:id/review-missed (go over what
// you missed), either on a path's step of picked flashcards (?step=, its flashcards). While the set and your progress load, the class's skeleton. The same review left halfway today is
// carried on (resume.ts), with the way to start afresh. The flashcards are chosen once, as the class starts, so saving (which
// updates your progress) never changes them under you.
import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { dayKey } from "@retainlearn/core";
import type { ProgressView, StudySetContent, When } from "@retainlearn/core";
import { useSession } from "#app/session.ts";
import { buttonClass } from "#components/ui/Button.tsx";
import { Empty } from "#components/ui/Empty.tsx";
import { browserTimeZone } from "#features/campus/campusApi.ts";
import { useGetProgressQuery, useGetStudySetQuery } from "#features/classroom/classroomApi.ts";
import { useStepScope } from "#features/paths/useStepScope.ts";
import type { StepScope } from "#features/paths/useStepScope.ts";
import { ClassShell } from "./ClassShell.tsx";
import { ClassSkeleton } from "./ClassSkeleton.tsx";
import { classPath } from "./modes.ts";
import { recallPoints } from "./recallPoints.ts";
import { carryOn, keyRound } from "./resume.ts";
import { planReview } from "./reviewPlan.ts";
import type { ReviewPlan } from "./reviewPlan.ts";
import { ReviewRun } from "./ReviewRun.tsx";

type Mode = "review" | "reviewMissed";

export default function ReviewClass({ mode }: { mode: Mode }) {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const session = useSession();
  const signedIn = session === "in";
  const set = useGetStudySetQuery(id);
  const progress = useGetProgressQuery(id, { skip: !signedIn });
  const scope = useStepScope(id);
  if (set.isError) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-mist p-4">
        <Empty icon="x" title="This study set isn't here" body="It may have been deleted, or the link is wrong." action={<Link to="/subjects" className={buttonClass("primary")}>Find a set</Link>} />
      </div>
    );
  }
  if (!set.data || session === "checking" || (signedIn && progress.isLoading) || scope === undefined) return <ClassSkeleton label="Loading the review" mode={mode} />;
  return <ReviewStart key={`${mode}:${id}?${params}`} set={set.data} progress={progress.data ?? null} mode={mode} params={params} scope={scope} />;
}

type Run = { plan: ReviewPlan; keyRound: string; start: number; resume: { key: string; seq: number } | null; id: number };

type StartProps = { set: StudySetContent; progress: ProgressView | null; mode: Mode; params: URLSearchParams; scope: StepScope | null };
function ReviewStart({ set, progress, mode, params, scope }: StartProps) {
  const [when] = useState<When>(() => {
    const timeZone = browserTimeZone();
    return { today: dayKey(new Date(), timeZone), timeZone };
  });
  const ids = params.get("ids");
  const choice = { round: Number(params.get("round")) || null, picked: ids ? new Set(ids.split(",")) : null, step: scope?.flashcards ?? null };
  const fresh = (): Run => {
    const plan = planReview(set, progress, mode === "reviewMissed", when, choice, recallPoints);
    return { plan, keyRound: scope ? "step" : keyRound(plan.round), start: 0, resume: null, id: Date.now() };
  };
  const [run, setRun] = useState<Run>(() => {
    const asked = fresh();
    const left = carryOn(progress?.classInProgress, mode, when.today, { round: asked.keyRound, ids: choice.step ?? choice.picked });
    if (!left) return asked;
    // Its flashcards as they were, in the asked class's round and title.
    const kept = planReview({ ...set, flashcards: left.ids.flatMap((fid) => set.flashcards.find((f) => f._id === fid) ?? []) }, progress, mode === "reviewMissed", when, { picked: new Set(left.ids) }, recallPoints);
    if (kept.flashcards.length !== left.ids.length) return asked;
    return { ...asked, plan: { ...asked.plan, flashcards: kept.flashcards }, start: left.index, resume: { key: left.key, seq: left.seq }, id: 0 };
  });

  if (!run.plan.flashcards.length) {
    return (
      <ClassShell set={set} mode={mode}>
        <Empty
          icon="review"
          title={mode === "reviewMissed" ? "Nothing you missed right now" : "No flashcards in this set yet"}
          body={mode === "reviewMissed" ? "Nice. Carry on with a regular review instead." : "This set has no flashcards yet."}
          action={
            mode === "reviewMissed" ? (
              <Link to={`${classPath(set._id, "review")}${scope ? `?step=${scope.pathId}.${scope.stepId}` : ""}`} className={buttonClass("primary")}>
                Start a regular review
              </Link>
            ) : undefined
          }
        />
      </ClassShell>
    );
  }
  return (
    <ReviewRun
      key={run.id}
      set={set}
      progress={progress}
      mode={mode}
      when={when}
      plan={run.plan}
      keyRound={run.keyRound}
      start={run.start}
      resume={run.resume}
      onRestart={run.resume ? () => setRun(fresh()) : undefined}
    />
  );
}
