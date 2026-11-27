// The time of day where you are, for the 3D campus's sky (scene/Sky.tsx) and the clock in the top bar (the prototype's
// data/daytime.js). The browser knows your time zone, so no location is needed. No three.js here: the top bar loads
// before the 3D scene.
import { useEffect, useState } from "react";
import type { Sky } from "@retainlearn/core";
import type { IconName } from "#components/ui/Icon.tsx";

export type Phase = Exclude<Sky, "auto">;
// The four parts of the day: the icon for each, the hour each one shows when you choose it yourself, and its sky's
// colour (scene/daylight.ts has the sky's every hour; this is for the 3D campus's loading screen).
export const PHASES: Record<Phase, { label: string; icon: IconName; hour: number; sky: string }> = {
  morning: { label: "Morning", icon: "sunrise", hour: 8.5, sky: "#E4E9F8" },
  afternoon: { label: "Afternoon", icon: "sun", hour: 14, sky: "#E6E9F6" },
  evening: { label: "Evening", icon: "sunset", hour: 18.4, sky: "#F4CFC4" },
  night: { label: "Night", icon: "moon", hour: 22, sky: "#1D1F48" },
};
export const phaseOf = (hour: number): Phase => (hour >= 5 && hour < 12 ? "morning" : hour >= 12 && hour < 17 ? "afternoon" : hour >= 17 && hour < 20.5 ? "evening" : "night");

export const localHour = (): number => {
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
};

// The hour where you are (0 to 24, with minutes), kept current.
export function useLocalHour(): number {
  const [hour, setHour] = useState(localHour);
  useEffect(() => {
    const id = setInterval(() => setHour(localHour()), 30_000);
    return () => clearInterval(id);
  }, []);
  return hour;
}

// The hour the sky shows: yours, unless you've chosen a part of the day (the `sky` setting).
export const skyHour = (sky: string | undefined, local: number): number => (sky && sky in PHASES ? PHASES[sky as Phase].hour : local);
