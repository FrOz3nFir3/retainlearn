// The campus's data (PLAN 14.10): one call for everything it shows, for the browser's time zone, so "today" is the
// player's day. Fetched again when the tab comes back into view (the day may have turned) and after a saved batch
// of answers (the Campus tag, classesApi.ts).
import { useMemo } from "react";
import { dayKey } from "@retainlearn/core";
import type { Campus, SettingsPatchBody, When } from "@retainlearn/core";
import { apiSlice } from "#api/apiSlice.js";

// The browser's time zone, an IANA name such as "Asia/Kolkata".
export const browserTimeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;

// Today where the player is, for a page's rules: worked out at each render (cheap), and the same object until the day
// turns, so what's worked out from it is kept until then. A page open past midnight moves on at its next render (its
// data is fetched again when the tab comes back into view).
export function useToday(): When {
  const timeZone = browserTimeZone();
  const today = dayKey(new Date(), timeZone);
  return useMemo(() => ({ today, timeZone }), [today, timeZone]);
}

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

// Some of your settings (for now, what the classroom shows of each round). Shown at once: the cached campus takes the
// change, and goes back if the save fails.
export const settingsApi = campusApi.injectEndpoints({
  endpoints: (build) => ({
    saveSettings: build.mutation<SettingsPatchBody, SettingsPatchBody>({
      query: (body) => ({ url: "/campus/settings", method: "PATCH", params: { tz: browserTimeZone() }, body }),
      async onQueryStarted(body, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          campusApi.util.updateQueryData("getCampus", browserTimeZone(), (campus) => {
            Object.assign(campus.player.settings, body);
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

export const { useSaveSettingsMutation } = settingsApi;
