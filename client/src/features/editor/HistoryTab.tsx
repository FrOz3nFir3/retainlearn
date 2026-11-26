// The set's history (today's change log): every saved change, newest first, with who made it and when, ten at a time
// with "Show older", and a search of what the changes say. Suggestions a reviewer accepted are marked as such.
import { useDeferredValue, useState } from "react";
import { problemOf } from "#api/problem.ts";
import { Button } from "#components/ui/Button.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { Empty } from "#components/ui/Empty.tsx";
import { SearchInput } from "#components/ui/SearchInput.tsx";
import { SkeletonBlock } from "#components/ui/Skeleton.tsx";
import { useGetHistoryInfiniteQuery } from "./editorApi.ts";
import { daysAgo } from "./shared.ts";

const SUGGESTED = /^Collaborative Edit: /;

export function HistoryTab({ setId }: { setId: string }) {
  const [search, setSearch] = useState("");
  const term = useDeferredValue(search.trim());
  const history = useGetHistoryInfiniteQuery({ setId, search: term });
  // A set with no history gets one empty entry back from today's endpoint: it's left out.
  const entries = history.data?.pages.flatMap((page) => page.logs).filter((entry) => entry._id && entry.summary) ?? [];

  return (
    <div className="space-y-3">
      <SearchInput label="Search the history" value={search} onChange={setSearch} placeholder="Search what changed" />
      {history.isLoading ? (
        <SkeletonBlock className="h-40" />
      ) : history.isError ? (
        <Empty icon="x" title="The history didn't load" body={problemOf(history.error, "Check your connection, then open this tab again.")} />
      ) : !entries.length ? (
        <Empty icon="clock" title={term ? `No changes match "${term}"` : "No changes yet"} body={term ? "The search looks at each change's summary." : undefined} />
      ) : (
        <ol className="space-y-2">
          {entries.map((entry) => {
            const suggested = SUGGESTED.test(entry.summary);
            return (
              <li key={entry._id} className="rounded-2xl border border-ink/[0.07] bg-surface p-3">
                <p className="text-sm">{entry.summary.replace(SUGGESTED, "")}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink/50">
                  <span>
                    {entry.user.name || "A deleted account"}
                    {entry.user.username && ` (@${entry.user.username})`}, {daysAgo(entry.timestamp)}
                  </span>
                  {suggested && <Chip tone="bell">Suggested, then accepted</Chip>}
                  {entry.eventType === "created" && <Chip tone="mint">Created the set</Chip>}
                </p>
              </li>
            );
          })}
        </ol>
      )}
      {history.hasNextPage && (
        <Button disabled={history.isFetchingNextPage} onClick={() => void history.fetchNextPage()}>
          {history.isFetchingNextPage ? "Loading…" : "Show older"}
        </Button>
      )}
    </div>
  );
}
