// The sign-in page's frame (/sign-in, /sign-up; the prototype's Login) and its skeleton (PLAN 14.15): full screen, the
// form's side with the logo, its heading and the switch between signing in and signing up, and on wide screens the
// campus with what it's like. The page fills the frame with Google's button and the form; the skeleton, loaded with
// the app, fills it with their shapes while the page's code arrives.
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Icon } from "#components/ui/Icon.tsx";
import type { IconName } from "#components/ui/Icon.tsx";
import { Loading, SkeletonBlock, SkeletonText } from "#components/ui/Skeleton.tsx";
import { CampusSketch } from "#features/landing/CampusSketch.tsx";
import { cx } from "#utils/cx.ts";

export type SignInMode = "sign-in" | "sign-up";

const WHAT_ITS_LIKE: [IconName, string][] = [
  ["building", "Your subjects become buildings on a campus, warming up as you study them."],
  ["bell", "A short timetable every day: two classes, picked for you from what you're learning."],
  ["cards", "Every question you get right becomes a player card. Remember it again and it levels up."],
];

const HEADINGS: Record<SignInMode, [string, string]> = {
  "sign-in": ["Welcome back", "Sign in to pick up where you left off."],
  "sign-up": ["Create your account", "It's free. Your progress is saved from your first class."],
};

export function SignInFrame({ mode, children }: { mode: SignInMode; children: ReactNode }) {
  const [title, subtitle] = HEADINGS[mode];
  return (
    <div className="grid min-h-dvh bg-mist text-ink md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-10">
        <Link to="/" className="flex w-fit items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          <img src="/images/logo.svg" alt="" width={32} height={31} className="size-8" />
          <span className="text-[17px] font-bold tracking-tight">RetainLearn</span>
        </Link>
        <div className="mx-auto my-auto w-full max-w-sm py-10">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-balance">{title}</h1>
          <p className="mt-1.5 text-sm text-ink/60">{subtitle}</p>
          <ModeSwitch mode={mode} />
          {children}
        </div>
        <Link to="/" className="mx-auto flex w-fit items-center gap-1.5 rounded-lg text-sm font-semibold text-ink/55 hover:text-ink focus-visible:outline-2 focus-visible:outline-brand">
          <Icon name="arrowLeft" className="size-4" /> Back to the home page
        </Link>
      </div>
      <aside className="hidden flex-col justify-center gap-8 bg-night px-10 py-12 text-white md:flex">
        <div className="rounded-[28px] bg-[#e6e9f6]">
          <CampusSketch className="mx-auto w-full max-w-md p-6" />
        </div>
        <ul className="space-y-4">
          {WHAT_ITS_LIKE.map(([icon, text]) => (
            <li key={icon} className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-bell">
                <Icon name={icon} className="size-5" />
              </span>
              <span className="pt-1.5 text-[15px] text-white/80">{text}</span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

// Signing in or signing up: two links (each form has its own address), the current one marked (guide: navbar). A
// link that asked for sign-in keeps its place to come back to (returnTo) either way.
function ModeSwitch({ mode }: { mode: SignInMode }) {
  const { state } = useLocation();
  const item = (to: SignInMode, label: string) => (
    <Link
      to={`/${to}`}
      replace
      state={state}
      aria-current={mode === to ? "page" : undefined}
      className={cx(
        "flex-1 rounded-[10px] px-2 py-1.5 text-center text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-brand",
        mode === to ? "bg-surface text-ink shadow-sm" : "text-ink/55 hover:text-ink",
      )}
    >
      {label}
    </Link>
  );
  return (
    <nav aria-label="Sign in or sign up" className="mt-6 flex rounded-xl bg-ink/[0.06] p-0.5">
      {item("sign-in", "Sign in")}
      {item("sign-up", "Sign up")}
    </nav>
  );
}

// The fields' look while the page's code arrives: Google's button, the divider, the form's fields and its button.
export function SignInSkeleton({ mode }: { mode: SignInMode }) {
  const fields = mode === "sign-in" ? ["Email or username", "Password"] : ["Name", "Username", "Email", "Password", "Confirm password"];
  return (
    <SignInFrame mode={mode}>
      <Loading label="Loading" className="mt-5">
        <SkeletonBlock className="mx-auto h-10 w-[320px] max-w-full rounded-full" />
        <div className="my-4 flex items-center gap-3 text-xs text-ink/40">
          <span className="h-px flex-1 bg-ink/10" />
          or with email
          <span className="h-px flex-1 bg-ink/10" />
        </div>
        <div className="space-y-4">
          {fields.map((label) => (
            <div key={label} className="space-y-1.5">
              <p className="text-sm font-semibold">{label}</p>
              <SkeletonBlock className="h-11 rounded-xl" />
            </div>
          ))}
          <SkeletonBlock className="h-11 rounded-xl" />
        </div>
        <p className="mt-4 text-center text-xs">
          <SkeletonText className="mx-auto w-64" />
        </p>
      </Loading>
    </SignInFrame>
  );
}
