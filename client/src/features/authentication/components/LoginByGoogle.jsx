import React, { Suspense, lazy } from "react";
import { usePostGoogleLoginMutation } from "../../../api/apiSlice";
import { useDispatch } from "react-redux";
import { initialUser } from "../state/authSlice";
import { GoogleOAuthProvider } from "@react-oauth/google";
import LoginByGoogleSkeleton from "../../../components/ui/skeletons/LoginByGoogleSkeleton";
import ContactHelpMessage from "./ui/ContactHelpMessage";
import { jwtDecode } from "jwt-decode";
import { setSessionStatus } from "../../../utils/session";
import { useFailedAttempts } from "../hooks/useFailedAttempts";

const GoogleLogin = lazy(() =>
  import("@react-oauth/google").then((module) => ({
    default: module.GoogleLogin,
  }))
);

const clientId =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ??
  "861201461365-j2s71jmj0i3q5qo2634mfbavoepi53to.apps.googleusercontent.com";

function LoginByGoogle(props) {
  const [loginWithGoogle, { isFetching, error, data }] =
    usePostGoogleLoginMutation();
  
  const { shouldShowHelp, incrementAttempts } = useFailedAttempts(error);

  const dispatch = useDispatch();
  React.useEffect(() => {
    if (data != null) {
      dispatch(initialUser(data));
      setSessionStatus(true);
    }
  }, [data]);

  if (isFetching) {
    return <LoginByGoogleSkeleton />;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="w-full text-center">
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 mb-2">
              {error?.data?.error}
            </div>
          )}
          {shouldShowHelp && <ContactHelpMessage />}
        </div>
        
        <Suspense fallback={<LoginByGoogleSkeleton />}>
          <GoogleLogin
            onSuccess={successfulLogin}
            onError={unsuccessfulLogin}
            useOneTap
          />
        </Suspense>
      </div>
    </GoogleOAuthProvider>
  );

  // hoisting
  function successfulLogin(credentialResponse) {
    const decoded = jwtDecode(credentialResponse.credential);
    const email = decoded.email;
    const name = decoded.name;
    const googleId = decoded.sub;
    loginWithGoogle({ name, email, googleId });
  }
  function unsuccessfulLogin() {
    incrementAttempts();
  }
}

export default LoginByGoogle;
