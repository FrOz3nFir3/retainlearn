// Paths on a subject's page (the prototype's lobby): the path you follow when it's this subject's, where you're up to
// and a bar of its steps (done, your current one), opening the path; and the subject's other paths, as links.
import { Link } from "react-router-dom";
import type { PathProgress, PathView } from "@retainlearn/core";
import { useGetPathsQuery } from "./pathsApi.ts";
import { pathPath } from "./pathView.ts";
import { cx } from "#utils/cx.ts";
import { FOLLOWED_CARD } from "#features/subjects/SubjectSkeleton.tsx";

export function FollowedHere({ path, along }: { path: PathView; along: PathProgress }) {
  const n = along.total;
  const current = along.current;
  return (
    <Link to={pathPath(path._id)} className={cx(FOLLOWED_CARD, "transition-colors hover:border-brand/30 focus-visible:outline-2 focus-visible:outline-brand")}>
      <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
        <span className="font-semibold text-balance">{path.title}</span>
        <span className="text-xs text-ink/50">your path</span>
      </p>
      <p className="text-xs text-ink/55">{current ? `Step ${along.steps.indexOf(current) + 1} of ${n}: ${current.set.title}` : `All ${n} steps done`}</p>
      <div aria-hidden="true" className="mt-2 flex gap-1">
        {along.steps.map((s) => (
          <span key={s.step.id} className={cx("h-1.5 flex-1 rounded-full", s.state === "done" ? "bg-mint" : s.state === "current" ? "bg-brand" : "bg-ink/10")} />
        ))}
      </div>
    </Link>
  );
}

// The subject's paths, but the one you follow ("Other paths here"), as links; nothing when there are none.
export function PathsHereLinks({ subject, followedId }: { subject: string; followedId: string | null }) {
  const list = useGetPathsQuery({ search: "", subject, mine: false, page: 1 });
  const others = (list.data?.paths ?? []).filter((p) => p._id !== followedId);
  if (!others.length) return null;
  return (
    <p className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-ink/55">
      {followedId ? "Other paths here:" : "Paths here:"}
      {others.map((p) => (
        <Link key={p._id} to={pathPath(p._id)} className="rounded-full bg-brand/8 px-2 py-0.5 font-semibold text-brand hover:bg-brand/12">
          {p.title}
        </Link>
      ))}
    </p>
  );
}
