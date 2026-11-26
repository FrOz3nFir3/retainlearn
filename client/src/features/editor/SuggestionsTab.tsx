// The review queue (the prototype's QueueTab): changes suggested by people who aren't the set's reviewers, oldest
// first, each with who suggested it and when, what it changes (before and after, each part of it), and how long it
// waits before it lapses. The set's reviewers accept or decline each; anyone else signed in can follow them.
import { useState } from "react";
import type { ReactNode } from "react";
import { useMyUsername } from "#app/hooks.ts";
import { problemOf } from "#api/problem.ts";
import { Button } from "#components/ui/Button.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import type { ChipTone } from "#components/ui/Chip.tsx";
import { Confirm } from "#components/ui/Confirm.tsx";
import { Empty } from "#components/ui/Empty.tsx";
import { RichText } from "#components/ui/RichText.tsx";
import { SkeletonBlock } from "#components/ui/Skeleton.tsx";
import { textOf } from "#utils/safeHtml.ts";
import { useAcceptSuggestionMutation, useGetSuggestionsQuery, useRejectSuggestionMutation } from "./editorApi.ts";
import type { SuggestedChange, Suggestion } from "./editorApi.ts";
import { clip, daysAgo, plural } from "./shared.ts";
import type { Access, Notice } from "./shared.ts";

type Props = { setId: string; access: Exclude<Access, "guest">; onNotice: (notice: Notice) => void };

// The queue's names for what changed, in the editor's words.
const FIELDS: Record<string, string> = {
  "Main Topic": "Topic",
  "main-topic": "Topic",
  "Sub Topic": "Subtopic",
  "sub-topic": "Subtopic",
  Category: "Subject",
  category: "Subject",
  Description: "Description",
  description: "Description",
  Flashcard: "Flashcard",
  "Flashcard Question": "Flashcard's question",
  "Flashcard Answer": "Flashcard's answer",
  "New Flashcard": "New flashcard",
  Quiz: "Quiz question",
  "Quiz Question": "Question",
  "Quiz Answer": "Correct answer",
  "Quiz Option": "Wrong option",
  "New Quiz Option": "New wrong option",
  "Quiz Minimum Options": "Fewest options",
  "Quiz Flashcard Association": "Linked flashcard",
  "New Quiz": "New quiz question",
  "Flashcard Order": "Order of the flashcards",
  "Quiz Order": "Order of the quiz questions",
};
const fieldName = (field: string): string =>
  FIELDS[field] ?? field.replace(/^Quiz Option (\d+)$/, "Wrong option $1").replace(/^(\d+) Fields$/, "$1 details");

const KIND: Record<SuggestedChange["changeType"], [string, ChipTone]> = {
  edit: ["Change", "brand"],
  addition: ["Addition", "mint"],
  deletion: ["Deletion", "rose"],
};

export function SuggestionsTab({ setId, access, onNotice }: Props) {
  const me = useMyUsername();
  const suggestions = useGetSuggestionsQuery(setId);
  const [accept] = useAcceptSuggestionMutation();
  const [reject] = useRejectSuggestionMutation();
  const [busy, setBusy] = useState<string | null>(null);
  const [declining, setDeclining] = useState<Suggestion | null>(null);

  const decide = async (s: Suggestion, how: "accept" | "decline") => {
    setBusy(s._id);
    const who = s.submittedBy.name || s.submittedBy.username || "someone";
    try {
      await (how === "accept" ? accept : reject)({ setId, suggestionId: s._id }).unwrap();
      onNotice({ text: how === "accept" ? `Accepted ${who}'s suggestion. It's live now.` : `Declined ${who}'s suggestion.`, tone: how === "accept" ? "mint" : "bell" });
    } catch (error) {
      onNotice({ text: problemOf(error, "That didn't go through. Check your connection and try again."), tone: "rose" });
    } finally {
      setBusy(null);
    }
  };

  if (suggestions.isLoading) return <SkeletonBlock className="h-40" />;
  if (suggestions.isError) return <Empty icon="x" title="The review queue didn't load" body="Check your connection, then open this tab again." />;
  const list = suggestions.data ?? [];

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink/55">
        {access === "editor"
          ? "Changes from people who aren't reviewers of this set wait here until you or another reviewer accepts or declines them. Any left undecided lapses after a while."
          : "Changes suggested by people who aren't reviewers of this set wait here until a reviewer accepts or declines them. Any left undecided lapses after a while."}
      </p>
      {!list.length && <Empty icon="inbox" title="Nothing waiting for review" body="Suggested changes to this set show up here." />}
      <ul className="space-y-3">
        {list.map((s) => {
          const [kind, tone] = KIND[s.changeType] ?? KIND.edit;
          const changes = s.metadata?.individualChanges?.length ? s.metadata.individualChanges : [s];
          const about = textOf(s.metadata?.flashcardQuestion ?? s.metadata?.quizQuestion ?? "");
          const left = Math.max(0, Math.ceil((Date.parse(s.expiresAt) - Date.now()) / 864e5));
          const mine = !!me && s.submittedBy.username === me;
          return (
            <li key={s._id} className="rounded-2xl border border-ink/[0.07] bg-surface p-3 sm:p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Chip tone={tone}>{kind}</Chip>
                <p className="min-w-0 flex-1 text-sm font-semibold">{fieldName(s.field)}</p>
                {mine && <Chip tone="bell">Yours</Chip>}
              </div>
              {about && <p className="mt-1 text-sm text-ink/60">{clip(about, 140)}</p>}
              <p className="mt-1 text-xs text-ink/50">
                {s.submittedBy.name || "A deleted account"}
                {s.submittedBy.username && ` (@${s.submittedBy.username})`}, {daysAgo(s.submittedAt)}. Lapses in {plural(left, "day")}.
              </p>
              <details className="mt-2 group">
                <summary className="cursor-pointer text-xs font-semibold text-brand hover:underline">
                  {changes.length === 1 ? "See the change" : `See the ${changes.length} changes`}
                </summary>
                <ol className="mt-2 space-y-3">
                  {changes.map((c, i) => (
                    <li key={i}>
                      <ChangeView change={c} />
                    </li>
                  ))}
                </ol>
              </details>
              {access === "editor" && (
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <Button size="sm" disabled={busy === s._id} onClick={() => setDeclining(s)}>
                    Decline
                  </Button>
                  <Button size="sm" tone="primary" icon="check" disabled={busy === s._id} onClick={() => void decide(s, "accept")}>
                    Accept
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {declining && (
        <Confirm
          title="Decline this suggestion?"
          confirmLabel="Decline"
          tone="danger"
          onConfirm={() => void decide(declining, "decline")}
          onClose={() => setDeclining(null)}
          body={<p>It's taken out of the queue and the set stays as it is.</p>}
        />
      )}
    </div>
  );
}

// One change: before and after, each part of a whole flashcard or question on its own, or the order as a list.
function ChangeView({ change }: { change: SuggestedChange }) {
  const before = partsOf(change.oldValue, change.oldDisplayText);
  const after = partsOf(change.newValue, change.newDisplayText);
  return (
    <div className="rounded-xl bg-ink/[0.03] p-3">
      <p className="text-xs font-semibold text-ink/70">{fieldName(change.field)}</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {change.changeType !== "addition" && before.length > 0 && <Side title="Before">{before}</Side>}
        {change.changeType !== "deletion" && after.length > 0 && <Side title={change.changeType === "addition" ? "Added" : "After"}>{after}</Side>}
      </div>
    </div>
  );
}

function Side({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0">
      <h3 className="mb-1 text-[11px] font-semibold text-ink/50">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

// A value as the queue keeps it: HTML or plain text; a whole flashcard or question (its parts); or a new order (a
// list of ids, so its display text, one line per place, is shown instead).
function partsOf(value: unknown, display: string | undefined): ReactNode[] {
  if (Array.isArray(value) || value == null || value === "") return display ? [<p key="d" className="text-sm whitespace-pre-line text-ink/75">{display}</p>] : [];
  if (typeof value !== "object") return [<RichText key="v" html={String(value)} className="!text-sm" />];
  const v = value as Record<string, unknown>;
  const parts: [string, unknown][] = [
    ["Question", v.question ?? v.quizQuestion],
    [v.quizAnswer !== undefined ? "Correct answer" : "Answer", v.answer ?? v.quizAnswer],
    ...(Array.isArray(v.options) ? v.options.map((o, i): [string, unknown] => [`Wrong option ${i + 1}`, typeof o === "object" && o ? (o as { value?: unknown }).value : o]) : []),
  ];
  return parts
    .filter(([, html]) => typeof html === "string" && html)
    .map(([label, html]) => (
      <div key={label}>
        <p className="text-[11px] text-ink/45">{label}</p>
        <RichText html={html as string} className="!text-sm" />
      </div>
    ));
}
