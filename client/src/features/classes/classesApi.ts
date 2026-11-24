// Saving a class's answers, a batch at a time (PLAN 14.10). The reply holds the items the batch changed, so your
// progress in the set is updated in place from it, with no refetch. The campus and the report card are marked out of
// date (XP, today's answers and the set's progress changed), so each is fetched again the next time it's shown. A
// batch the server had already saved (saved: false) changes nothing here either.
import type { SaveAnswersBody, SavedAnswers } from "@retainlearn/core";
import { classroomApi } from "#features/classroom/classroomApi.ts";

// keepalive: the browser finishes the request even if the page is closed meanwhile (the last batch, sent as the page
// is hidden).
type SaveArgs = { setId: string; batch: SaveAnswersBody; keepalive?: boolean };

export const classesApi = classroomApi.enhanceEndpoints({ addTagTypes: ["Campus", "ReportCard"] }).injectEndpoints({
  endpoints: (build) => ({
    saveAnswers: build.mutation<SavedAnswers, SaveArgs>({
      query: ({ setId, batch, keepalive = false }) => ({ url: `/study-sets/${setId}/answers`, method: "POST", body: batch, keepalive }),
      invalidatesTags: (result) => (result?.saved ? ["Campus", "ReportCard"] : []),
      async onQueryStarted({ setId }, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: null }));
        if (!data?.saved) return;
        dispatch(
          classroomApi.util.updateQueryData("getProgress", setId, (progress) => {
            Object.assign(progress.flashcards, data.flashcards);
            Object.assign(progress.questions, data.questions);
          }),
        );
      },
    }),
  }),
});

export const { useSaveAnswersMutation } = classesApi;
