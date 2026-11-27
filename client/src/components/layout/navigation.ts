// The app's main places, in the top bar and the phone's tab bar: for a signed-in player, the campus, the subjects, skill
// paths and their report card; for a visitor, the home page, the subjects and skill paths. wide: in the top bar on
// wide screens only, and not in the phone's tab bar, as the prototype had it (the directory's tabs reach it there).
import type { IconName } from "#components/ui/Icon.tsx";

export type Place = { to: string; label: string; icon: IconName; wide?: boolean };

export const mainPlaces = (signedOut: boolean): Place[] =>
  signedOut
    ? [
        { to: "/", label: "Home", icon: "home" },
        { to: "/subjects", label: "Subjects", icon: "layers" },
        { to: "/paths", label: "Paths", icon: "path", wide: true },
      ]
    : [
        { to: "/", label: "Campus", icon: "building" },
        { to: "/subjects", label: "Subjects", icon: "layers" },
        { to: "/paths", label: "Paths", icon: "path", wide: true },
        { to: "/report-card", label: "Report card", icon: "report" },
      ];
