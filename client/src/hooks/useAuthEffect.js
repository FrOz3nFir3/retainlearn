import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { initialUser } from "../features/authentication/state/authSlice";
import { isSessionPotentiallyActive, setSessionStatus } from "../utils/session";

const useAuthEffect = (postAuthDetails) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const isValidSession = isSessionPotentiallyActive();
    if (isValidSession) {
      postAuthDetails().then(({ data, error }) => {
        if (data) {
          dispatch(initialUser(data));
        } else if (error?.status === 404) {
          // The account is gone: forget the session here too. (A 401 is handled by the session refresh in
          // apiSlice.js, and no answer at all, when offline, leaves the session to try again later.)
          dispatch(initialUser({ user: null, csrfToken: null }));
          setSessionStatus();
        }
      });
    }
  }, [postAuthDetails]);
};

export default useAuthEffect;
