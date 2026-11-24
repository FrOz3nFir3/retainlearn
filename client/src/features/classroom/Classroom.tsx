// A study set's classroom (/card/:id, the prototype's Classroom): how you stand in it, what to do next, going over or
// retrying what you missed, a mixed quiz of what you hold, and its rounds, each with its review and quiz. While the set
// and your progress load, its skeleton. Someone not signed in can study, and is told nothing is saved. The set's
// editor is today's (/card/:id/edit) until it's replaced (D-17).
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MIX_READY, dayKey, isPlayerCard, mixableCount, reviewLoad, roundState, setRounds, studySetStats, upNext } from "@retainlearn/core";
import type { ProgressView, StudySetContent, When } from "@retainlearn/core";
import { useSignedIn } from "#app/hooks.ts";
import { Bar } from "#components/ui/Bar.tsx";
import { buttonClass } from "#components/ui/Button.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { Empty } from "#components/ui/Empty.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import type { IconName } from "#components/ui/Icon.tsx";
import { Page } from "#components/ui/Page.tsx";
import { Loading, SkeletonBlock, SkeletonLine } from "#components/ui/Skeleton.tsx";
import { browserTimeZone } from "#features/campus/campusApi.ts";
import { classPath } from "#features/classes/modes.ts";
import { recallPoints } from "#features/classes/recallPoints.ts";
import { useGetProgressQuery, useGetStudySetQuery } from "./classroomApi.ts";
import { RoundRow } from "./RoundRow.tsx";

const pct = (x: number) => `${Math.round(x * 100)}%`;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export default function Classroom() {
  const { id = "" } = useParams();
  const signedIn = useSignedIn();
  const set = useGetStudySetQuery(id);
  const progress = useGetProgressQuery(id, { skip: !signedIn });
  const [when] = useState<When>(() => {
    const timeZone = browserTimeZone();
    return { today: dayKey(new Date(), timeZone), timeZone };
  });
  if (set.isError) {
    return (
      <Page title="Not found" back="/categories">
        <Empty icon="x" title="This study set isn't here" body="It may have been deleted, or the link is wrong." action={<Link to="/categories" className={buttonClass("primary")}>Find a set</Link>} />
      </Page>
    );
  }
  if (!set.data || (signedIn && progress.isLoading)) return <ClassroomSkeleton />;
  return <ClassroomView set={set.data} progress={progress.data ?? null} when={when} signedIn={signedIn} />;
}

function ClassroomSkeleton() {
  return (
    <div className="min-h-dvh bg-mist">
      <Loading label="Loading the classroom" className="mx-auto max-w-3xl space-y-4 px-4 py-5 sm:px-6">
        <SkeletonLine className="h-6 w-1/2" />
        <SkeletonBlock className="h-28" />
        <SkeletonBlock className="h-20" />
        {[0, 1, 2].map((i) => (
          <SkeletonBlock key={i} className="h-24" />
        ))}
      </Loading>
    </div>
  );
}

// A way into a class, as a row: what it is, why, and Start.
function Action({ to, icon, title, body, primary = false }: { to: string; icon: IconName; title: string; body: string; primary?: boolean }) {
  return (
    <div className="panel flex items-center gap-3 bg-surface p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
        <Icon name={icon} className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-ink/55">{body}</p>
      </div>
      <Link to={to} state={{ returnTo: to.split("/").slice(0, 3).join("/") }} className={buttonClass(primary ? "primary" : "quiet")}>
        Start
      </Link>
    </div>
  );
}

function ClassroomView({ set, progress, when, signedIn }: { set: StudySetContent; progress: ProgressView | null; when: When; signedIn: boolean }) {
  const order = progress?.order;
  const rounds = useMemo(() => setRounds(set, order, (f) => reviewLoad(recallPoints(f.answer).length)), [set, order]);
  const states = rounds.map((r) => roundState(r, progress, when));
  const stats = studySetStats(set, progress, when);
  const next = upNext(rounds, states);
  const held = Object.values(progress?.questions ?? {}).filter((q) => isPlayerCard(q)).length;
  const mixable = held >= MIX_READY ? mixableCount(rounds, progress, when) : 0;

  return (
    <Page
      title={set.subtopic}
      eyebrow={`${set.topic} in ${set.category}`}
      back={`/category/${encodeURIComponent(set.category)}`}
      width="max-w-3xl"
      actions={
        signedIn && (
          <Link to={`/card/${set._id}/edit`} className={buttonClass("quiet", "sm")}>
            Edit
          </Link>
        )
      }
    >
      <div className="space-y-5">
        {!signedIn && (
          <p className="rounded-2xl bg-bell-wash px-3.5 py-3 text-sm text-bell-ink">
            You can study as a guest, but nothing is saved.{" "}
            <Link to="/authenticate" className="font-semibold underline">
              Sign in
            </Link>{" "}
            to keep your progress and earn player cards.
          </p>
        )}
        {set.description && <p className="text-sm text-ink/65">{set.description}</p>}

        {signedIn && stats.started && (
          <section aria-label="How you stand in this set" className="panel bg-surface p-4">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-3xl font-semibold tabular-nums">{pct(stats.mastery)}</span>
              <span className="text-xs text-ink/50">mastery</span>
            </div>
            <Bar value={stats.mastery} label="Mastery of this set" className="mt-1.5 h-2" />
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Chip>{`${stats.reviewed} of ${stats.flashcards} flashcards seen`}</Chip>
              {stats.missedFlashcards > 0 && <Chip tone="bell">{`Points missed on ${plural(stats.missedFlashcards, "flashcard")}`}</Chip>}
              {stats.missedQuestions > 0 && <Chip tone="rose">{`${plural(stats.missedQuestions, "question")} missed`}</Chip>}
              <Chip tone="brand">{`${plural(held, "player card")} earned`}</Chip>
            </div>
          </section>
        )}

        {next && (
          <Action
            primary
            to={`${classPath(set._id, next.mode)}?round=${next.round.n}`}
            icon={next.mode}
            title={`Up next: ${next.mode} round ${next.round.n}`}
            body={next.mode === "review" ? `${plural(next.round.cards.length, "flashcard")}, about ${next.round.load} recall points.` : `${plural(next.round.questions.length, "question")} on what you've reviewed. Each one you get right becomes a player card.`}
          />
        )}
        {stats.missedFlashcards > 0 && <Action to={classPath(set._id, "reviewMissed")} icon="focus" title="Go over what you missed" body={`Just the points you missed, on ${plural(Math.min(4, stats.missedFlashcards), "flashcard")}.`} />}
        {stats.missedQuestions > 0 && <Action to={classPath(set._id, "retryMissed")} icon="focus" title="Retry what you missed" body={`${plural(stats.missedQuestions, "question")} you got wrong, until you get them right.`} />}
        {mixable > 0 && <Action to={`${classPath(set._id, "quiz")}?mix=1`} icon="layers" title="Mixed quiz" body="Questions you hold, from across the set: the fading ones first." />}

        <section aria-labelledby="rounds-title">
          <h2 id="rounds-title" className="mb-2 font-display text-xl font-semibold">
            Rounds
          </h2>
          {rounds.length ? (
            <ol className="space-y-2">
              {rounds.map((round, i) => {
                const state = states[i];
                return state ? <RoundRow key={round.n} setId={set._id} round={round} state={state} next={next?.round.n === round.n} /> : null;
              })}
            </ol>
          ) : (
            <Empty icon="review" title="Nothing to study yet" body="This set has no flashcards or questions yet." />
          )}
        </section>
      </div>
    </Page>
  );
}
