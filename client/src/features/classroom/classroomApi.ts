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

// Your own order of the set's flashcards (the rounds follow it), or null for the author's. Shown at once: the cached
// progress takes the new order, and goes back to the old one if the save fails.
export const orderApi = classroomApi.injectEndpoints({
  endpoints: (build) => ({
    saveOrder: build.mutation<{ order: string[] | null }, { setId: string; order: string[] | null }>({
      query: ({ setId, order }) => ({ url: `/study-sets/${setId}/order`, method: "PUT", body: { order } }),
      async onQueryStarted({ setId, order }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          classroomApi.util.updateQueryData("getProgress", setId, (progress) => {
            progress.order = order;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
  }),
});

export const { useSaveOrderMutation } = orderApi;
