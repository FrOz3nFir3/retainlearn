// Your profile's skeleton (PLAN 14.15), and the parts of a profile's frame both profiles use: the card with who you
// are, a section's box, and a study set someone made. Loaded with the app, so /profile shows it the moment it's
// opened; your details come with the session, so the page itself only waits for the sets you made (their list's
// placeholder is here too).
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "#app/hooks.ts";
import { Avatar } from "#components/ui/Avatar.tsx";
import { buttonClass } from "#components/ui/Button.tsx";
import { cardClass, cardLinkClass } from "#components/ui/Card.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { Page, PageSkeleton } from "#components/ui/Page.tsx";
import { Loading, SkeletonBlock, SkeletonText } from "#components/ui/Skeleton.tsx";
import { selectCurrentUser } from "#features/authentication/state/authSlice.js";
import { setPath } from "#features/classes/modes.ts";
import { cx } from "#utils/cx.ts";
import type { AuthoredSet } from "./profileApi.ts";

export const SECTION = "rounded-2xl border border-ink/[0.07] bg-surface p-4";
export const SECTION_TITLE = "font-semibold";
export const SETS_GRID = "grid gap-3 sm:grid-cols-2 lg:grid-cols-3";

// Who someone is: their initials, name, username, a line under them, and what to do here.
export function IdentityCard({ name, username, detail, action }: { name: ReactNode; username: ReactNode; detail?: ReactNode; action?: ReactNode }) {
  return (
    <section aria-label="Who" className={cx(SECTION, "flex flex-wrap items-center gap-4")}>
      {typeof name === "string" ? <Avatar name={name} className="size-14 text-lg" /> : <SkeletonBlock className="size-14 shrink-0 rounded-full" />}
      <div className="min-w-0 flex-1">
        <p className="font-display text-xl font-semibold break-words">{name}</p>
        <p className="text-sm break-words text-ink/55">{username}</p>
        {detail && <p className="text-xs text-ink/45">{detail}</p>}
      </div>
      {action}
    </section>
  );
}

// The study sets someone made while they load: cards in a set's shape.
export function AuthoredSetsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Loading label="Loading the study sets" className={SETS_GRID}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cardClass}>
          <p className="text-xs">
            <SkeletonText className="w-32" />
          </p>
          <p className="mt-0.5 font-semibold">
            <SkeletonText className="w-40" />
          </p>
          <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
            <Chip>
              <SkeletonText className="w-20" />
            </Chip>
          </div>
        </div>
      ))}
    </Loading>
  );
}

export function ProfileSkeleton() {
  const user = useAppSelector(selectCurrentUser) as { name?: string; username?: string; email?: string } | null;
  const field = (label: string, hint?: string) => (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold">{label}</p>
      <SkeletonBlock className="h-11 rounded-xl" />
      {hint && <p className="text-xs text-ink/50">{hint}</p>}
    </div>
  );
  const body = (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <IdentityCard
          name={user?.name ?? <SkeletonText className="w-40" />}
          username={user?.username ? `@${user.username}` : <SkeletonText className="w-24" />}
          detail={user?.email ?? <SkeletonText className="w-48" />}
          action={<span className={buttonClass("quiet", "sm")}>Public view</span>}
        />
        <div className={cx(SECTION, "space-y-4")}>
          <p className={SECTION_TITLE}>Your details</p>
          {field("Name")}
          {field("Username", "Shown on the study sets you make, and in your public profile's address.")}
          {field("Email", "Only you see it.")}
          <div className="flex justify-end gap-2">
            <span className={buttonClass("quiet")}>Undo changes</span>
            <span className={buttonClass("primary")}>Save changes</span>
          </div>
        </div>
        <div className={SECTION}>
          <p className={SECTION_TITLE}>Display</p>
          <p className="mt-1 text-sm text-ink/55">System follows your device. Also in the menu under your initials.</p>
          <SkeletonBlock className="mt-3 h-8 max-w-xs rounded-xl" />
        </div>
        {/* Skills earned (paths/Skills.tsx): a chip's placeholder, as the section shows while your report card loads. */}
        <div className={SECTION}>
          <p className={SECTION_TITLE}>Skills earned</p>
          <SkeletonBlock className="mt-3 h-7 w-40 rounded-full" />
        </div>
      </div>
      <div className="space-y-4">
        <div className={SECTION}>
          <p className={SECTION_TITLE}>Connected accounts</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-ink/[0.03] px-3 py-2.5">
            <SkeletonBlock className="size-8 rounded-full" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Google</p>
              <p className="text-xs">
                <SkeletonText className="w-40" />
              </p>
            </div>
            <Chip>
              <SkeletonText className="w-16" />
            </Chip>
          </div>
        </div>
        <div className={SECTION}>
          <p className={SECTION_TITLE}>Data and privacy</p>
          <p className="mt-1 text-sm">
            <SkeletonText className="w-full" />
            <SkeletonText className="w-2/3" />
          </p>
          <p className="mt-3 text-xs">
            <SkeletonText className="w-56" />
          </p>
        </div>
        <div className={SECTION}>
          <p className={SECTION_TITLE}>Study sets you made</p>
          <div className="mt-3">
            <AuthoredSetsSkeleton count={2} />
          </div>
        </div>
      </div>
    </div>
  );
  return user?.name ? (
    <Page title={user.name} eyebrow="Your profile" back={false} actions={<span className={buttonClass("quiet", "sm")}><SkeletonText className="w-14" /></span>}>
      <Loading label="Loading your profile">{body}</Loading>
    </Page>
  ) : (
    <PageSkeleton label="Loading your profile" back={false} actions={<span className={buttonClass("quiet", "sm")}><SkeletonText className="w-14" /></span>}>
      {body}
    </PageSkeleton>
  );
}

const plural = (n: number, word: string) => `${n.toLocaleString("en")} ${word}${n === 1 ? "" : "s"}`;

// A study set someone made (guide: card): its subtopic links to its classroom, over the whole card.
export function AuthoredSetCard({ set }: { set: AuthoredSet }) {
  const empty = set.flashcards + set.questions === 0;
  return (
    <article className={cardClass}>
      <p className="text-xs text-ink/50">
        {set.category}, {set.topic}
      </p>
      <h3 className="mt-0.5 font-semibold text-balance">
        <Link to={setPath(set._id)} data-card-link className={cardLinkClass}>
          {set.subtopic}
        </Link>
      </h3>
      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
        {empty ? (
          <Chip tone="orange">No flashcards yet</Chip>
        ) : (
          <>
            <Chip>{plural(set.flashcards, "flashcard")}</Chip>
            <Chip>{plural(set.questions, "question")}</Chip>
          </>
        )}
      </div>
    </article>
  );
}
