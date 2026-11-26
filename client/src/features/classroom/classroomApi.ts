// A study set and your progress in it (PLAN 14.10). The content is public and changes rarely, so it stays cached for
// ten minutes after its last use. Your progress is updated in place from what each saved batch returns (classesApi.ts),
// with no refetch. "Report this set" sends a report (today's endpoint, until the editing API, P1-11).
import type { ProgressView, StudySetContent, StudySetReportBody } from "@retainlearn/core";
import { apiSlice } from "#api/apiSlice.js";

export const classroomApi = apiSlice.enhanceEndpoints({ addTagTypes: ["StudySet", "Progress"] }).injectEndpoints({
  endpoints: (build) => ({
    getStudySet: build.query<StudySetContent, string>({
      query: (setId) => `/study-sets/${setId}`,
      providesTags: (_result, _error, setId) => [{ type: "StudySet", id: setId }],
      keepUnusedDataFor: 600,
    }),
    getProgress: build.query<ProgressView, string>({
      query: (setId) => `/study-sets/${setId}/progress`,
      providesTags: (_result, _error, setId) => [{ type: "Progress", id: setId }],
    }),
    reportStudySet: build.mutation<void, StudySetReportBody & { setId: string }>({
      query: ({ setId, ...body }) => ({ url: `/card/${setId}/report`, method: "POST", body }),
    }),
  }),
});

export const { useGetStudySetQuery, useGetProgressQuery, useReportStudySetMutation } = classroomApi;
