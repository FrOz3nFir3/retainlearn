// Whether someone is signed in, and the check that finds out as the app opens. The browser keeps a note that a session
// may be active (utils/session.js); until the server confirms it, the session is "checking", and a screen that differs
// for a signed-in player shows its skeleton, rather than flashing what someone signed out sees (or, in a class,
// starting as a guest whose answers aren't saved).
import { useEffect } from "react";
import { usePostAuthDetailsMutation } from "#api/apiSlice.js";
import { initialUser } from "#features/authentication/state/authSlice.js";
import { isSessionPotentiallyActive, setSessionStatus } from "#utils/session.js";
import { useAppDispatch, useAppSelector } from "./hooks.ts";

export type Session = "checking" | "in" | "out";

// One check for the whole app: useSession reads how it's going.
const CHECK = { fixedCacheKey: "session" };
// There's a check to wait for only if the note said so as the app opened, and only until that check has answered. Kept
// here rather than read from the check's own state, which signing out resets (with the rest of the API's cache): that
// mustn't make a signed-out tab "checking" again, nor must a note written later by signing in in another tab.
let checkPending = isSessionPotentiallyActive();

// Asks the server who's signed in, once, when the app opens (in the root layout), if the browser's note says someone
// may be. A 401 is handled by the session refresh in apiSlice.js; a 404 means the account is gone, so the note goes
// too; no answer at all (offline) leaves the note for the next visit.
export function useSessionCheck(): void {
  const dispatch = useAppDispatch();
  const [check] = usePostAuthDetailsMutation(CHECK);
  useEffect(() => {
    if (!checkPending) return;
    check(undefined)
      .then((result) => {
        if (result.data) {
          dispatch(initialUser(result.data));
        } else if (result.error && "status" in result.error && result.error.status === 404) {
          dispatch(initialUser({ user: null, csrfToken: null }));
          setSessionStatus(false);
        }
      })
      .finally(() => {
        checkPending = false;
      });
  }, [check, dispatch]);
}

export function useSession(): Session {
  const signedIn = useAppSelector((state) => Boolean((state.auth as { user?: unknown }).user));
  const [, check] = usePostAuthDetailsMutation(CHECK);
  if (signedIn) return "in";
  return checkPending && (check.isUninitialized || check.isLoading) ? "checking" : "out";
}
