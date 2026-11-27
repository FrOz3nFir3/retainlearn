// A class's saver (classSaver.ts), connected to the API and to the page being hidden. One per sitting: a new class (or
// a new round) gets a new classKey, and a class left halfway and carried on (resume) keeps its key and numbers its
// batches on from the last one saved. Batches go through RTK Query's saveAnswers, so a session that has expired is
// refreshed first and the CSRF header is sent, like any other call. When the page is hidden, what's waiting is sent at
// once with keepalive, which the browser finishes even if the page goes; leaving the class for another page sends all
// of it, then your progress in the set is read again. Someone not signed in can try a class: their batches are kept on
// the device instead (guestClasses.ts) and sent once they sign in or sign up (sendKeptClasses).
import { useEffect, useMemo, useState } from "react";
import type { ClassMode, SaveAnswersBody, SavedAnswers } from "@retainlearn/core";
import { useAppDispatch, useSignedIn } from "#app/hooks.ts";
import type { AppDispatch } from "#app/hooks.ts";
import { browserTimeZone } from "#features/campus/campusApi.ts";
import { classesApi } from "./classesApi.ts";
import { ClassSaver, Refused, newClassKey } from "./classSaver.ts";
import { keepGuestBatch, sendKept } from "./guestClasses.ts";

// RTK Query's error for a call: a status number for an answer from the server, or a string (FETCH_ERROR…) when there
// was none. The server turning a batch away (4xx) is final; the rest is worth another try.
const isRefusal = (error: unknown): boolean => {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === "number" && status >= 400 && status < 500;
};

// A batch sent to the account.
async function sendBatch(dispatch: AppDispatch, setId: string, batch: SaveAnswersBody, keepalive = false): Promise<SavedAnswers> {
  try {
    return await dispatch(classesApi.endpoints.saveAnswers.initiate({ setId, batch, keepalive })).unwrap();
  } catch (error) {
    throw isRefusal(error) ? new Refused(`The server turned the batch away (${(error as { status: number }).status})`) : error;
  }
}

// What a guest's batch answers with: kept on the device, nothing earned yet.
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
          if (signedIn) return sendBatch(dispatch, setId, batch, keepalive);
          keepGuestBatch(setId, batch);
          return notSaved;
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

// Whether some of a class's answers couldn't be saved, after the saver's retries: the class says so (it was silent).
export function useSaveFailed(saver: ClassSaver): boolean {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    saver.onFailed = () => setFailed(true);
  }, [saver]);
  return failed;
}

// How long signing in waits for a guest's classes to be sent before going on regardless (what's left goes next time).
const KEEP_WAIT_MS = 8000;

// A guest's classes kept on this device, sent to the account just signed in to (the session's cookies and CSRF token
// already set), then your progress in each of their sets read again wherever it's shown next. Resolves once they're
// sent, or after KEEP_WAIT_MS.
export async function sendKeptClasses(dispatch: AppDispatch): Promise<void> {
  const sending = sendKept((setId, batch) => sendBatch(dispatch, setId, batch)).then((sent) => {
    if (sent.length) dispatch(classesApi.util.invalidateTags(sent.map((s) => ({ type: "Progress" as const, id: s.setId }))));
  });
  await Promise.race([sending.catch(() => {}), new Promise((resolve) => setTimeout(resolve, KEEP_WAIT_MS))]);
}
