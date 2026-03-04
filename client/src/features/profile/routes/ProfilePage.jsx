import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import ProfileContent from "../components/ProfileContent";

const clientId =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ??
  "861201461365-j2s71jmj0i3q5qo2634mfbavoepi53to.apps.googleusercontent.com";

const ProfilePage = () => (
  <GoogleOAuthProvider clientId={clientId}>
    <ProfileContent />
  </GoogleOAuthProvider>
);

export default ProfilePage;
