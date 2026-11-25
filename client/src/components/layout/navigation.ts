// The app's main places, in the top bar and the phone's tab bar: for a signed-in player, the campus, the subjects and
// their report card; for a visitor, the home page and the subjects.
import type { IconName } from "#components/ui/Icon.tsx";

export type Place = { to: string; label: string; icon: IconName };

export const mainPlaces = (signedOut: boolean): Place[] =>
  signedOut
    ? [
        { to: "/", label: "Home", icon: "home" },
        { to: "/subjects", label: "Subjects", icon: "layers" },
      ]
    : [
        { to: "/", label: "Campus", icon: "building" },
        { to: "/subjects", label: "Subjects", icon: "layers" },
        { to: "/report-card", label: "Report card", icon: "report" },
      ];
