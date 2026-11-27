// The path's step a class carries (?step=pathId.stepId, the prototype's): its path is loaded for the step's flashcards
// and questions (a picked step's own: core's stepItems), its name, and whether this class tests out of it
// (?testout=1). undefined while the path loads; null when no step is asked for, or it isn't one of the path's steps on
// this set (the class is then the set's own).
import { useSearchParams } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query";
import { stepItems } from "@retainlearn/core";
import { parseStep, stepName } from "./pathView.ts";
import { useGetPathQuery } from "./pathsApi.ts";

export type StepScope = { pathId: string; stepId: string; name: string; flashcards: Set<string>; questions: Set<string>; testOut: boolean };

export function useStepScope(setId: string): StepScope | null | undefined {
  const [params] = useSearchParams();
  const asked = parseStep(params.get("step"));
  const path = useGetPathQuery(asked?.pathId ?? skipToken);
  if (!asked) return null;
  if (path.isLoading) return undefined;
  const step = path.data?.steps.find((s) => s.id === asked.stepId && s.setId === setId);
  if (!step?.set) return null;
  const items = stepItems(step, step.set);
  return {
    pathId: asked.pathId,
    stepId: asked.stepId,
    name: stepName(step),
    flashcards: new Set(items.flashcards.map((f) => String(f._id))),
    questions: new Set(items.questions.map((q) => String(q._id))),
    testOut: params.get("testout") === "1",
  };
}
