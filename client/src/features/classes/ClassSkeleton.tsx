// A class while its set and your progress load: the header, the question's panel and its options as placeholders, in the
// shape they'll have, so nothing jumps when they arrive. Screen readers hear what's loading (Loading).
import { Loading, SkeletonBlock, SkeletonLine } from "#components/ui/Skeleton.tsx";

export function ClassSkeleton({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-mist">
      <Loading label={label}>
        <div className="border-b border-ink/[0.06] bg-surface/90">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3.5">
            <SkeletonBlock className="size-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <SkeletonLine className="h-2.5 w-28" />
              <SkeletonLine className="w-48" />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-3xl space-y-3 px-4 pt-4">
          <div className="panel space-y-3 bg-surface p-5">
            <SkeletonLine className="h-2.5 w-20" />
            <SkeletonLine className="h-4 w-11/12" />
            <SkeletonLine className="h-4 w-2/3" />
          </div>
          {[0, 1, 2, 3].map((i) => (
            <SkeletonBlock key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      </Loading>
    </div>
  );
}
