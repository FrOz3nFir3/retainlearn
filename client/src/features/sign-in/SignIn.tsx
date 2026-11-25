// Signing in and signing up (/sign-in, /sign-up; the prototype's Login), in their frame (SignInSkeleton.tsx). The
// address says which form, so each can be linked. Google's button signs in with Google; the forms check what's typed
// with the shared rules (@retainlearn/core), the server's own (guide: forms: errors once you leave a field, focus to
// the first wrong one on submit), and say what the server says when it refuses. After three refusals, how to get help.
// Signed in, you go where the link that asked for it said (a returnTo in its state, this site's pages only), else to
// your campus; someone already signed in goes straight there.
import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AccountName, Email, NewPassword, PASSWORD_HINT, SignInBody, Username } from "@retainlearn/core";
import { useAppDispatch, useSignedIn } from "#app/hooks.ts";
import { usePostGoogleLoginMutation, usePostLoginUserMutation, usePostRegisterUserMutation } from "#api/apiSlice.js";
import { problemOf } from "#api/problem.ts";
import { Button } from "#components/ui/Button.tsx";
import { Field, inputClass, schemaRule, useFieldErrors } from "#components/ui/Field.tsx";
import { PasswordInput } from "#components/ui/PasswordInput.tsx";
import { initialUser } from "#features/authentication/state/authSlice.js";
import { setSessionStatus } from "#utils/session.js";
import { GoogleSignIn } from "./GoogleSignIn.tsx";
import { SignInFrame } from "./SignInSkeleton.tsx";
import type { SignInMode } from "./SignInSkeleton.tsx";

// Where to go once signed in: the page that sent you here, if it's a page of this site, else the campus.
const returnPath = (state: unknown): string => {
  const to = (state as { returnTo?: unknown } | null)?.returnTo;
  return typeof to === "string" && to.startsWith("/") && !to.startsWith("//") ? to : "/";
};
const HELP_AFTER = 3;

export default function SignIn({ mode }: { mode: SignInMode }) {
  const signedIn = useSignedIn();
  const navigate = useNavigate();
  const { state } = useLocation();
  const goTo = returnPath(state);
  const dispatch = useAppDispatch();
  const [refusals, setRefusals] = useState(0);
  const [googleProblem, setGoogleProblem] = useState<string | null>(null);
  const [signInWithGoogle] = usePostGoogleLoginMutation();
  useEffect(() => {
    if (signedIn) navigate(goTo, { replace: true });
  }, [signedIn, navigate, goTo]);

  // The server's answer to a sign-in or sign-up: the account, and the session in its cookies.
  const enter = (user: unknown) => {
    dispatch(initialUser(user));
    setSessionStatus(true);
  };
  const refused = () => setRefusals((n) => n + 1);
  const google = async (credential: string) => {
    setGoogleProblem(null);
    try {
      enter(await signInWithGoogle({ credential }).unwrap());
    } catch (error) {
      refused();
      setGoogleProblem(problemOf(error, "Signing in with Google didn't work. Check your connection, then try again."));
    }
  };

  return (
    <SignInFrame mode={mode}>
      <div className="mt-5">
        <GoogleSignIn onCredential={(credential) => void google(credential)} onFailure={refused} />
        <div role="alert" className="empty:hidden">
          {googleProblem && <p className="mt-3 rounded-2xl bg-rose-wash px-3.5 py-2.5 text-sm text-rose-ink">{googleProblem}</p>}
        </div>
        <div className="my-4 flex items-center gap-3 text-xs text-ink/40">
          <span className="h-px flex-1 bg-ink/10" />
          or with email
          <span className="h-px flex-1 bg-ink/10" />
        </div>
        {mode === "sign-in" ? <SignInForm onEnter={enter} onRefused={refused} /> : <SignUpForm onEnter={enter} onRefused={refused} />}
        {refusals >= HELP_AFTER && (
          <p className="mt-4 rounded-2xl bg-bell-wash px-3.5 py-3 text-sm text-bell-ink">
            Having trouble? Email us at <strong className="font-semibold">hello@retainlearn.com</strong> and we'll help you in.
          </p>
        )}
        {goTo !== "/" && <p className="mt-4 text-center text-xs text-ink/50">You'll go straight back to where you were.</p>}
        <p className="mt-4 text-center text-xs leading-relaxed text-ink/50">
          By continuing, you agree to our{" "}
          <Link to="/terms" className="font-medium text-brand hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="font-medium text-brand hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </SignInFrame>
  );
}

type FormProps = { onEnter: (user: unknown) => void; onRefused: () => void };

// A form's way of saying the server refused it: one message, read out as it appears.
function Refusal({ text }: { text: string | null }) {
  return <div role="alert" className="empty:hidden">{text && <p className="rounded-2xl bg-rose-wash px-3.5 py-2.5 text-sm text-rose-ink">{text}</p>}</div>;
}

function SubmitButton({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <Button type="submit" tone="primary" disabled={busy} className="h-11 w-full">
      {children}
    </Button>
  );
}

function SignInForm({ onEnter, onRefused }: FormProps) {
  const [signIn, { isLoading }] = usePostLoginUserMutation();
  const [problem, setProblem] = useState<string | null>(null);
  const [forgot, setForgot] = useState(false);
  const form = useFieldErrors({ loginIdentifier: schemaRule(SignInBody.shape.loginIdentifier), password: schemaRule(SignInBody.shape.password) });
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProblem(null);
    if (!form.check(e.currentTarget)) return;
    const data = new FormData(e.currentTarget);
    try {
      onEnter(await signIn({ loginIdentifier: String(data.get("loginIdentifier")).trim(), password: String(data.get("password")) }).unwrap());
    } catch (error) {
      onRefused();
      setProblem(problemOf(error, "Signing in didn't work. Check your connection, then try again."));
    }
  };
  return (
    <form noValidate onSubmit={(e) => void submit(e)} className="space-y-4">
      <Field label="Email or username" error={form.errors.loginIdentifier}>
        {({ id, describedBy }) => (
          <input
            id={id}
            aria-describedby={describedBy}
            {...form.field("loginIdentifier")}
            required
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
            className={`${inputClass} h-11`}
          />
        )}
      </Field>
      <Field label="Password" error={form.errors.password}>
        {({ id, describedBy }) => <PasswordInput id={id} aria-describedby={describedBy} {...form.field("password")} required autoComplete="current-password" enterKeyHint="go" />}
      </Field>
      <div className="-mt-1 text-sm">
        <button type="button" aria-expanded={forgot} onClick={() => setForgot((f) => !f)} className="cursor-pointer font-semibold text-brand hover:underline">
          Forgot your password?
        </button>
        {forgot && <p className="mt-1 text-ink/60">Email hello@retainlearn.com from your account's address and we'll set you up again. Or continue with Google, if it's the same email.</p>}
      </div>
      <Refusal text={problem} />
      <SubmitButton busy={isLoading}>{isLoading ? "Signing in…" : "Sign in"}</SubmitButton>
    </form>
  );
}

function SignUpForm({ onEnter, onRefused }: FormProps) {
  const [signUp, { isLoading }] = usePostRegisterUserMutation();
  const [problem, setProblem] = useState<string | null>(null);
  const password = useRef<HTMLInputElement>(null);
  const form = useFieldErrors({
    name: schemaRule(AccountName),
    username: schemaRule(Username),
    email: schemaRule(Email),
    password: schemaRule(NewPassword),
    confirmPassword: (value: string) => (!value ? "Type your password again." : value !== password.current?.value ? "The two passwords don't match." : null),
  });
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProblem(null);
    if (!form.check(e.currentTarget)) return;
    const data = new FormData(e.currentTarget);
    const text = (name: string) => String(data.get(name) ?? "");
    try {
      onEnter(
        await signUp({ name: text("name").trim(), username: text("username").trim(), email: text("email").trim(), password: text("password"), confirmPassword: text("confirmPassword") }).unwrap(),
      );
    } catch (error) {
      onRefused();
      setProblem(problemOf(error, "Your account wasn't created. Check your connection, then try again."));
    }
  };
  return (
    <form noValidate onSubmit={(e) => void submit(e)} className="space-y-4">
      <Field label="Name" error={form.errors.name}>
        {({ id, describedBy }) => <input id={id} aria-describedby={describedBy} {...form.field("name")} required maxLength={100} autoComplete="name" enterKeyHint="next" className={`${inputClass} h-11`} />}
      </Field>
      <Field label="Username" hint="Shown on the study sets you make. Letters, numbers and underscores." error={form.errors.username}>
        {({ id, describedBy }) => (
          <input
            id={id}
            aria-describedby={describedBy}
            {...form.field("username")}
            required
            minLength={3}
            maxLength={30}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
            className={`${inputClass} h-11`}
          />
        )}
      </Field>
      <Field label="Email" hint="Only you see it." error={form.errors.email}>
        {({ id, describedBy }) => (
          <input id={id} aria-describedby={describedBy} {...form.field("email")} type="email" required autoComplete="email" autoCapitalize="none" spellCheck={false} enterKeyHint="next" className={`${inputClass} h-11`} />
        )}
      </Field>
      <Field label="Password" hint={PASSWORD_HINT} error={form.errors.password}>
        {({ id, describedBy }) => <PasswordInput ref={password} id={id} aria-describedby={describedBy} {...form.field("password")} required minLength={10} autoComplete="new-password" enterKeyHint="next" />}
      </Field>
      <Field label="Confirm password" error={form.errors.confirmPassword}>
        {({ id, describedBy }) => <PasswordInput id={id} aria-describedby={describedBy} {...form.field("confirmPassword")} required autoComplete="new-password" enterKeyHint="go" />}
      </Field>
      <Refusal text={problem} />
      <SubmitButton busy={isLoading}>{isLoading ? "Creating your account…" : "Create account"}</SubmitButton>
    </form>
  );
}
