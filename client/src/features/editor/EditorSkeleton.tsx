// The editor's skeleton (PLAN 14.15): loaded with the app, so the route shows it the moment the editor is opened,
// before the editor's own code arrives, and the editor shows it while the set and who you are load. Built from the
// editor's real frame: the heading's placeholders (and Details, signed in), the note for a guest or a reviewer (a
// contributor's is the same size), the tabs as they'll be
// (signed in, a reviewer's: most people editing a set wrote it) with the one in the address picked, then the
// flashcards' and quiz questions' search row and rows, or another tab's block.
import type { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { useSession } from "#app/session.ts";
import { buttonClass } from "#components/ui/Button.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { inputClass } from "#components/ui/Field.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { PageSkeleton } from "#components/ui/Page.tsx";
import { SkeletonBlock, SkeletonText } from "#components/ui/Skeleton.tsx";
import { TABLIST_CLASS, countClass, tabClass } from "#components/ui/Tabs.tsx";
import { cx } from "#utils/cx.ts";

export function EditorSkeleton() {
  const signedIn = useSession() !== "out";
  const [params] = useSearchParams();
  const tabs: [string, string, boolean][] = [
    ["flashcards", "Flashcards", true],
    ["questions", "Quiz questions", true],
    ...(signedIn
      ? ([
          ["review-queue", "Review queue", true],
          ["reviewers", "Reviewers", true],
        ] as [string, string, boolean][])
      : []),
    ["history", "History", false],
  ];
  const view = tabs.find(([value]) => value === params.get("view"))?.[0] ?? "flashcards";
  const list = view === "flashcards" || view === "questions";

  return (
    <PageSkeleton
      label="Loading the editor"
      width="max-w-4xl"
      actions={
        signedIn && (
          <span className={buttonClass("quiet", "sm")}>
            <Icon name="edit" className="size-4 shrink-0" />
            Details
          </span>
        )
      }
    >
      <div className="space-y-4">
        {signedIn ? (
          <RoleNote access="editor" />
        ) : (
          <GuestNote>
            <span className={buttonClass("primary", "sm")}>Sign in</span>
          </GuestNote>
        )}
        <div className={TABLIST_CLASS}>
          {tabs.map(([value, label, counted]) => (
            <span key={value} className={tabClass(value === view)}>
              {label}
              {counted && (
                <span className={countClass(value === view)}>
                  <SkeletonText className="w-2" />
                </span>
              )}
            </span>
          ))}
        </div>
        {list ? (
          <div className="space-y-3">
            <div className={cx("flex flex-col gap-2", view === "questions" ? "lg:flex-row lg:items-center" : "sm:flex-row sm:items-center")}>
              <span className={cx("relative block", view === "questions" ? "lg:flex-1" : "sm:flex-1")}>
                <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink/40" />
                <span className={cx(inputClass, "flex h-10 items-center pl-9 text-ink/40")}>
                  {view === "questions" ? "Search questions, answers and options" : "Search questions and answers"}
                </span>
              </span>
              {view === "questions" && (
                <span className="flex items-center gap-2 text-sm">
                  <span className="shrink-0 text-ink/55">Flashcard</span>
                  <span className={cx(inputClass, "block lg:w-60")}>All quiz questions</span>
                </span>
              )}
              {signedIn && (
                <span className={buttonClass("primary")}>
                  <Icon name="plus" className="size-4 shrink-0" />
                  <SkeletonText className="w-28" />
                </span>
              )}
            </div>
            <p className="text-xs">
              <SkeletonText className="w-60" />
            </p>
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <RowSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : (
          <SkeletonBlock className="h-40" />
        )}
      </div>
    </PageSkeleton>
  );
}

// A guest's note, with the way to sign in (children).
export function GuestNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-ink/[0.04] px-4 py-3 text-sm">
      <Icon name="lock" className="size-5 text-ink/50" />
      <p className="min-w-0 flex-1 basis-60 text-ink/70">
        <span className="font-semibold text-ink">Sign in to edit.</span> You can look at everything here, but saving or suggesting changes needs an account.
      </p>
      {children}
    </div>
  );
}

// What your changes do, as one of the set's reviewers or anyone else signed in: the same size either way.
export function RoleNote({ access }: { access: "editor" | "contributor" }) {
  const editor = access === "editor";
  return (
    <p className={cx("flex items-start gap-3 rounded-2xl px-4 py-3 text-sm", editor ? "bg-mint-wash text-mint-ink" : "bg-brand/[0.06] text-ink/75")}>
      <Icon name={editor ? "check" : "users"} className={cx("mt-0.5 size-4 shrink-0", editor ? "" : "text-brand")} />
      <span>
        <span className="font-semibold">{editor ? "You're a reviewer here:" : "Your changes are suggestions:"}</span>{" "}
        {editor ? "your changes go live at once." : "a reviewer here accepts or declines them."}
      </span>
    </p>
  );
}

// A flashcard or quiz question: its number, two lines of text and a chip, and its buttons.
function RowSkeleton() {
  return (
    <div className="rounded-2xl border border-ink/[0.07] bg-surface p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 gap-3">
          <SkeletonBlock className="size-8 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              <SkeletonText className="w-3/4" />
            </p>
            <p className="mt-0.5 text-[13px]">
              <SkeletonText className="w-1/2" />
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Chip>
                <SkeletonText className="w-20" />
              </Chip>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 self-end sm:self-start">
          <span className={buttonClass("quiet", "sm")}>
            <SkeletonText className="w-10" />
          </span>
        </div>
      </div>
    </div>
  );
}
