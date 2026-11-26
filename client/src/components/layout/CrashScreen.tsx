// What the app shows if a screen crashes, instead of a blank page: what happened in a line, and the two ways on,
// reloading (which fixes most, such as a page whose code changed in a release since it opened) or the home page. In
// development, the error and where it came from too. A class component: React catches errors only in one of those.
import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { buttonClass } from "#components/ui/Button.tsx";
import { Icon } from "#components/ui/Icon.tsx";

type State = { error: Error | null; stack: string | null };

export class CrashScreen extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, stack: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ stack: info.componentStack ?? null });
    if (import.meta.env.DEV) console.error("A screen crashed:", error, info);
  }

  render() {
    const { error, stack } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="grid min-h-dvh place-items-center bg-mist p-4 text-ink">
        <div role="alert" className="panel w-full max-w-lg bg-surface p-6 text-center sm:p-8">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-rose-wash text-rose-ink">
            <Icon name="x" className="size-7" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm text-ink/65">This page hit an error. Reloading it usually fixes that.</p>
          {import.meta.env.DEV && (
            <details className="mt-4 rounded-xl bg-ink/[0.04] p-3 text-left text-xs">
              <summary className="cursor-pointer font-semibold">{error.message}</summary>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-ink/60">{stack}</pre>
            </details>
          )}
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <button type="button" className={buttonClass("primary")} onClick={() => window.location.reload()}>
              Reload the page
            </button>
            <a href="/" className={buttonClass("quiet")}>
              Go to the home page
            </a>
          </div>
        </div>
      </div>
    );
  }
}
