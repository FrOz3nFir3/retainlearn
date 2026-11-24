// A class's saver (classSaver.ts), connected to the API and to the page being hidden. One per sitting: a new class (or
// a new round) gets a new classKey. Batches go through RTK Query's saveAnswers, so a session that has expired is
// refreshed first and the CSRF header is sent, like any other call. When the page is hidden, what's waiting is sent at
// once with keepalive, which the browser finishes even if the page goes.
import { useEffect, useMemo } from "react";
import type { ClassMode } from "@retainlearn/core";
import { useAppDispatch } from "#app/hooks.ts";
import { browserTimeZone } from "#features/campus/campusApi.ts";
import { classesApi } from "./classesApi.ts";
import { ClassSaver, Refused, newClassKey } from "./classSaver.ts";

// RTK Query's error for a call: a status number for an answer from the server, or a string (FETCH_ERROR…) when there
// was none. The server turning a batch away (4xx) is final; the rest is worth another try.
const isRefusal = (error: unknown): boolean => {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === "number" && status >= 400 && status < 500;
};

export function useClassSaver(setId: string, mode: ClassMode, round: number | string): ClassSaver {
  const dispatch = useAppDispatch();
  const saver = useMemo(
    () =>
      new ClassSaver(
        async (batch, keepalive) => {
          try {
            return await dispatch(classesApi.endpoints.saveAnswers.initiate({ setId, batch, keepalive })).unwrap();
          } catch (error) {
            throw isRefusal(error) ? new Refused(`The server turned the batch away (${(error as { status: number }).status})`) : error;
          }
        },
        { classKey: newClassKey(mode, round), mode, timeZone: browserTimeZone() },
      ),
    [dispatch, setId, mode, round],
  );

  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && saver.flushNow();
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [saver]);

  return saver;
}
