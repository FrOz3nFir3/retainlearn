// A public profile's skeleton (PLAN 14.15), loaded with the app, so /profile/:username shows it the moment it's
// opened, and the page shows it while the profile loads: the heading's placeholders, the card with who they are, and
// the study sets' heading over cards in a set's shape.
import { PageSkeleton } from "#components/ui/Page.tsx";
import { SkeletonText } from "#components/ui/Skeleton.tsx";
import { AuthoredSetsSkeleton, IdentityCard } from "./ProfileSkeleton.tsx";

export const PUBLIC_SETS_HEADING = "mt-6 mb-3 font-display text-xl font-semibold";

export function PublicProfileSkeleton() {
  return (
    <PageSkeleton label="Loading the profile">
      <IdentityCard name={<SkeletonText className="w-40" />} username={<SkeletonText className="w-24" />} detail={<SkeletonText className="w-28" />} />
      <p className={PUBLIC_SETS_HEADING}>Study sets</p>
      <AuthoredSetsSkeleton />
    </PageSkeleton>
  );
}
