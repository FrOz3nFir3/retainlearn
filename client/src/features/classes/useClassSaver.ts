// A class's saver (classSaver.ts), connected to the API and to the page being hidden. One per sitting: a new class (or
// a new round) gets a new classKey, and a class left halfway and carried on (resume) keeps its key and numbers its
// batches on from the last one saved. Batches go through RTK Query's saveAnswers, so a session that has expired is
// refreshed first and the CSRF header is sent, like any other call. When the page is hidden, what's waiting is sent at
// once with keepalive, which the browser finishes even if the page goes; leaving the class for another page sends all
// of it, then your progress in the set is read again. Someone not signed in can try a class: their answers aren't sent.
import { useEffect, useMemo } from "react";
import type { ClassMode, SavedAnswers } from "@retainlearn/core";
import { useAppDispatch, useSignedIn } from "#app/hooks.ts";
import { browserTimeZone } from "#features/campus/campusApi.ts";
import { classesApi } from "./classesApi.ts";
import { ClassSaver, Refused, newClassKey } from "./classSaver.ts";

// RTK Query's error for a call: a status number for an answer from the server, or a string (FETCH_ERROR…) when there
// was none. The server turning a batch away (4xx) is final; the rest is worth another try.
const isRefusal = (error: unknown): boolean => {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === "number" && status >= 400 && status < 500;
};

// What a try-out answers with: nothing saved, nothing earned.
const notSaved: SavedAnswers = { saved: false, flashcards: {}, questions: {}, earned: 0, xp: 0 };

export function useClassSaver(setId: string, mode: ClassMode, round: number | string, resume?: { key: string; seq: number } | null): ClassSaver {
  const dispatch = useAppDispatch();
  const signedIn = useSignedIn();
  const resumeKey = resume?.key;
  const resumeSeq = resume?.seq;
  const saver = useMemo(
    () =>
      new ClassSaver(
        async (batch, keepalive) => {
          if (!signedIn) return notSaved;
          try {
            return await dispatch(classesApi.endpoints.saveAnswers.initiate({ setId, batch, keepalive })).unwrap();
          } catch (error) {
            throw isRefusal(error) ? new Refused(`The server turned the batch away (${(error as { status: number }).status})`) : error;
          }
        },
        { classKey: resumeKey ?? newClassKey(mode, round), mode, timeZone: browserTimeZone() },
        { afterSeq: resumeSeq ?? 0 },
      ),
    [dispatch, signedIn, setId, mode, round, resumeKey, resumeSeq],
  );

  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && saver.flushNow();
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [saver]);

  // Leaving the class: what's waiting is saved, then your progress in the set is read again wherever it's shown next.
  // The saves' replies carry the items they changed, but not the class left halfway or the quizzes counted, and the
  // next class reads those: one carried on from a stale marker would number its batches as ones already saved, and the
  // server would drop them (PLAN 14.11: when unsure, invalidate and fetch again).
  useEffect(
    () => () => {
      void saver.leave().finally(() => dispatch(classesApi.util.invalidateTags([{ type: "Progress", id: setId }])));
    },
    [saver, dispatch, setId],
  );

  return saver;
}
