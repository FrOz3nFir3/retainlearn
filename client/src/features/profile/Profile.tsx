// Your profile (/profile; the prototype's Profile): who you are and a link to how others see you, your details to
// change (checked like signing up: the shared rules), the theme, your Google account (linked from a token Google gives
// this app, which the server checks with Google), the study sets you made, and your data and privacy. Your details
// come with the session; only the sets you made are fetched. Signed out, the way to sign in, and back here after.
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { AccountName, Email, Username } from "@retainlearn/core";
import { setColorScheme, useColorScheme } from "#app/colorScheme.ts";
import type { SchemeChoice } from "#app/colorScheme.ts";
import { useAppDispatch, useAppSelector } from "#app/hooks.ts";
import { useSession } from "#app/session.ts";
import { problemOf } from "#api/problem.ts";
import { Button, buttonClass } from "#components/ui/Button.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { Empty } from "#components/ui/Empty.tsx";
import { Field, inputClass, schemaRule, useFieldErrors } from "#components/ui/Field.tsx";
import { Page } from "#components/ui/Page.tsx";
import { Pager } from "#components/ui/Pager.tsx";
import { Segmented } from "#components/ui/Segmented.tsx";
import { selectCurrentUser, updateUserProfile } from "#features/authentication/state/authSlice.js";
import { GOOGLE_CLIENT_ID } from "#features/sign-in/GoogleSignIn.tsx";
import useLogout from "#hooks/useLogout.js";
import { AuthoredSetCard, AuthoredSetsSkeleton, IdentityCard, ProfileSkeleton, SECTION, SECTION_TITLE, SETS_GRID } from "./ProfileSkeleton.tsx";
import { useGetAuthoredSetsQuery, useUpdateProfileMutation } from "./profileApi.ts";
import { ProfileSkills } from "#features/paths/Skills.tsx";

type Me = { name: string; username: string; email: string; googleId?: string | null; joinedAt?: string };
// "joined November 2026", from when the account was made.
const joined = (at: string | undefined) => (at && !Number.isNaN(Date.parse(at)) ? `, joined ${new Date(at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}` : "");
type Notice = { tone: "done" | "failed"; text: string };
const THEMES: { value: SchemeChoice; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export default function Profile() {
  const session = useSession();
  const user = useAppSelector(selectCurrentUser) as Me | null;
  if (session === "out") {
    return (
      <Page title="Your profile" back={false}>
        <Empty
          icon="user"
          title="Sign in to see your profile"
          body="Your details, your study sets and your settings live here. Sign in and you'll come straight back."
          action={
            <Link to="/sign-in" state={{ returnTo: "/profile" }} className={buttonClass("primary")}>
              Sign in
            </Link>
          }
        />
      </Page>
    );
  }
  if (!user) return <ProfileSkeleton />;
  return <ProfileView user={user} />;
}

function ProfileView({ user }: { user: Me }) {
  const signOut = useLogout();
  return (
    <Page
      title={user.name}
      eyebrow="Your profile"
      back={false}
      noindex
      actions={
        <Button size="sm" icon="logout" onClick={() => void signOut()}>
          <span className="max-sm:sr-only">Sign out</span>
        </Button>
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <IdentityCard
            name={user.name}
            username={`@${user.username}`}
            detail={`${user.email}${joined(user.joinedAt)}`}
            action={
              <Link to={`/profile/${encodeURIComponent(user.username)}`} className={buttonClass("quiet", "sm")}>
                Public view
              </Link>
            }
          />
          <EditDetails user={user} />
          <Display />
          <ProfileSkills />
        </div>
        <div className="space-y-4">
          <ConnectedAccounts linked={Boolean(user.googleId)} />
          <DataAndPrivacy />
          {/* Last: its length is the one thing on the page that isn't known while it loads. */}
          <SetsYouMade username={user.username} />
        </div>
      </div>
    </Page>
  );
}

// Your name, username and email: only what changed is sent. A new username changes your public profile's address.
function EditDetails({ user }: { user: Me }) {
  const dispatch = useAppDispatch();
  const [update, { isLoading }] = useUpdateProfileMutation();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [formKey, setFormKey] = useState(0);
  const form = useFieldErrors({ name: schemaRule(AccountName), username: schemaRule(Username), email: schemaRule(Email) });
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNotice(null);
    if (!form.check(e.currentTarget)) return;
    const data = new FormData(e.currentTarget);
    const next = { name: String(data.get("name")).trim(), username: String(data.get("username")).trim(), email: String(data.get("email")).trim() };
    const changed = Object.fromEntries(Object.entries(next).filter(([key, value]) => value !== user[key as keyof typeof next]));
    if (!Object.keys(changed).length) return setNotice({ tone: "done", text: "Nothing to save: that's how it is already." });
    try {
      await update(changed).unwrap();
      dispatch(updateUserProfile(changed));
      setNotice({ tone: "done", text: "Saved." });
    } catch (error) {
      setNotice({ tone: "failed", text: problemOf(error, "Your details weren't saved. Check your connection, then try again.") });
    }
  };
  return (
    <form key={formKey} noValidate onSubmit={(e) => void submit(e)} className={`${SECTION} space-y-4`} aria-labelledby="details-title">
      <h2 id="details-title" className={SECTION_TITLE}>
        Your details
      </h2>
      <Field label="Name" error={form.errors.name}>
        {({ id, describedBy }) => <input id={id} aria-describedby={describedBy} {...form.field("name")} defaultValue={user.name} required maxLength={100} autoComplete="name" className={`${inputClass} h-11`} />}
      </Field>
      <Field label="Username" hint="Shown on the study sets you make, and in your public profile's address." error={form.errors.username}>
        {({ id, describedBy }) => (
          <input
            id={id}
            aria-describedby={describedBy}
            {...form.field("username")}
            defaultValue={user.username}
            required
            minLength={3}
            maxLength={30}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className={`${inputClass} h-11`}
          />
        )}
      </Field>
      <Field label="Email" hint="Only you see it." error={form.errors.email}>
        {({ id, describedBy }) => (
          <input id={id} aria-describedby={describedBy} {...form.field("email")} defaultValue={user.email} type="email" required autoComplete="email" autoCapitalize="none" spellCheck={false} className={`${inputClass} h-11`} />
        )}
      </Field>
      <div role="status" className="empty:hidden">
        {notice && <p className={notice.tone === "done" ? "rounded-2xl bg-mint-wash px-3.5 py-2.5 text-sm text-mint-ink" : "rounded-2xl bg-rose-wash px-3.5 py-2.5 text-sm text-rose-ink"}>{notice.text}</p>}
      </div>
      <div className="flex justify-end gap-2">
        <Button
          onClick={() => {
            setFormKey((k) => k + 1);
            form.reset();
            setNotice(null);
          }}
        >
          Undo changes
        </Button>
        <Button type="submit" tone="primary" disabled={isLoading}>
          {isLoading ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

// The theme, the same choice as the account menu's.
function Display() {
  const { choice } = useColorScheme();
  return (
    <section aria-labelledby="display-title" className={SECTION}>
      <h2 id="display-title" className={SECTION_TITLE}>
        Display
      </h2>
      <p className="mt-1 text-sm text-ink/55">System follows your device. Also in the menu under your initials.</p>
      <Segmented label="Theme" items={THEMES} value={choice} onChange={setColorScheme} className="mt-3 max-w-xs" />
    </section>
  );
}

// Google: linked, or a button to link it (Google asks you to pick the account, then the server checks it with Google).
function ConnectedAccounts({ linked }: { linked: boolean }) {
  return (
    <section aria-labelledby="accounts-title" className={SECTION}>
      <h2 id="accounts-title" className={SECTION_TITLE}>
        Connected accounts
      </h2>
      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-ink/[0.03] px-3 py-2.5">
        <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-surface text-sm font-bold text-[#4285F4] ring-1 ring-ink/10">
          G
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Google</p>
          <p className="text-xs text-ink/55">{linked ? "Sign in with Google any time." : "Link it to sign in with Google too."}</p>
        </div>
        {linked ? (
          <Chip tone="mint">Connected</Chip>
        ) : (
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <LinkGoogle />
          </GoogleOAuthProvider>
        )}
      </div>
    </section>
  );
}

function LinkGoogle() {
  const dispatch = useAppDispatch();
  const [update, { isLoading }] = useUpdateProfileMutation();
  const [problem, setProblem] = useState<string | null>(null);
  const link = useGoogleLogin({
    onSuccess: async (token) => {
      setProblem(null);
      try {
        const answer = await update({ googleAccessToken: token.access_token }).unwrap();
        if (answer.googleId) dispatch(updateUserProfile({ googleId: answer.googleId }));
      } catch (error) {
        setProblem(problemOf(error, "Google wasn't linked. Check your connection, then try again."));
      }
    },
    onError: () => setProblem("Google didn't finish. Try again."),
  });
  return (
    <>
      <Button size="sm" disabled={isLoading} onClick={() => link()}>
        {isLoading ? "Linking…" : "Link Google"}
      </Button>
      <p role="alert" className="w-full text-xs text-rose-ink empty:hidden">
        {problem}
      </p>
    </>
  );
}

// The study sets you made, newest first, a page at a time (the page in the address).
function SetsYouMade({ username }: { username: string }) {
  const [params] = useSearchParams();
  const page = Math.max(1, Math.floor(Number(params.get("page"))) || 1);
  const sets = useGetAuthoredSetsQuery({ username, page });
  return (
    <section aria-labelledby="made-title" className={SECTION}>
      <h2 id="made-title" className={SECTION_TITLE}>
        Study sets you made
      </h2>
      <div className="mt-3">
        {sets.isError ? (
          <p className="text-sm text-ink/55">They didn't load. Check your connection, then reload the page.</p>
        ) : !sets.data ? (
          <AuthoredSetsSkeleton count={2} />
        ) : sets.data.sets.length === 0 ? (
          <p className="text-sm text-ink/55">
            You haven't made one yet. Open any subject and use "New study set".{" "}
            <Link to="/subjects" className="font-semibold text-brand hover:underline">
              Browse subjects
            </Link>
          </p>
        ) : (
          <ul className={SETS_GRID.replace("lg:grid-cols-3", "lg:grid-cols-1 xl:grid-cols-2")}>
            {sets.data.sets.map((set) => (
              <li key={set._id}>
                <AuthoredSetCard set={set} />
              </li>
            ))}
          </ul>
        )}
      </div>
      {sets.data && <Pager page={page} pages={sets.data.pages} href={(p) => (p > 1 ? `/profile?page=${p}` : "/profile")} label="Pages of the study sets you made" />}
    </section>
  );
}

// What we keep and your rights over it (the Privacy Policy's), and how to ask for a copy or to delete your account.
function DataAndPrivacy() {
  return (
    <section aria-labelledby="data-title" className={SECTION}>
      <h2 id="data-title" className={SECTION_TITLE}>
        Data and privacy
      </h2>
      <p className="mt-1 text-sm text-pretty text-ink/60">
        For a copy of everything we keep about you, or to delete your account, email <strong className="font-semibold text-ink">hello@retainlearn.com</strong> from your
        account's address.
      </p>
      <p className="mt-3 text-xs text-ink/50">
        Read the{" "}
        <Link to="/privacy" className="font-medium text-brand hover:underline">
          Privacy Policy
        </Link>{" "}
        and the{" "}
        <Link to="/terms" className="font-medium text-brand hover:underline">
          Terms of Service
        </Link>
        .
      </p>
    </section>
  );
}
