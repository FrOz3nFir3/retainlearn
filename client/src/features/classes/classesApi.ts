// Saving a class's answers, a batch at a time (PLAN 14.10). The reply holds the items the batch changed, so your
// progress in the set is updated in place from it, with no refetch. The campus is marked out of date (its XP and
// today's answers changed), so it's fetched again the next time it's shown. A batch the server had already saved
// (saved: false) changes nothing here either.
import type { SaveAnswersBody, SavedAnswers } from "@retainlearn/core";
import { classroomApi } from "#features/classroom/classroomApi.ts";

type SaveArgs = { setId: string; batch: SaveAnswersBody };

export const classesApi = classroomApi.enhanceEndpoints({ addTagTypes: ["Campus"] }).injectEndpoints({
  endpoints: (build) => ({
    saveAnswers: build.mutation<SavedAnswers, SaveArgs>({
      query: ({ setId, batch }) => ({ url: `/study-sets/${setId}/answers`, method: "POST", body: batch }),
      invalidatesTags: (result) => (result?.saved ? ["Campus"] : []),
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
