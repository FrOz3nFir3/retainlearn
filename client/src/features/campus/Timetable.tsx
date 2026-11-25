// Today's timetable (the prototype's Timetable): the day's classes, picked across your subjects (packages/core
// timetable.ts). Its periods and the last bell are buttons in a row (a toolbar: one tab stop, arrow keys between them;
// guide: toolbar), each saying what it is; the box under them shows the one pressed, up next to start with. A period's
// Start opens its class, which comes back here after. The last bell: your streak, and the bonus for finishing them all.
import { useId, useState } from "react";
import type { KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { XP } from "@retainlearn/core";
import type { Campus, ClassMode, Why } from "@retainlearn/core";
import { buttonClass } from "#components/ui/Button.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import type { IconName } from "#components/ui/Icon.tsx";
import { CLASS_KINDS, classPath } from "#features/classes/modes.ts";
import { cx } from "#utils/cx.ts";
import { TimetableSection } from "./CampusSkeleton.tsx";

const nativeFocusgroup = typeof HTMLElement !== "undefined" && "focusGroup" in HTMLElement.prototype;
const ORDINAL = ["1st period", "2nd period", "3rd period"];
const ICON: Record<ClassMode, IconName> = { review: "review", quiz: "quiz", reviewMissed: "focus", retryMissed: "focus" };
const MINUTES: Record<ClassMode, number> = { review: 5, quiz: 3, reviewMissed: 5, retryMissed: 3 };
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const ordinal = (i: number) => ORDINAL[i] ?? `Period ${i + 1}`;

// Why a period is on today, in a few words (the prototype's whyShort).
function whyText(why: Why): string {
  switch (why.kind) {
    case "missed":
      return `${why.n} missed, due back`;
    case "fading":
      return `${plural(why.n, "player card")} fading`;
    case "cold":
      return `${plural(why.n, "day")} since you studied it`;
    case "continue":
      return `${why.n} of ${why.of} flashcards so far`;
    case "new":
      return "Not started yet";
  }
}

type Period = Campus["timetable"][number];
const titleOf = (p: Period) => p.set?.subtopic ?? "Study set";

export function Timetable({ campus }: { campus: Campus }) {
  const periods = campus.timetable;
  const { count: streak, keptToday } = campus.player.streak;
  const boxId = useId();
  const next = periods.findIndex((p) => !p.done);
  const done = periods.filter((p) => p.done).length;
  const allDone = periods.length > 0 && next < 0;
  const bell = periods.length; // the last bell, after the periods
  // The one tapped, for the timetable as it stood: once a period is done (or a new day's is drawn up), the box goes back
  // to what's up next.
  const day = `${campus.day}|${periods.map((p) => `${p.setId}:${p.mode}:${p.done ? 1 : 0}`).join("|")}`;
  const [picked, setPicked] = useState<{ day: string; i: number } | null>(null);
  const shown = picked?.day === day ? picked.i : next >= 0 ? next : bell;
  const [tabStop, setTabStop] = useState<number | null>(null); // the fallback's roving tab stop

  // No periods: no subject yet, or nothing due in them today (everything reviewed, nothing missed or fading yet).
  if (!periods.length) {
    return (
      <TimetableSection>
        <p className="rounded-2xl bg-brand/6 p-3 text-sm text-pretty text-ink/65">
          {campus.subjects.length
            ? `Nothing's due today: you're up to date in your subjects. Any class you take ${keptToday ? "today is extra" : "today keeps your streak"}.`
            : "Your timetable starts with your first subject: each day it picks two classes for you, across your subjects."}
        </p>
      </TimetableSection>
    );
  }

  const dots = [
    ...periods.map((p, i) => ({
      label: `${ordinal(i)}: ${titleOf(p)}, ${CLASS_KINDS[p.mode].label}${p.done ? ", done" : i === next ? ", up next" : ""}`,
      icon: (p.done ? "check" : ICON[p.mode]) as IconName,
      tone: p.done ? "bg-brand text-white" : i === next ? "bg-surface text-brand ring-2 ring-brand ring-inset" : "bg-ink/6 text-ink/50",
    })),
    {
      label: allDone ? "Last bell: rung" : "Last bell: your streak, and the bonus for finishing",
      icon: (allDone ? "gift" : "bell") as IconName,
      tone: allDone ? "bg-bell text-night" : "bg-ink/6 text-ink/50",
    },
  ];
  const stop = Math.min(tabStop ?? shown, dots.length - 1); // the timetable may have changed since (a new day)
  // Without the browser's focusgroup: arrow keys, Home and End move between the buttons, wrapping at the ends.
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const buttons = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("button")];
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    const to = e.key === "Home" ? 0 : e.key === "End" ? buttons.length - 1 : step ? (at + step + buttons.length) % buttons.length : -1;
    if (at < 0 || to < 0) return;
    e.preventDefault();
    buttons[to]?.focus();
  };

  const p = periods[shown];
  const state = p ? (p.done ? "Done" : shown === next ? "Up next" : "Later today") : null;
  return (
    <TimetableSection count={`${done} of ${periods.length} done`}>
      <div
        role="toolbar"
        aria-label="Today's periods, and the last bell"
        aria-controls={boxId}
        {...({ focusgroup: "toolbar wrap" } as Record<string, string>)}
        onKeyDown={nativeFocusgroup ? undefined : onKey}
        className="mb-3 flex items-center gap-1.5 pointer-coarse:gap-2.5"
      >
        {dots.map((dot, i) => (
          <button
            key={i}
            type="button"
            aria-pressed={shown === i}
            aria-label={dot.label}
            tabIndex={nativeFocusgroup ? undefined : i === stop ? 0 : -1}
            onFocus={() => setTabStop(i)}
            onClick={() => setPicked({ day, i })}
            className={cx(
              "relative grid size-7 place-items-center rounded-full transition-colors pointer-coarse:size-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
              "aria-pressed:after:absolute aria-pressed:after:-bottom-1.75 aria-pressed:after:left-1/2 aria-pressed:after:h-0.75 aria-pressed:after:w-3.5 aria-pressed:after:-translate-x-1/2 aria-pressed:after:rounded-full aria-pressed:after:bg-brand",
              dot.tone,
            )}
          >
            <Icon name={dot.icon} className="size-3.5" />
          </button>
        ))}
      </div>
      <div id={boxId} className="flex flex-wrap items-center gap-3 rounded-2xl bg-brand/6 p-3">
        {p ? (
          <>
            <div className="min-w-0 flex-1 basis-48">
              <p className="text-[11px] font-semibold">
                <span className={p.done ? "text-mint-ink" : shown === next ? "text-brand" : "text-ink/55"}>{state}</span>
                <span className="text-ink/45"> · {ordinal(shown)}</span>
              </p>
              <p className="text-sm leading-snug font-semibold text-pretty">{titleOf(p)}</p>
              <p className="flex items-center gap-1 text-xs text-ink/55">
                <Icon name="clock" className="size-3.5 shrink-0" />
                {CLASS_KINDS[p.mode].label}, about {MINUTES[p.mode]} min
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-bell-ink">Why: {whyText(p.why)}</p>
            </div>
            <Link to={classPath(p.setId, p.mode)} state={{ returnTo: "/" }} className={buttonClass(p.done ? "quiet" : "primary")}>
              <Icon name={ICON[p.mode]} className="size-4" />
              {p.done ? "Go again" : "Start"}
            </Link>
          </>
        ) : (
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-bell-ink">Last bell</p>
            <p className="text-sm leading-snug font-semibold">{allDone ? "All done, and the bell's rung" : keptToday ? `Streak kept: ${plural(streak, "day")}` : "Any period keeps your streak"}</p>
            <p className="text-xs text-pretty text-ink/55">
              {allDone
                ? `That earned you ${XP.timetableDone} bonus XP. See you tomorrow: anything more today is extra.`
                : `${keptToday ? "" : streak ? `That makes ${plural(streak + 1, "day")} in a row. ` : "One today starts a streak. "}Finish all ${periods.length} and the bell rings: ${XP.timetableDone} bonus XP.`}
            </p>
          </div>
        )}
      </div>
    </TimetableSection>
  );
}
