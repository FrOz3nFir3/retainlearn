// A class, full screen: a sticky header (Leave, what class, where you are, its progress), the content scrolling under
// it, and a sticky bar of actions at the bottom (within the phone's safe area). track: the class's own progress in the
// header instead of a bar (a quiz's balls), so it stays in sight however far you scroll. Someone not signed in can
// try a class, and is told signing in saves it.
import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { ClassMode } from "@retainlearn/core";
import { useSignedIn } from "#app/hooks.ts";
import { Bar } from "#components/ui/Bar.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { IconButton } from "#components/ui/IconButton.tsx";
import { CLASS_KINDS, setPath } from "./modes.ts";

// Where Leave and "Back to…" go: where the class was started from (the campus passes it), else the set's classroom.
export function useReturnTo(setId: string): string {
  const state = useLocation().state as { returnTo?: string } | null;
  return state?.returnTo ?? setPath(setId);
}

type Props = {
  set: { _id: string; category: string; subtopic: string };
  mode: ClassMode;
  progressText?: ReactNode;
  progress?: number;
  track?: ReactNode;
  bar?: ReactNode;
  problem?: string | null; // said over the class, signed in: answers that didn't save (SAVE_FAILED)
  children: ReactNode;
};

// What a class says when some of its answers couldn't be saved (useSaveFailed).
export const SAVE_FAILED = "Some answers didn't save: check your connection. The ones after save as usual once you're back online.";

export function ClassShell({ set, mode, progressText, progress, track, bar, problem, children }: Props) {
  const navigate = useNavigate();
  const signedIn = useSignedIn();
  const returnTo = useReturnTo(set._id);
  return (
    <ClassFrame
      leave={<IconButton icon="x" label="Leave class" onClick={() => navigate(returnTo)} />}
      eyebrow={`${CLASS_KINDS[mode].label} in ${set.category}`}
      title={set.subtopic}
      progressText={progressText}
      below={track ? <div className={TRACK}>{track}</div> : progress != null && <Bar value={progress} label="How far through the class" className="h-1 rounded-none" />}
      notice={
        !signedIn ? (
          <GuestNote returnTo={returnTo} />
        ) : (
          problem && (
            <p role="alert" className="rounded-xl bg-rose-wash px-3 py-2 text-sm text-rose-ink">
              {problem}
            </p>
          )
        )
      }
      bar={bar}
    >
      {children}
    </ClassFrame>
  );
}

export const TRACK = "mx-auto max-w-3xl px-4 pb-2.5";

// A guest's note over a class: it's a try-out, and signing in, at any point, saves it to an account (guestClasses.ts),
// then goes back where the class would. The class's skeleton shows the same note, so nothing moves as the class comes.
export function GuestNote({ returnTo }: { returnTo: string }) {
  return (
    <p className="rounded-xl bg-bell-wash px-3 py-2 text-sm text-bell-ink">
      Trying it out:{" "}
      <Link to="/sign-in" state={{ returnTo }} className="font-semibold underline">
        sign in
      </Link>{" "}
      at any point to save this class to your account.
    </p>
  );
}

// The frame every class is in, a screen of its own: the bar at the top (Leave, which class in which set, how far
// through, and what's under it), a guest's note, the content, and the bar at the bottom. ClassShell fills it for a
// class, and ClassSkeleton with placeholders while one loads, so the two line up exactly. A title that's still to
// come isn't a heading.
type FrameProps = { leave: ReactNode; eyebrow: ReactNode; title: ReactNode; progressText?: ReactNode; below?: ReactNode; notice?: ReactNode; bar?: ReactNode; children: ReactNode };

export function ClassFrame({ leave, eyebrow, title, progressText, below, notice, bar, children }: FrameProps) {
  const titleClass = "truncate text-[15px] font-semibold";
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-mist text-ink">
      <header className="sticky top-0 z-20 border-b border-ink/[0.06] bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2.5">
          {leave}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-ink/50">{eyebrow}</p>
            {typeof title === "string" ? <h1 className={titleClass}>{title}</h1> : <div className={titleClass}>{title}</div>}
          </div>
          {progressText && <p className="text-right text-xs text-ink/55 tabular-nums">{progressText}</p>}
        </div>
        {below}
      </header>
      {notice && <div className="mx-auto max-w-3xl px-4 pt-3">{notice}</div>}
      {/* Not a <main>: the class is inside the page's own (App.jsx), and a page has one. */}
      <div className="mx-auto max-w-3xl px-4 pt-4 pb-40">{children}</div>
      {bar && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/[0.06] bg-surface/92 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-end gap-2 px-4 pt-3">{bar}</div>
        </div>
      )}
    </div>
  );
}

// A class left halfway, picked up again: how far you'd got, and the way to start it afresh instead.
export function Resumed({ text, onRestart }: { text: string; onRestart: () => void }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-brand/[0.07] px-3.5 py-2.5 text-sm">
      <Icon name="review" className="size-4 shrink-0 text-brand" />
      <span className="flex-1">{text}</span>
      <button type="button" className="cursor-pointer font-semibold text-brand hover:underline" onClick={onRestart}>
        Start over
      </button>
    </div>
  );
}
