// Paths (P2-07): the lists, a path's page and everything done on it (/api/paths). A path's page is one request with
// what's yours in it (whether you follow it, your test outs, your progress in its sets, your suggestion, its skill), so
// whatever changes any of those marks the path out of date. Following one changes your campus (its subject goes on it,
// and your timetable's first period); a skill shows on your report card.
import type {
  NewPath,
  PathHistoryPage,
  PathPerson,
  PathSkill,
  PathSuggestion,
  PathVersion,
  PathView,
  PathsPage,
  StudySetReportBody,
  TestOutAnswer,
  TestOutResult,
} from "@retainlearn/core";
import { apiSlice } from "#api/apiSlice.js";

export type PathsQueryArgs = { search: string; subject: string | null; mine: boolean; page: number };
const path = (id: string) => ({ type: "Path" as const, id });

export const pathsApi = apiSlice.enhanceEndpoints({ addTagTypes: ["Paths", "Path", "PathSuggestions", "PathHistory", "Campus", "ReportCard"] }).injectEndpoints({
  endpoints: (build) => ({
    getPaths: build.query<PathsPage, PathsQueryArgs>({
      query: ({ search, subject, mine, page }) => ({
        url: "/paths",
        params: { ...(search ? { search } : {}), ...(subject ? { subject } : {}), ...(mine ? { mine: "1" } : {}), ...(page > 1 ? { page } : {}) },
      }),
      providesTags: ["Paths"],
    }),
    getPath: build.query<PathView, string>({
      query: (id) => `/paths/${id}`,
      providesTags: (_view, _error, id) => [path(id)],
    }),
    createPath: build.mutation<NewPath, PathVersion>({
      query: (body) => ({ url: "/paths", method: "POST", body }),
      invalidatesTags: (_made, error) => (error ? [] : ["Paths"]),
    }),
    savePath: build.mutation<PathView, { id: string; path: PathVersion; version: string }>({
      query: ({ id, path: body, version }) => ({ url: `/paths/${id}`, method: "PUT", body: { path: body, version } }),
      invalidatesTags: (_saved, error, { id }) => (error ? [] : ["Paths", path(id), { type: "PathHistory", id }, "Campus"]),
    }),
    deletePath: build.mutation<void, string>({
      query: (id) => ({ url: `/paths/${id}`, method: "DELETE" }),
      invalidatesTags: (_gone, error, id) => (error ? [] : ["Paths", path(id), "Campus"]),
    }),
    copyPath: build.mutation<NewPath, string>({
      query: (id) => ({ url: `/paths/${id}/copy`, method: "POST" }),
      invalidatesTags: (_made, error) => (error ? [] : ["Paths"]),
    }),
    followPath: build.mutation<{ following: true }, { id: string; tz: string }>({
      query: ({ id, tz }) => ({ url: `/paths/${id}/follow`, method: "PUT", params: { tz } }),
      invalidatesTags: (_done, error) => (error ? [] : ["Paths", "Path", "Campus"]),
    }),
    unfollowPath: build.mutation<void, string>({
      query: (id) => ({ url: `/paths/${id}/follow`, method: "DELETE" }),
      invalidatesTags: (_done, error, id) => (error ? [] : ["Paths", path(id), "Campus"]),
    }),
    addEditor: build.mutation<{ editors: PathPerson[] }, { id: string; username: string }>({
      query: ({ id, username }) => ({ url: `/paths/${id}/editors`, method: "POST", body: { username } }),
      invalidatesTags: (_done, error, { id }) => (error ? [] : [path(id)]),
    }),
    removeEditor: build.mutation<{ editors: PathPerson[] }, { id: string; userId: string }>({
      query: ({ id, userId }) => ({ url: `/paths/${id}/editors/${userId}`, method: "DELETE" }),
      invalidatesTags: (_done, error, { id }) => (error ? [] : [path(id)]),
    }),
    getSuggestions: build.query<{ suggestions: PathSuggestion[] }, string>({
      query: (id) => `/paths/${id}/suggestions`,
      providesTags: (_list, _error, id) => [{ type: "PathSuggestions", id }],
    }),
    suggest: build.mutation<PathSuggestion, { id: string; path: PathVersion; version: string }>({
      query: ({ id, path: body, version }) => ({ url: `/paths/${id}/suggestions/mine`, method: "PUT", body: { path: body, version } }),
      invalidatesTags: (_sent, error, { id }) => (error ? [] : [path(id), { type: "PathSuggestions", id }]),
    }),
    withdrawSuggestion: build.mutation<void, string>({
      query: (id) => ({ url: `/paths/${id}/suggestions/mine`, method: "DELETE" }),
      invalidatesTags: (_done, error, id) => (error ? [] : [path(id), { type: "PathSuggestions", id }]),
    }),
    acceptSuggestion: build.mutation<PathView, { id: string; suggestionId: string }>({
      query: ({ id, suggestionId }) => ({ url: `/paths/${id}/suggestions/${suggestionId}/accept`, method: "POST" }),
      invalidatesTags: (_done, error, { id }) => (error ? [] : ["Paths", path(id), { type: "PathSuggestions", id }, { type: "PathHistory", id }, "Campus"]),
    }),
    declineSuggestion: build.mutation<void, { id: string; suggestionId: string; note: string }>({
      query: ({ id, suggestionId, note }) => ({ url: `/paths/${id}/suggestions/${suggestionId}/decline`, method: "POST", body: { note } }),
      invalidatesTags: (_done, error, { id }) => (error ? [] : [{ type: "PathSuggestions", id }]),
    }),
    getHistory: build.query<PathHistoryPage, { id: string; page: number }>({
      query: ({ id, page }) => ({ url: `/paths/${id}/history`, params: page > 1 ? { page } : {} }),
      providesTags: (_page, _error, { id }) => [{ type: "PathHistory", id }],
    }),
    testOut: build.mutation<TestOutResult, { id: string; stepId: string; tz: string; answers: TestOutAnswer[] }>({
      query: ({ id, stepId, tz, answers }) => ({ url: `/paths/${id}/steps/${stepId}/test-out`, method: "POST", params: { tz }, body: { answers } }),
      invalidatesTags: (result, error, { id }) => (error || !result?.passed ? [] : [path(id), "Paths", "Campus"]),
    }),
    claimSkill: build.mutation<PathSkill, { id: string; tz: string }>({
      query: ({ id, tz }) => ({ url: `/paths/${id}/skill`, method: "POST", params: { tz } }),
      invalidatesTags: (_skill, error, { id }) => (error ? [] : [path(id), "ReportCard"]),
    }),
    reportPath: build.mutation<{ ok: true }, { id: string } & StudySetReportBody>({
      query: ({ id, ...body }) => ({ url: `/paths/${id}/report`, method: "POST", body }),
    }),
  }),
});

export const {
  useGetPathsQuery,
  useGetPathQuery,
  useCreatePathMutation,
  useSavePathMutation,
  useDeletePathMutation,
  useCopyPathMutation,
  useFollowPathMutation,
  useUnfollowPathMutation,
  useAddEditorMutation,
  useRemoveEditorMutation,
  useGetSuggestionsQuery,
  useSuggestMutation,
  useWithdrawSuggestionMutation,
  useAcceptSuggestionMutation,
  useDeclineSuggestionMutation,
  useGetHistoryQuery,
  useTestOutMutation,
  useClaimSkillMutation,
  useReportPathMutation,
} = pathsApi;
