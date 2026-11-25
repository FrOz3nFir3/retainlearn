// Profiles (PLAN 14.10): someone's public profile and the study sets they made, and changing your own details. These
// are today's endpoints (/api/users/:username, /api/users/:username/cards, PATCH /api/user), renamed with the rest of
// the account's at the end; their answers are read into the new names here, so the screens use only those.
import { apiSlice } from "#api/apiSlice.js";

export type PublicProfile = { name: string; username: string };
export type AuthoredSet = { _id: string; topic: string; subtopic: string; category: string; flashcards: number; questions: number };
export type AuthoredSets = { sets: AuthoredSet[]; total: number; pages: number };
export type ProfileChange = { name?: string; username?: string; email?: string; googleAccessToken?: string };
export const AUTHORED_PER_PAGE = 9; // the endpoint's page
type StoredSet = { _id: string; "main-topic"?: string; "sub-topic"?: string; category?: string; reviewLength?: number; quizzesLength?: number };

export const profileApi = apiSlice.enhanceEndpoints({ addTagTypes: ["Profile", "AuthoredSets"] }).injectEndpoints({
  endpoints: (build) => ({
    getPublicProfile: build.query<PublicProfile, string>({
      query: (username) => `/users/${encodeURIComponent(username)}`,
      providesTags: (_profile, _error, username) => [{ type: "Profile", id: username }],
    }),
    getAuthoredSets: build.query<AuthoredSets, { username: string; page: number }>({
      query: ({ username, page }) => ({ url: `/users/${encodeURIComponent(username)}/cards`, params: { page } }),
      transformResponse: (answer: { cards?: StoredSet[]; total?: number }) => {
        const total = answer.total ?? 0;
        const sets = (answer.cards ?? []).map((set) => ({
          _id: String(set._id),
          topic: set["main-topic"] ?? "",
          subtopic: set["sub-topic"] ?? "",
          category: set.category ?? "",
          flashcards: set.reviewLength ?? 0,
          questions: set.quizzesLength ?? 0,
        }));
        return { sets, total, pages: Math.max(1, Math.ceil(total / AUTHORED_PER_PAGE)) };
      },
      providesTags: (_sets, _error, { username }) => [{ type: "AuthoredSets", id: username }],
    }),
    // Your details, or a Google account to link (from a token Google gave this app, checked with Google on the server).
    updateProfile: build.mutation<{ googleId?: string }, ProfileChange>({
      query: (body) => ({ url: "/user", method: "PATCH", body }),
      invalidatesTags: (_answer, error) => (error ? [] : ["Profile", "AuthoredSets"]),
    }),
  }),
});

export const { useGetPublicProfileQuery, useGetAuthoredSetsQuery, useUpdateProfileMutation } = profileApi;
