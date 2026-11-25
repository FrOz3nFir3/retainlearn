// The home page for a visitor (/ signed out; the prototype's Landing): what RetainLearn is, a class to try with no
// account (the most-written subject's first set, as a guest: nothing saved), today's numbers from the subjects, how it
// works, and the footer. Loaded with the app (most visitors land here), so it needs no skeleton of its own: its two
// live parts have placeholders (today's numbers) and a way on meanwhile (Browse subjects).
import { Link } from "react-router-dom";
import { Helmet } from "@dr.pogodin/react-helmet";
import { buttonClass } from "#components/ui/Button.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import type { IconName } from "#components/ui/Icon.tsx";
import { SkeletonText } from "#components/ui/Skeleton.tsx";
import { setPath } from "#features/classes/modes.ts";
import { useGetSubjectQuery, useGetSubjectsQuery } from "#features/subjects/subjectsApi.ts";
import { cx } from "#utils/cx.ts";
import { CampusSketch } from "./CampusSketch.tsx";

const plural = (n: number, word: string) => `${n.toLocaleString("en")} ${word}${n === 1 ? "" : "s"}`;
const TITLE = "RetainLearn - Master Your Learning with Smart Flashcards";
const DESCRIPTION =
  "Five minutes a day, and you remember it: short classes of flashcards and quizzes, a daily timetable picked for you, and player cards that fade if you forget. Free and open source.";

const HOW: [IconName, string, string][] = [
  ["review", "Classes", "Short and daily. Recall the key points of a flashcard, mark what you knew, and only the points you missed come back."],
  ["cards", "Player cards", "Every quiz question you get right becomes a card. It levels up when you remember it again, and fades when you don't."],
  ["bell", "Your timetable", "Two classes a day, picked from what you're learning: what you missed, what's fading, and what's next."],
];

// The subject with the most flashcards on the first page of subjects, and its first set with some: the class to try.
function useTrial() {
  const subjects = useGetSubjectsQuery({ search: "", page: 1 });
  const top = subjects.data?.subjects.reduce<(typeof subjects.data.subjects)[number] | undefined>((best, s) => (!best || s.flashcards > best.flashcards ? s : best), undefined);
  const subject = useGetSubjectQuery(top?.name ?? "", { skip: !top || top.flashcards === 0 });
  const set = subject.data?.sets.find((s) => s.flashcards > 0);
  return { top, total: subjects.data?.total ?? null, set, loading: subjects.isLoading };
}

export default function Landing() {
  const { top, total, set, loading } = useTrial();
  const trial = set ? `${setPath(set._id)}/review` : "/subjects";
  return (
    <div className="flex-1 bg-mist text-ink">
      <Helmet>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:type" content="website" />
      </Helmet>

      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pt-10 pb-8 sm:px-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:pt-16 md:pb-14">
        <div>
          <h1 className="font-display text-[2.6rem] leading-[1.04] font-semibold tracking-tight text-balance sm:text-6xl">Five minutes a day, and you actually remember it.</h1>
          <p className="mt-5 max-w-[34rem] text-[17px] leading-relaxed text-pretty text-ink/70">
            Your subjects become buildings on a small campus. Short classes keep their lights on, every question you get right becomes a player card, and anything you're starting
            to forget comes back before it's gone.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to={trial} state={{ returnTo: "/" }} className={cx(buttonClass("primary"), "px-5 py-3 text-base")}>
              Try a 2-minute class
            </Link>
            <Link to="/subjects" className={cx(buttonClass("quiet"), "px-5 py-3 text-base")}>
              Browse subjects
            </Link>
          </div>
          <p className="mt-3 text-sm text-ink/50">No account needed. Sign in later to keep your progress.</p>
        </div>
        <div className="rounded-[28px] border border-ink/10 bg-[#e6e9f6] shadow-[0_30px_60px_-30px_rgb(30_27_75/0.45)]">
          <CampusSketch className="mx-auto w-full max-w-lg p-6" />
        </div>
      </section>

      <section aria-label="Today on RetainLearn" className="border-y border-ink/[0.06] bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-5 text-center text-[15px] text-ink/70 sm:px-6">
          {top && total != null ? (
            <p className="text-pretty">
              Today on RetainLearn: <strong className="font-semibold text-ink">{plural(top.flashcards, "flashcard")}</strong> and{" "}
              <strong className="font-semibold text-ink">{plural(top.questions, "quiz question")}</strong> in {top.name}, written by the people who use it, across{" "}
              {plural(total, "subject")}.
            </p>
          ) : loading ? (
            <p>
              <SkeletonText className="mx-auto w-full max-w-xl" />
            </p>
          ) : (
            <p>Flashcards and quizzes written by the people who use them, in every subject.</p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="how-heading">
        <h2 id="how-heading" className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          How it works
        </h2>
        <ul className="mt-6 grid overflow-hidden rounded-3xl border border-ink/[0.08] bg-surface md:grid-cols-3 md:divide-x md:divide-ink/[0.08]">
          {HOW.map(([icon, title, body]) => (
            <li key={title} className="border-b border-ink/[0.08] p-6 last:border-b-0 md:border-b-0">
              <div className="grid size-11 place-items-center rounded-2xl bg-brand/10 text-brand">
                <Icon name={icon} className="size-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-pretty text-ink/65">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-night text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight">Start with one class.</h2>
            <p className="mt-2 max-w-xl text-pretty text-white/70">
              Two minutes on {set ? set.subtopic : "a study set"}. If you like it, sign in and your first building stays lit.
            </p>
          </div>
          <Link to={trial} state={{ returnTo: "/" }} className={cx(buttonClass("primary"), "bg-bell px-5 py-3 text-base text-night hover:bg-amber-400")}>
            Try a 2-minute class
          </Link>
        </div>
      </section>
    </div>
  );
}
