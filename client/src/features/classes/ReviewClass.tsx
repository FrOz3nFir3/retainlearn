// A review class: /study-sets/:id/review (?round=n or ?ids=…) and /study-sets/:id/review-missed (go over what
// you missed). While the set and your progress load, the class's skeleton. A review of this kind left halfway today is
// carried on, with the way to start afresh. The flashcards are chosen once, as the class starts, so saving (which
// updates your progress) never changes them under you.
import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { dayKey } from "@retainlearn/core";
import type { ProgressView, StudySetContent, When } from "@retainlearn/core";
import { useSignedIn } from "#app/hooks.ts";
import { buttonClass } from "#components/ui/Button.tsx";
import { Empty } from "#components/ui/Empty.tsx";
import { browserTimeZone } from "#features/campus/campusApi.ts";
import { useGetProgressQuery, useGetStudySetQuery } from "#features/classroom/classroomApi.ts";
import { ClassShell } from "./ClassShell.tsx";
import { ClassSkeleton } from "./ClassSkeleton.tsx";
import { classPath } from "./modes.ts";
import { recallPoints } from "./recallPoints.ts";
import { planReview } from "./reviewPlan.ts";
import type { ReviewPlan } from "./reviewPlan.ts";
import { ReviewRun } from "./ReviewRun.tsx";

type Mode = "review" | "reviewMissed";

export default function ReviewClass({ mode }: { mode: Mode }) {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const signedIn = useSignedIn();
  const set = useGetStudySetQuery(id);
  const progress = useGetProgressQuery(id, { skip: !signedIn });
  if (set.isError) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-mist p-4">
        <Empty icon="x" title="This study set isn't here" body="It may have been deleted, or the link is wrong." action={<Link to="/categories" className={buttonClass("primary")}>Find a set</Link>} />
      </div>
    );
  }
  if (!set.data || (signedIn && progress.isLoading)) return <ClassSkeleton label="Loading the review" />;
  return <ReviewStart key={`${mode}:${id}?${params}`} set={set.data} progress={progress.data ?? null} mode={mode} params={params} />;
}

type Run = { plan: ReviewPlan; start: number; resume: { key: string; seq: number } | null; id: number };

function ReviewStart({ set, progress, mode, params }: { set: StudySetContent; progress: ProgressView | null; mode: Mode; params: URLSearchParams }) {
  const [when] = useState<When>(() => {
    const timeZone = browserTimeZone();
    return { today: dayKey(new Date(), timeZone), timeZone };
  });
  const fresh = (): Run => {
    const ids = params.get("ids");
    const choice = { round: Number(params.get("round")) || null, picked: ids ? new Set(ids.split(",")) : null };
    return { plan: planReview(set, progress, mode === "reviewMissed", when, choice, recallPoints), start: 0, resume: null, id: Date.now() };
  };
  const [run, setRun] = useState<Run>(() => {
    const left = progress?.classInProgress;
    const index = left?.index ?? 0;
    if (left && left.mode === mode && left.day === when.today && left.ids?.length && index < left.ids.length) {
      const plan = planReview({ ...set, flashcards: left.ids.flatMap((fid) => set.flashcards.find((f) => f._id === fid) ?? []) }, progress, mode === "reviewMissed", when, { picked: new Set(left.ids) }, recallPoints);
      if (plan.flashcards.length === left.ids.length) return { plan: { ...plan, title: null }, start: index, resume: { key: left.key, seq: left.seq }, id: 0 };
    }
    return fresh();
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
              <Link to={classPath(set._id, "review")} className={buttonClass("primary")}>
                Start a regular review
              </Link>
            ) : undefined
          }
        />
      </ClassShell>
    );
  }
  return <ReviewRun key={run.id} set={set} progress={progress} mode={mode} when={when} plan={run.plan} start={run.start} resume={run.resume} onRestart={run.resume ? () => setRun(fresh()) : undefined} />;
}
