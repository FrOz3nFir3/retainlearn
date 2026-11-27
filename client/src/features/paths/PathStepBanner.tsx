// A classroom's place in the path you follow (the prototype's step banner): "Step n of N in {path}", where it stands
// (mastered, your current step, open, or later in the path), and "Skip with a test" while it isn't done (it has
// questions); once it's done, the way to your current step instead.
import { Link } from "react-router-dom";
import type { PathView, When } from "@retainlearn/core";
import { buttonClass } from "#components/ui/Button.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { setPath } from "#features/classes/modes.ts";
import { STEP_BANNER } from "#features/classroom/ClassroomSkeleton.tsx";
import { along, pathPath, testOutHref } from "./pathView.ts";

const SAID = { done: "Mastered", current: "Your current step", open: "Open", locked: "Comes later in the path" } as const;

export function PathStepBanner({ path, setId, when }: { path: PathView; setId: string; when: When }) {
  const progress = along(path, when);
  const entry = progress.steps.find((s) => s.set._id === setId);
  if (!entry) return null;
  const n = progress.steps.indexOf(entry) + 1;
  const done = entry.state === "done";
  const current = progress.current;
  const canTest = !done && entry.stats.questions > 0;
  return (
    <section aria-label="Your path" className={STEP_BANNER}>
      <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
        <Icon name="path" className="size-4" />
      </span>
      <div className="min-w-0 flex-1 basis-48">
        <p className="text-sm font-semibold text-balance">
          {`Step ${n} of ${progress.total} in `}
          <Link to={pathPath(path._id)} className="text-brand underline-offset-2 hover:underline">
            {path.title}
          </Link>
        </p>
        <p className="text-xs text-ink/60">{`${entry.testedOut ? "Test passed" : SAID[entry.state]}${canTest ? ". Already know it? Skip it with a test" : ""}`}</p>
      </div>
      {canTest ? (
        <Link to={testOutHref(path._id, setId, entry.step.id)} state={{ returnTo: setPath(setId) }} className={buttonClass("quiet", "sm")}>
          <Icon name="skip" className="size-4 shrink-0" />
          Skip with a test
        </Link>
      ) : (
        done &&
        current && (
          <Link to={setPath(current.set._id)} className={buttonClass("quiet", "sm")}>
            {`Go to step ${progress.steps.indexOf(current) + 1}`}
          </Link>
        )
      )}
    </section>
  );
}
