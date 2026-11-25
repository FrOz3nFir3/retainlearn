// A class while its set and your progress load, in the class's own frame (ClassFrame): Leave, the titles and how far
// through as placeholders, then the shape of what's coming: for a review, a flashcard and its button; for a quiz, the
// question, its four answers and the hint under them. Screen readers hear label (Loading). Its own small file, loaded
// with the app (PLAN 14.15), so the route shows it before the class's code arrives too.
import type { ClassMode } from "@retainlearn/core";
import { useSession } from "#app/session.ts";
import { Icon } from "#components/ui/Icon.tsx";
import { Loading, SkeletonBlock, SkeletonText } from "#components/ui/Skeleton.tsx";
import { ClassFrame, GUEST, TRACK } from "./ClassShell.tsx";

export function ClassSkeleton({ label, mode }: { label: string; mode: ClassMode }) {
  const signedIn = useSession() !== "out";
  const review = mode === "review" || mode === "reviewMissed";
  return (
    <ClassFrame
      leave={
        <span className="grid size-10 shrink-0 place-items-center text-ink/25">
          <Icon name="x" className="size-5" />
        </span>
      }
      eyebrow={<SkeletonText className="w-32" />}
      title={<SkeletonText className="w-44" />}
      progressText={<SkeletonText className="w-36" />}
      below={
        review ? (
          <div className={TRACK}>
            <SkeletonBlock className="h-1.5 rounded-full" />
          </div>
        ) : (
          <SkeletonBlock className="h-1 rounded-none" />
        )
      }
      notice={
        !signedIn && (
          <p className={GUEST}>
            <SkeletonText className="w-full" />
          </p>
        )
      }
      bar={
        review ? (
          <SkeletonBlock className="h-9 w-44 rounded-xl" />
        ) : (
          <span className="mr-auto text-sm">
            <SkeletonText className="w-48" />
          </span>
        )
      }
    >
      <Loading label={label}>
        {review ? (
          <SkeletonBlock className="h-72 rounded-3xl" />
        ) : (
          <>
            <div className="panel bg-surface p-5">
              <p className="text-xs font-semibold">
                <SkeletonText className="w-20" />
              </p>
              <div className="mt-1 text-[17px] font-medium">
                <SkeletonText className="w-11/12" />
                <SkeletonText className="w-2/3" />
              </div>
            </div>
            <div className="mt-3 grid gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-surface px-4 py-3">
                  <SkeletonBlock className="size-7 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1 text-[15px]">
                    <SkeletonText className="w-48" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Loading>
    </ClassFrame>
  );
}
