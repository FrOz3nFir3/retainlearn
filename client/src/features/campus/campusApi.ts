// The campus's data (PLAN 14.10): one call for everything it shows, for the browser's time zone, so "today" is the
// player's day. Fetched again when the tab comes back into view (the day may have turned) and after a saved batch
// of answers (the Campus tag, classesApi.ts).
import type { Campus } from "@retainlearn/core";
import { apiSlice } from "#api/apiSlice.js";

// The browser's time zone, an IANA name such as "Asia/Kolkata".
export const browserTimeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;

export const campusApi = apiSlice.enhanceEndpoints({ addTagTypes: ["Campus"] }).injectEndpoints({
  endpoints: (build) => ({
    getCampus: build.query<Campus, string>({
      query: (tz) => ({ url: "/campus", params: { tz } }),
      providesTags: ["Campus"],
    }),
  }),
});

// The campus, for this browser's time zone, fetched again when the tab comes back into view (the listeners are set up
// in app/configureStore.js). skip: until someone is signed in.
export const useCampus = (skip = false) => campusApi.useGetCampusQuery(browserTimeZone(), { skip, refetchOnFocus: true });
