// Google's own button, and its One Tap prompt: Google hands the browser a signed credential, which goes to the server
// as it is; the server checks it with Google and reads who you are from it (services/googleAuth.js). The button is
// Google's, drawn by Google; its place is kept while it loads. In the dark, Google's dark button.
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useColorScheme } from "#app/colorScheme.ts";

// The app's Google client id (public: it's in every page that shows the button).
export const GOOGLE_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "861201461365-j2s71jmj0i3q5qo2634mfbavoepi53to.apps.googleusercontent.com";

export function GoogleSignIn({ onCredential, onFailure }: { onCredential: (credential: string) => void; onFailure: () => void }) {
  const { choice, deviceDark } = useColorScheme();
  const dark = choice === "dark" || (choice === "system" && deviceDark);
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="flex min-h-10 justify-center">
        <GoogleLogin
          key={dark ? "dark" : "light"}
          onSuccess={(response) => (response.credential ? onCredential(response.credential) : onFailure())}
          onError={onFailure}
          useOneTap
          text="continue_with"
          shape="pill"
          size="large"
          width={320}
          theme={dark ? "filled_black" : "outline"}
        />
      </div>
    </GoogleOAuthProvider>
  );
}
