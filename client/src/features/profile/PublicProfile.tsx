// Someone's public profile (/profile/:username; the prototype's PublicProfile): who they are and the study sets they
// made, a page at a time. Your own shows how others see it, with the way to edit it. A username that isn't anyone's
// (changed, or the account deleted) says so.
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAppSelector } from "#app/hooks.ts";
import { Button, buttonClass } from "#components/ui/Button.tsx";
import { Empty } from "#components/ui/Empty.tsx";
import { Page } from "#components/ui/Page.tsx";
import { Pager } from "#components/ui/Pager.tsx";
import { SkeletonText } from "#components/ui/Skeleton.tsx";
import { selectCurrentUser } from "#features/authentication/state/authSlice.js";
import { useGetAuthoredSetsQuery, useGetPublicProfileQuery } from "./profileApi.ts";
import { AuthoredSetCard, AuthoredSetsSkeleton, IdentityCard, SETS_GRID } from "./ProfileSkeleton.tsx";
import { PUBLIC_SETS_HEADING, PublicProfileSkeleton } from "./PublicProfileSkeleton.tsx";

const plural = (n: number, word: string) => `${n.toLocaleString("en")} ${word}${n === 1 ? "" : "s"}`;

export default function PublicProfile() {
  const { username = "" } = useParams();
  const [params] = useSearchParams();
  const page = Math.max(1, Math.floor(Number(params.get("page"))) || 1);
  const profile = useGetPublicProfileQuery(username);
  const sets = useGetAuthoredSetsQuery({ username, page }, { skip: !profile.data });
  const me = useAppSelector(selectCurrentUser) as { username?: string } | null;
  if (profile.isError) {
    const missing = (profile.error as { status?: unknown }).status === 404;
    return (
      <Page title={missing ? "Profile not found" : "Profile"} noindex>
        <Empty
          icon="user"
          title={missing ? `We couldn't find @${username}` : "This profile didn't load"}
          body={missing ? "The username may have changed, or the account was deleted." : "Check your connection, then try again."}
          action={
            missing ? (
              <Link to="/subjects" className={buttonClass("primary")}>
                Browse subjects
              </Link>
            ) : (
              <Button tone="primary" onClick={() => void profile.refetch()}>
                Try again
              </Button>
            )
          }
        />
      </Page>
    );
  }
  if (!profile.data) return <PublicProfileSkeleton />;
  const { name } = profile.data;
  const isMe = me?.username === profile.data.username;
  const base = `/profile/${encodeURIComponent(profile.data.username)}`;
  return (
    <Page title={name} eyebrow="Profile" description={`${name}'s study sets on RetainLearn.`}>
      <IdentityCard
        name={name}
        username={`@${profile.data.username}`}
        detail={sets.data ? `${plural(sets.data.total, "study set")} made` : <SkeletonText className="w-28" />}
        action={
          isMe && (
            <Link to="/profile" className={buttonClass("quiet", "sm")}>
              Edit your profile
            </Link>
          )
        }
      />
      {isMe && <p className="mt-2 text-sm text-ink/55">This is how other people see your profile.</p>}
      <h2 className={PUBLIC_SETS_HEADING}>Study sets</h2>
      {sets.isError ? (
        <p className="text-sm text-ink/55">The study sets didn't load. Check your connection, then reload the page.</p>
      ) : !sets.data ? (
        <AuthoredSetsSkeleton />
      ) : sets.data.sets.length === 0 ? (
        <Empty icon="layers" title="No study sets yet" body={isMe ? 'Open any subject and use "New study set".' : `${name} hasn't made a study set yet.`} />
      ) : (
        <ul className={SETS_GRID}>
          {sets.data.sets.map((set) => (
            <li key={set._id}>
              <AuthoredSetCard set={set} />
            </li>
          ))}
        </ul>
      )}
      {sets.data && <Pager page={page} pages={sets.data.pages} href={(p) => (p > 1 ? `${base}?page=${p}` : base)} label={`Pages of ${name}'s study sets`} />}
    </Page>
  );
}
