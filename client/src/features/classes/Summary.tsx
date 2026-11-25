// The end of a class, for review and quiz alike: what finished, the XP it earned counting up to its total, the streak
// if this was the day's first class, the timetable's bell when this class completed it, and mastery before and after.
// hero: the class's big moment under the title (a round's stars, the recall ring). lines: more [label, value] rows.
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useSignedIn } from "#app/hooks.ts";
import { buttonClass } from "#components/ui/Button.tsx";
import { useReturnTo } from "./ClassShell.tsx";

export type ClassResult = { xp: number; streak?: number; firstToday?: boolean; timetableDone?: boolean; masteryBefore?: number; masteryAfter?: number };

const pct = (x: number) => `${Math.round(x * 100)}%`;
const stillMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

// A number counting up from 0, quickly; straight to it with reduced motion.
function CountUp({ to, ms = 900 }: { to: number; ms?: number }) {
  const [n, setN] = useState(() => (stillMotion() ? to : 0));
  useEffect(() => {
    if (stillMotion() || !to) {
      setN(to);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      setN(Math.round(to * (1 - (1 - k) ** 3)));
      if (k < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [to, ms]);
  return <>{n}</>;
}

type Props = { setId: string; title?: string; result: ClassResult | null; hero?: ReactNode; lines: readonly (readonly [string, ReactNode])[]; extra?: ReactNode; actions?: ReactNode };

export function Summary({ setId, title = "Class finished", result, hero, lines, extra, actions }: Props) {
  const signedIn = useSignedIn();
  const returnTo = useReturnTo(setId);
  const rows: (readonly [string, ReactNode])[] = [
    ...(result?.masteryBefore != null && result.masteryAfter != null ? [["Mastery of this set", `${pct(result.masteryBefore)} → ${pct(result.masteryAfter)}`] as const] : []),
    ...lines,
  ];
  return (
    <section aria-labelledby="class-summary" className="space-y-4 motion-safe:animate-[kit-rise_0.35s_cubic-bezier(0.2,0.8,0.2,1)]">
      <div className="panel bg-surface p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="class-summary" className="font-display text-3xl font-semibold">
              {title}
            </h2>
            {result?.firstToday && <p className="mt-1 text-sm font-semibold text-bell-ink">Streak kept: {result.streak} days</p>}
          </div>
          {result && (
            <p className="rounded-2xl bg-bell-wash px-4 py-2 text-right">
              <span className="block font-display text-3xl font-semibold text-bell-ink tabular-nums">
                +<CountUp to={result.xp} />
              </span>
              <span className="block text-xs font-semibold text-bell-ink/70">XP</span>
            </p>
          )}
        </div>
        {hero && <div className="mt-4">{hero}</div>}
        {rows.length > 0 && (
          <dl className="mt-4 divide-y divide-ink/[0.06] rounded-2xl border border-ink/[0.07]">
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <dt className="flex-1 text-ink/65">{label}</dt>
                <dd className="font-semibold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        )}
        {result?.timetableDone && <p className="mt-3 rounded-xl bg-bell-wash px-3 py-2 text-sm font-semibold text-bell-ink">Timetable done. The bell rings on your campus.</p>}
      </div>
      {extra}
      <div className="flex flex-wrap justify-end gap-2">
        {!signedIn && (
          <Link to="/sign-in" className={buttonClass("quiet")}>
            Sign in to keep this
          </Link>
        )}
        {actions}
        <Link to={returnTo} className={buttonClass("primary")}>
          Back to {returnTo === "/" ? "campus" : "classroom"}
        </Link>
      </div>
    </section>
  );
}
