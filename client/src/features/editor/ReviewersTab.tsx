// The set's reviewers (the prototype's ReviewersTab), for the reviewers themselves: who can change the set directly and
// decide on suggestions, a way to add someone (found by name, username or exact email), and to take someone off. The
// author is always one, and can't be taken off (the server says so).
import { useDeferredValue, useState } from "react";
import { useMyUsername } from "#app/hooks.ts";
import { problemOf } from "#api/problem.ts";
import { Avatar } from "#components/ui/Avatar.tsx";
import { Button } from "#components/ui/Button.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { Confirm } from "#components/ui/Confirm.tsx";
import { SearchInput } from "#components/ui/SearchInput.tsx";
import { useAddReviewerMutation, useFindPeopleQuery, useRemoveReviewerMutation } from "./editorApi.ts";
import type { Person } from "./editorApi.ts";
import type { Notice } from "./shared.ts";

type Props = { setId: string; reviewers: Person[]; onNotice: (notice: Notice) => void };

export function ReviewersTab({ setId, reviewers, onNotice }: Props) {
  const me = useMyUsername();
  const [search, setSearch] = useState("");
  const term = useDeferredValue(search.trim());
  const found = useFindPeopleQuery({ setId, search: term }, { skip: term.length < 2 });
  const [add, adding] = useAddReviewerMutation();
  const [remove] = useRemoveReviewerMutation();
  const [removing, setRemoving] = useState<Person | null>(null);
  const isReviewer = (username: string) => reviewers.some((r) => r.username === username);
  const people = (found.data?.users ?? []).filter((p) => !isReviewer(p.username));

  const addPerson = async (p: Person) => {
    try {
      await add({ setId, username: p.username }).unwrap();
      onNotice({ text: `${p.name || p.username} is a reviewer now: their changes apply at once, and they decide on suggestions.`, tone: "mint" });
      setSearch("");
    } catch (error) {
      onNotice({ text: problemOf(error, "That didn't go through. Check your connection and try again."), tone: "rose" });
    }
  };
  const removePerson = async (p: Person) => {
    try {
      await remove({ setId, username: p.username }).unwrap();
      onNotice({ text: p.username === me ? "You're no longer a reviewer of this set." : `${p.name || p.username} is no longer a reviewer.`, tone: "bell" });
    } catch (error) {
      onNotice({ text: problemOf(error, "That didn't go through. Check your connection and try again."), tone: "rose" });
    }
  };

  return (
    <div className="space-y-5">
      <section aria-labelledby="reviewers-title">
        <h2 id="reviewers-title" className="text-sm font-semibold">
          Reviewers
        </h2>
        <p className="mt-0.5 text-xs text-ink/55">They change the set directly, and accept or decline what others suggest.</p>
        <ul className="mt-2 divide-y divide-ink/[0.06] rounded-2xl border border-ink/[0.07] bg-surface">
          {reviewers.map((r) => (
            <li key={r.username} className="flex items-center gap-3 px-3 py-2.5">
              <Avatar name={r.name || r.username} className="size-8" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{r.name || r.username}</p>
                <p className="truncate text-xs text-ink/50">@{r.username}</p>
              </div>
              {r.username === me && <Chip tone="brand">You</Chip>}
              <Button size="sm" onClick={() => setRemoving(r)}>
                Remove<span className="sr-only"> {r.name || r.username}</span>
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="add-reviewer-title">
        <h2 id="add-reviewer-title" className="text-sm font-semibold">
          Add a reviewer
        </h2>
        <SearchInput label="Find someone to add" value={search} onChange={setSearch} placeholder="Name, username or email" className="mt-2" />
        <div aria-live="polite" className="mt-2">
          {term.length >= 2 && found.isSuccess && !people.length && <p className="text-sm text-ink/55">No one else matches "{term}".</p>}
          {found.isError && <p className="text-sm text-rose-ink">{problemOf(found.error, "The search didn't work. Try again.")}</p>}
        </div>
        {people.length > 0 && (
          <ul className="mt-1 divide-y divide-ink/[0.06] rounded-2xl border border-ink/[0.07] bg-surface">
            {people.map((p) => (
              <li key={p.username} className="flex items-center gap-3 px-3 py-2.5">
                <Avatar name={p.name || p.username} className="size-8" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name || p.username}</p>
                  <p className="truncate text-xs text-ink/50">@{p.username}</p>
                </div>
                <Button size="sm" tone="primary" icon="plus" disabled={adding.isLoading} onClick={() => void addPerson(p)}>
                  Add<span className="sr-only"> {p.name || p.username}</span>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {removing && (
        <Confirm
          title={removing.username === me ? "Stop being a reviewer?" : `Remove ${removing.name || removing.username}?`}
          confirmLabel="Remove"
          tone="danger"
          onConfirm={() => void removePerson(removing)}
          onClose={() => setRemoving(null)}
          body={
            <p>
              {removing.username === me
                ? "Your changes to this set will wait for review, like anyone's, and you won't decide on suggestions. Another reviewer can add you back."
                : "Their changes will wait for review, like anyone's. You can add them back."}
            </p>
          }
        />
      )}
    </div>
  );
}
