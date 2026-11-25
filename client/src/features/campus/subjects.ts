// A subject on the campus: its pennant colour, worked out from its name so it's the same wherever the subject shows
// (the prototype's data/campus.js), and its status in words (how warm it is: data/progress.js's STATUS).
import type { SubjectStatus } from "@retainlearn/core";
import type { ChipTone } from "#components/ui/Chip.tsx";

const PENNANTS = ["#4F46E5", "#0EA5A4", "#E8604C", "#34B27D", "#9B6BDF", "#D97706", "#2563EB", "#DB2777", "#0891B2", "#65A30D"] as const;
export const pennantOf = (name: string): string => PENNANTS[[...name].reduce((n, ch) => n + ch.charCodeAt(0), 0) % PENNANTS.length] ?? PENNANTS[0];

export const SUBJECT_STATUS: Record<SubjectStatus, { label: string; tone: ChipTone }> = {
  warm: { label: "Studied recently", tone: "mint" },
  cooling: { label: "Cooling down", tone: "bell" },
  cold: { label: "Going cold", tone: "cold" },
  new: { label: "Not started", tone: "brand" },
  empty: { label: "Needs content", tone: "orange" },
};
