// The home page for a visitor (/ signed out; the prototype's Landing, with what today's page did well, P2-13): the
// promise beside a class happening (ClassDemo), a class to try with no account (the most-written subject's first set,
// as a guest: nothing saved), free and open source said up front, today's numbers from the subjects, how it works
// beside the campus, and one closing call. Loaded with the app (most visitors land here), so it needs no skeleton of
// its own: its two live parts have a placeholder (today's numbers) and a way on meanwhile (Browse subjects).
import { Link } from "react-router-dom";
import { Helmet } from "@dr.pogodin/react-helmet";
import { buttonClass } from "#components/ui/Button.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import type { IconName } from "#components/ui/Icon.tsx";
import { SkeletonText } from "#components/ui/Skeleton.tsx";
import { setPath } from "#features/classes/modes.ts";
import { useGetSubjectQuery, useGetSubjectsQuery } from "#features/subjects/subjectsApi.ts";
import { useGetPathsQuery } from "#features/paths/pathsApi.ts";
import { pathPath } from "#features/paths/pathView.ts";
import { cx } from "#utils/cx.ts";
import { CampusSketch } from "./CampusSketch.tsx";
import { ClassDemo } from "./ClassDemo.tsx";

const plural = (n: number, word: string) => `${n.toLocaleString("en")} ${word}${n === 1 ? "" : "s"}`;
const TITLE = "RetainLearn - Master Your Learning with Smart Flashcards";
const DESCRIPTION =
  "Five minutes a day, and you remember it: short classes of flashcards and quizzes, a daily timetable picked for you, and player cards that fade if you forget. Free and open source.";

const HOW: [IconName, string, string][] = [
  ["bell", "Your timetable", "Two short classes a day, picked from what you're learning: what you missed, what's fading, and what's next."],
  ["review", "Classes", "Recall the key points of a flashcard and tick what you knew. Only the points you missed come back."],
  ["cards", "Player cards", "Every quiz question you get right becomes a card. It levels up when you remember it again, and fades when you don't."],
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

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-10 pb-14 sm:px-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:pt-16 md:pb-20 lg:gap-20">
        <div>
          <h1 className="font-display text-[2.6rem] leading-[1.04] font-semibold tracking-tight text-balance sm:text-[3.4rem] lg:text-[4rem]">Five minutes a day, and you actually remember it.</h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-pretty text-ink/70">
            Your subjects become buildings on a small campus. Short classes keep their lights on, every question you get right becomes a player card, and anything you're starting
            to forget comes back before it's gone.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={trial} state={{ returnTo: "/" }} className={cx(buttonClass("primary"), "px-5 py-3 text-base")}>
              Try a 2-minute class
            </Link>
            <Link to="/subjects" className={cx(buttonClass("quiet"), "px-5 py-3 text-base")}>
              Browse subjects
            </Link>
          </div>
          <p className="mt-4 max-w-xl text-sm text-pretty text-ink/55">
            No account needed to try one. Free for good and open source: no premium tier, no ads, and no selling what you study.
          </p>
        </div>
        <ClassDemo className="mx-auto w-full max-w-md md:mx-0 md:justify-self-end" />
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

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16" aria-labelledby="how-heading">
        <div className="rounded-[28px] bg-[#e6e9f6] p-4 sm:p-6">
          <CampusSketch className="mx-auto w-full max-w-md" />
        </div>
        <div>
          <h2 id="how-heading" className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-pretty text-ink/65">
            Every subject you study becomes a building on your campus. It warms up while you keep at it, and cools down while you're away.
          </p>
          <ul className="mt-6 space-y-5">
            {HOW.map(([icon, title, body]) => (
              <li key={title} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
                  <Icon name={icon} className="size-6" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="mt-0.5 max-w-lg text-[15px] leading-relaxed text-pretty text-ink/65">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <StartWithAPath />

      <section className="bg-night text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight">Start with one class.</h2>
            <p className="mt-2 max-w-xl text-pretty text-white/70">
              Two minutes on {set ? set.subtopic : "a study set"}. If you like it, sign in and your first building stays lit.
            </p>
          </div>
          <Link to={trial} state={{ returnTo: "/" }} className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl bg-bell px-5 py-3 text-base font-semibold text-night transition-colors hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            Try a 2-minute class
          </Link>
        </div>
      </section>
    </div>
  );
}

// "Not sure where to start?" (the prototype's landing): a few public paths, each opening its page, and all of them.
// Nothing when there are none yet.
function StartWithAPath() {
  const paths = useGetPathsQuery({ search: "", subject: null, mine: false, page: 1 }).data?.paths.slice(0, 3) ?? [];
  if (!paths.length) return null;
  const count = (n: number, word: string) => `${n.toLocaleString("en")} ${word}${n === 1 ? "" : "s"}`;
  return (
    <section aria-labelledby="paths-heading" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <h2 id="paths-heading" className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Not sure where to start?
      </h2>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-pretty text-ink/65">Follow a path. It puts study sets in order, tells you what to learn next, and ends with a skill you can show.</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {paths.map((path) => (
          <li key={path._id}>
            <Link to={pathPath(path._id)} className="block h-full rounded-2xl border border-ink/8 bg-surface p-4 transition-colors hover:border-brand/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
              <span className="flex items-center gap-2 font-semibold text-balance">
                <Icon name="path" className="size-4 shrink-0 text-brand" />
                {path.title}
              </span>
              {path.description && <span className="mt-1 line-clamp-2 block text-sm text-pretty text-ink/65">{path.description}</span>}
              <span className="mt-2 block text-xs text-ink/50">{`${count(path.steps, "step")}, ${count(path.flashcards, "flashcard")}, in ${path.category}`}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/paths" className="mt-4 inline-block text-sm font-semibold text-brand underline-offset-2 hover:underline">
        All paths
      </Link>
    </section>
  );
}
