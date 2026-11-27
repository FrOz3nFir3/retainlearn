// Your coach on the 2D campus (the prototype's 2D coach card and speech box, hud/Coach.jsx): a card with their face,
// which says when they have something to tell you; a tap on it, or arriving with news, brings their speech box. The
// box: who's talking, one line typed out as they say it (tap it for the whole line; at once with reduced motion), and
// what you can do: the line's action (or the tour's Next, or Thanks), "Later" (no coming over again today), and under
// the line everything else they have for you, each a named one-tap option. Esc or a tap outside ends the talk. What
// you've heard, a day of Later and the tour are kept on your player (PATCH /api/campus/coach), so a refresh or another
// device doesn't bring them back.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Campus } from "@retainlearn/core";
import { Button } from "#components/ui/Button.tsx";
import { Dialog } from "#components/ui/Dialog.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { cx } from "#utils/cx.ts";
import { useSaveCoachMutation } from "./campusApi.ts";
import { COACH_CARD } from "./CampusSkeleton.tsx";
import { coachFor, coachLines, isNews } from "./coach.ts";
import type { CoachLine } from "./coach.ts";

type Who = { name: string; top: string };

// The coach's face: their initial on the colour of their training top (in dark ink: the tops are bright).
export function CoachFace({ who, className }: { who: Who; className?: string }) {
  return (
    <span aria-hidden="true" className={cx("grid size-11 shrink-0 place-items-center rounded-2xl font-display text-lg font-semibold text-night shadow-sm", className)} style={{ background: who.top }}>
      {who.name[0]}
    </span>
  );
}

// The coach on your campus: who they are, their lines, and the talk (open, which line, and what it does).
export function useCoach(campus: Campus, username: string | null) {
  const who = coachFor(username);
  const lines = coachLines(campus, username);
  const headline = lines[0]?.key;
  const news = isNews(campus.player.coach.heard, campus.day, headline);
  const [talk, setTalk] = useState<{ index: number } | null>(null);
  const [save] = useSaveCoachMutation();

  const open = () => {
    setTalk({ index: 0 });
    if (headline) void save({ heard: `${campus.day}|${headline}` });
  };
  // Ending the talk: Later keeps the coach away for the rest of the day; the tour, once given, isn't given again, and
  // the news told after it has been heard (it's the first line from now on).
  const done = (later = false) => {
    const tour = lines.filter((l) => l.key.startsWith("tour:")).length;
    const news = tour && talk && talk.index >= tour ? lines[tour]?.key : undefined;
    setTalk(null);
    const patch = {
      ...(later ? { quiet: campus.day } : {}),
      ...(campus.player.coach.toured ? {} : { toured: true as const }),
      ...(news ? { heard: `${campus.day}|${news}` } : {}),
    };
    if (Object.keys(patch).length) void save(patch);
  };
  const next = () => setTalk((t) => (t ? { index: t.index + 1 } : t));

  // Arriving with news, on a day you haven't said Later: the coach comes over, a moment after the page.
  const comes = news && campus.player.coach.quiet !== campus.day && !talk;
  useEffect(() => {
    if (!comes) return;
    const timer = setTimeout(open, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per piece of news
  }, [comes, headline]);

  const line = talk ? (lines[talk.index] ?? lines[0]) : null;
  return { who, lines, line, news, open, done, next };
}

// The card that brings the coach: a "!" when they have news.
export function CoachCard({ who, news, onTalk }: { who: Who; news: boolean; onTalk: () => void }) {
  return (
    <button
      type="button"
      onClick={onTalk}
      aria-label={news ? `Coach ${who.name} has news: talk` : `Talk to Coach ${who.name}`}
      className={cx(COACH_CARD, "cursor-pointer transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:hover:translate-y-0")}
    >
      <CoachFace who={who} />
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg font-semibold">Coach {who.name}</span>
        <span className="block truncate text-xs text-ink/55">{news ? "Has something to tell you" : "Tap to talk: what's on today"}</span>
      </span>
      {news && <span className="grid size-6 shrink-0 place-items-center rounded-full bg-bell text-xs font-bold text-night">!</span>}
    </button>
  );
}

const same = (a: CoachLine["act"], b: CoachLine["act"]) => !!a && !!b && a.to === b.to;

// The speech box: the line, its options, Later, and the way forward.
export function CoachTalk({ who, line, lines, onNext, onDone }: { who: Who; line: CoachLine; lines: CoachLine[]; onNext: () => void; onDone: (later?: boolean) => void }) {
  const navigate = useNavigate();
  const typed = useTyped(line.text, line.key);
  const also = line.more ? [] : lines.filter((l) => l !== line && l.act && !l.more && !same(l.act, line.act)).slice(0, 3);
  const go = (to: string) => {
    onDone();
    navigate(to, { state: { returnTo: "/" } });
  };
  return (
    <Dialog
      title={`Coach ${who.name}`}
      onClose={() => onDone()}
      placement="bottom"
      footer={
        <>
          {also.length > 0 && (
            // On a phone, the options have a row of their own above Later and the line's button.
            <div role="group" aria-label="Also" className="mr-auto flex w-full min-w-0 flex-wrap items-center gap-1.5 sm:w-auto sm:flex-1">
              <span className="text-[11px] font-semibold text-ink/45">Also</span>
              {also.map((l) => (
                <Button key={l.key} size="sm" icon={l.chip.icon} className="!rounded-full" title={l.text} onClick={() => l.act && go(l.act.to)}>
                  {l.chip.label}
                </Button>
              ))}
            </div>
          )}
          <Button title="I won't come over again today. Tap me any time" onClick={() => onDone(true)}>
            Later
          </Button>
          {/* One way forward: the tour's Next, the line's action, or (a line with nothing to do) Thanks. */}
          {line.more ? (
            <Button tone="primary" data-autofocus onClick={onNext}>
              {line.more}
            </Button>
          ) : line.act ? (
            <Button tone="primary" icon={line.chip.icon} data-autofocus onClick={() => line.act && go(line.act.to)}>
              {line.act.label}
            </Button>
          ) : (
            <Button tone="primary" data-autofocus onClick={() => onDone()}>
              Thanks
            </Button>
          )}
        </>
      }
    >
      <div className="flex items-start gap-3">
        <CoachFace who={who} />
        <p className="min-h-[2.75rem] flex-1 text-[15px] leading-snug" onClick={typed.finish}>
          <span className="sr-only">{line.text}</span>
          <span aria-hidden="true">{typed.text}</span>
        </p>
      </div>
    </Dialog>
  );
}

// A line typed out as it's said, about 70 characters a second; finish() shows it all. At once with reduced motion.
const still = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
function useTyped(text: string, key: string) {
  const [n, setN] = useState(() => (still() ? text.length : 0));
  useEffect(() => {
    if (still()) return setN(text.length);
    setN(0);
    const start = performance.now();
    let frame = 0;
    const step = (t: number) => {
      const k = Math.min(text.length, Math.floor(((t - start) / 1000) * 70));
      setN(k);
      if (k < text.length) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [key, text]);
  return { text: text.slice(0, n), finish: () => setN(text.length) };
}
