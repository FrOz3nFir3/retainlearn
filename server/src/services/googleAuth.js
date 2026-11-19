// Google sign-in, checked on the server. The browser sends what Google gave it (an ID token from the sign-in button,
// or an access token from "Connect Google" on the profile page), and Google's own library verifies it: the signature,
// that it hasn't expired, and that it was issued for this app (GOOGLE_CLIENT_ID). The email and the Google account id
// are only ever taken from the verified result, never from the request: before this, the server trusted an email and
// an id posted by the browser.
//
// The two functions are methods on one object, so tests can stand in for Google (node:test's mock.method).
import { OAuth2Client } from "google-auth-library";
import env from "../config/env.js";

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export const googleAuth = {
  // The sign-in button and One Tap give an ID token (a JWT signed by Google).
  async verifyIdToken(idToken) {
    const ticket = await client.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    return {
      googleId: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified === true,
      name: payload.name,
    };
  },

  // "Connect Google" gives an access token. Google says whose it is, and which app it was issued for.
  async verifyAccessToken(accessToken) {
    const info = await client.getTokenInfo(accessToken);
    if (info.aud !== env.GOOGLE_CLIENT_ID && info.azp !== env.GOOGLE_CLIENT_ID) {
      throw new Error("The token was issued for another app");
    }
    return { googleId: info.sub, email: info.email, emailVerified: info.email_verified === true };
  },
};
