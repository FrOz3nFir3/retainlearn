import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  initialUser,
  setCsrfToken,
} from "../features/authentication/state/authSlice";
import { setSessionStatus, isSessionPotentiallyActive } from "../utils/session";
import { shareInFlight } from "./shareInFlight";

const baseQuery = fetchBaseQuery({
  baseUrl:
    process.env.NODE_ENV === "development"
      ? `http://localhost:3000/api`
      : (import.meta.env.VITE_API_URL ?? "") + "/api",
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const csrfToken = getState().auth.csrfToken;
    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    }
    return headers;
  },
});

// Session and CSRF refreshes are shared (P0-15). When a session expires, every query that fails at that moment waits
// for one refresh, instead of each starting its own. Each refresh also replaces the CSRF cookie, so separate ones could
// leave a retry holding a token that no longer matched. A shared refresh has its own abort signal, so one query being
// cancelled doesn't cancel it for the others.
const shared = shareInFlight();
const postShared = (url, api, extraOptions) =>
  shared(url, () =>
    baseQuery({ url, method: "POST" }, { ...api, signal: new AbortController().signal }, extraOptions)
  );

// A request that never got an answer (offline, a timeout) says nothing about the session, so it logs no one out.
const gotNoAnswer = (result) =>
  result.error?.status === "FETCH_ERROR" || result.error?.status === "TIMEOUT_ERROR";

const logOutHere = (api) => {
  api.dispatch(initialUser({ user: null, csrfToken: null }));
  setSessionStatus();
};

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // Handle authentication token expiry
  if (result.error && result.error.status === 401) {
    if (
      result.error.data?.error === "Authentication token expired." ||
      result.error.data?.error === "User not Logged In."
    ) {
      const isValidSession = isSessionPotentiallyActive();
      if (!isValidSession) return result;
      const refreshResult = await postShared("/user/refresh", api, extraOptions);

      if (refreshResult.meta?.response?.ok) {
        // Update CSRF token if provided in refresh response
        if (refreshResult.data?.csrfToken) {
          api.dispatch(setCsrfToken(refreshResult.data.csrfToken));
        }
        result = await baseQuery(args, api, extraOptions);
      } else if (!gotNoAnswer(refreshResult)) {
        // The session has ended
        logOutHere(api);
      }
    }
  }

  // Handle CSRF token issues (with retry limit)
  if (result.error && result.error.status === 403) {
    const errorMessage = result.error.data?.error || "";

    // Check if it's a CSRF-related error
    if (errorMessage.includes("CSRF token")) {
      // Try to get a fresh CSRF token from lightweight /csrf-refresh endpoint
      const authResult = await postShared("/user/csrf-refresh", api, extraOptions);

      if (authResult.meta?.response?.ok && authResult.data?.csrfToken) {
        // Update CSRF token and retry original request
        api.dispatch(setCsrfToken(authResult.data.csrfToken));
        result = await baseQuery(args, api, extraOptions);
      } else if (!gotNoAnswer(authResult)) {
        // Force logout if refresh fails
        logOutHere(api);
      }
    }
  }

  return result;
};

// The one API slice. Each feature adds its own endpoints and tags (injectEndpoints, in its own *Api.ts); these are
// the account's: signing in or up, the session check, signing out.
export const apiSlice = createApi({
  reducerPath: "cards",
  baseQuery: baseQueryWithReauth,
  tagTypes: [],
  endpoints: (builder) => ({
    postRegisterUser: builder.mutation({
      query: (user) => ({
        url: "/user/register",
        method: "POST",
        body: user,
      }),
    }),

    postLoginUser: builder.mutation({
      query: (user) => ({
        url: "/user/login",
        method: "POST",
        body: user,
      }),
    }),

    postAuthDetails: builder.mutation({
      query: () => ({
        url: `/user/authed`,
        method: "POST",
      }),
    }),

    postLogoutUser: builder.mutation({
      query: () => ({
        url: "/user/logout",
        method: "POST",
      }),
    }),

    postGoogleLogin: builder.mutation({
      query: (user) => ({
        url: "/user/google-login",
        method: "POST",
        body: user,
      }),
    }),
  }),
});

export const {
  usePostRegisterUserMutation,
  usePostLoginUserMutation,
  usePostAuthDetailsMutation,
  usePostLogoutUserMutation,
  usePostGoogleLoginMutation,
} = apiSlice;
