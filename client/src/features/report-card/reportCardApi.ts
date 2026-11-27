// The report card (PLAN 14.10): your progress in every set you've started, and your player's totals, in one call for
// the browser's time zone. It's fetched again after a saved class (the ReportCard tag, classesApi.ts) and after a
// set's quizzes are reset. A reset returns your progress in that set, which replaces the classroom's copy (if it has
// one) with no refetch; the campus is marked out of date, since what you missed in that subject changed.
import type { ProgressView, ReportCard } from "@retainlearn/core";
import { browserTimeZone } from "#features/campus/campusApi.ts";
import { classroomApi } from "#features/classroom/classroomApi.ts";

export const reportCardApi = classroomApi.enhanceEndpoints({ addTagTypes: ["ReportCard", "Campus"] }).injectEndpoints({
  endpoints: (build) => ({
    getReportCard: build.query<ReportCard, string>({
      query: (tz) => ({ url: "/report-card", params: { tz } }),
      providesTags: ["ReportCard"],
    }),
    resetQuiz: build.mutation<ProgressView, { setId: string; tz: string }>({
      query: ({ setId, tz }) => ({ url: `/study-sets/${setId}/progress/quiz`, method: "DELETE", params: { tz } }),
      invalidatesTags: ["ReportCard", "Campus"],
      async onQueryStarted({ setId }, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: null }));
        // Whether you review the set isn't in the reset's answer: kept from before.
        if (data) dispatch(classroomApi.util.updateQueryData("getProgress", setId, (old) => ({ ...data, reviewer: data.reviewer ?? old.reviewer })));
      },
    }),
  }),
});

// The report card for this browser's time zone, fetched again when the tab comes back into view (the day may have
// turned). skip: until someone is signed in.
export const useReportCard = (skip: boolean) => reportCardApi.useGetReportCardQuery(browserTimeZone(), { skip, refetchOnFocus: true });
export const { useResetQuizMutation } = reportCardApi;
