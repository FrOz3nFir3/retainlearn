// A study set's next class, opened in one tap from outside its classroom (the subject page's "Up next here", its "Also
// needs attention" rows and its sets' cards: the prototype's "the classes one tap away"). It's the class the
// classroom's Up next would start (core's studyPlan), worked out from the set's content and your progress, which are
// fetched when they aren't already there: ahead of the tap with prefetch (on hover or focus), else on the tap, while
// the button says so. The class comes back to the page it was opened from. Something that fails to load opens the
// set's classroom instead.
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { reviewLoad, roundState, setRounds, studyPlan } from "@retainlearn/core";
import type { ProgressView, StudySetContent } from "@retainlearn/core";
import { useAppDispatch } from "#app/hooks.ts";
import { useToday } from "#features/campus/campusApi.ts";
import { setPath, stepPath } from "#features/classes/modes.ts";
import { recallPoints } from "#features/classes/recallPoints.ts";
import { classroomApi } from "./classroomApi.ts";
import { useStudyView } from "./useStudyView.ts";

const loadOf = (f: { answer: string }) => reviewLoad(recallPoints(f.answer).length);

export function useNextClass(): { open: (setId: string) => Promise<void>; prefetch: (setId: string) => void; opening: string | null } {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const when = useToday();
  const { view } = useStudyView(true);
  const prefetchSet = classroomApi.usePrefetch("getStudySet");
  const prefetchProgress = classroomApi.usePrefetch("getProgress");
  const [opening, setOpening] = useState<string | null>(null);

  // A query's data, from the cache or fetched, then let go (the cache keeps it a while, for the class to use).
  const read = async <T,>(start: () => { unwrap: () => Promise<T>; unsubscribe: () => void }): Promise<T> => {
    const sub = start();
    try {
      return await sub.unwrap();
    } finally {
      sub.unsubscribe();
    }
  };

  const open = async (setId: string) => {
    if (opening) return;
    setOpening(setId);
    const returnTo = `${pathname}${search}`;
    try {
      const [set, progress] = await Promise.all([
        read<StudySetContent>(() => dispatch(classroomApi.endpoints.getStudySet.initiate(setId))),
        read<ProgressView>(() => dispatch(classroomApi.endpoints.getProgress.initiate(setId))),
      ]);
      const rounds = setRounds(set, progress.order, loadOf);
      const plan = studyPlan({ rounds, states: rounds.map((r) => roundState(r, progress, when)), progress, when, view, loadOf });
      navigate(plan.next ? stepPath(setId, plan.next.action) : setPath(setId), { state: { returnTo } });
    } catch {
      navigate(setPath(setId));
    } finally {
      setOpening(null);
    }
  };

  const prefetch = (setId: string) => {
    prefetchSet(setId);
    prefetchProgress(setId);
  };
  return { open, prefetch, opening };
}
