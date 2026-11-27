// Skill paths (/paths, the prototype's Directory "Paths" tab): study sets in order that add up to a skill. Search, a
// subject's (?subject=, from a subject's page), yours (?mine=1, signed in), 12 a page; each path's card says what it
// holds and, signed in, how far along it you are. The search, the filter and the page are in the address, as the
// subjects list's are. In 3D, a panel over the campus (D-20), as the subjects list.
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { PathListing } from "@retainlearn/core";
import { useSession } from "#app/session.ts";
import { Bar } from "#components/ui/Bar.tsx";
import { Button, buttonClass } from "#components/ui/Button.tsx";
import { cardClass, cardLinkClass } from "#components/ui/Card.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { Empty } from "#components/ui/Empty.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { Page } from "#components/ui/Page.tsx";
import { Pager, usePageHeading } from "#components/ui/Pager.tsx";
import { SearchInput } from "#components/ui/SearchInput.tsx";
import { Segmented } from "#components/ui/Segmented.tsx";
import { useWorld } from "#features/campus/view.ts";
import { DirectoryTabs } from "#features/subjects/DirectoryTabs.tsx";
import { LIST_HEADING, SEARCH_BOX, SUBJECTS_GRID, TOOLBAR } from "#features/subjects/SubjectsSkeleton.tsx";
import { cx } from "#utils/cx.ts";
import { pathPath } from "./pathView.ts";
import { useGetPathsQuery } from "./pathsApi.ts";
import { PATHS_DESCRIPTION, PATHS_FILTERS, PATHS_INTRO, PATHS_TITLE, PathListSkeleton, SUBJECT_CHIP, WHOSE_WIDTH, pathsHeading } from "./PathsSkeleton.tsx";

const plural = (n: number, word: string) => `${n.toLocaleString("en")} ${word}${n === 1 ? "" : "s"}`;
type Asked = { search: string; subject: string | null; mine: boolean; page: number };

// The list's address for a search, a filter and a page: what's left as it starts is left out.
function listParams({ search, subject, mine, page }: Asked): URLSearchParams {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (subject) params.set("subject", subject);
  if (mine) params.set("mine", "1");
  if (page > 1) params.set("page", String(page));
  return params;
}
const listHref = (asked: Asked): string => {
  const query = listParams(asked).toString();
  return query ? `/paths?${query}` : "/paths";
};

// "New path": the editor, or signing in first (and back to the editor after).
export function NewPathLink({ signedIn, className }: { signedIn: boolean; className?: string }) {
  return signedIn ? (
    <Link to="/paths/new" className={cx(buttonClass("primary"), className)}>
      <Icon name="plus" className="size-4 shrink-0" />
      New path
    </Link>
  ) : (
    <Link to="/sign-in" state={{ returnTo: "/paths/new" }} className={cx(buttonClass("primary"), className)}>
      <Icon name="plus" className="size-4 shrink-0" />
      New path
    </Link>
  );
}

export default function Paths() {
  const [params, setParams] = useSearchParams();
  const signedIn = useSession() === "in";
  const asked: Asked = {
    search: (params.get("search") ?? "").trim(),
    subject: params.get("subject"),
    mine: signedIn && params.get("mine") === "1",
    page: Math.min(10_000, Math.max(1, Math.floor(Number(params.get("page"))) || 1)),
  };
  const list = useGetPathsQuery(asked);
  const world = useWorld();
  const overWorld = world.shown && world.view.kind === "paths";
  const heading = usePageHeading(asked.page);

  // The box leads while you type, and follows the address when it changes from elsewhere; what's typed goes into the
  // address after a pause, back on page 1 (as the subjects list's search).
  const [typed, setTyped] = useState(asked.search);
  useEffect(() => setTyped((t) => (t.trim() === asked.search ? t : asked.search)), [asked.search]);
  useEffect(() => {
    if (typed.trim() === asked.search) return;
    const timer = setTimeout(() => setParams(listParams({ ...asked, search: typed.trim(), page: 1 }), { replace: true }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the typing, against the address's search
  }, [typed, asked.search]);

  const data = list.data;
  const title = pathsHeading(asked);
  return (
    <Page title={PATHS_TITLE.title} eyebrow={PATHS_TITLE.eyebrow} back={overWorld ? "/" : false} description={PATHS_DESCRIPTION} panel={overWorld ? "side" : undefined}>
      <DirectoryTabs />
      <p className={PATHS_INTRO}>Follow one, or build your own from study sets and the flashcards in them.</p>
      <div className={TOOLBAR}>
        <search className={SEARCH_BOX}>
          <form
            action="/paths"
            method="get"
            onSubmit={(e) => {
              e.preventDefault();
              setParams(listParams({ ...asked, search: typed.trim(), page: 1 }), { replace: true });
              (e.currentTarget.elements.namedItem("search") as HTMLInputElement | null)?.blur();
            }}
          >
            <SearchInput name="search" label="Search paths" value={typed} onChange={setTyped} maxLength={100} />
          </form>
        </search>
        <NewPathLink signedIn={signedIn} />
      </div>
      {(signedIn || asked.subject) && (
        <div className={PATHS_FILTERS}>
          {signedIn && (
            <Segmented
              label="Whose paths"
              items={[
                { value: "all", label: "All paths" },
                { value: "mine", label: "Yours" },
              ]}
              value={asked.mine ? "mine" : "all"}
              onChange={(value) => setParams(listParams({ ...asked, mine: value === "mine", page: 1 }), { replace: true })}
              className={WHOSE_WIDTH}
            />
          )}
          {asked.subject && (
            <Link
              to={listHref({ ...asked, subject: null, page: 1 })}
              aria-label={`In ${asked.subject}: show every subject's paths`}
              className={cx(SUBJECT_CHIP, "hover:bg-brand/12")}
            >
              In {asked.subject}
              <Icon name="x" className="size-3.5" />
            </Link>
          )}
        </div>
      )}

      {list.isError && !data ? (
        <div className="mt-6">
          <Empty icon="path" title="The paths didn't load" body="Check your connection, then try again." action={<Button tone="primary" onClick={() => void list.refetch()}>Try again</Button>} />
        </div>
      ) : !data ? (
        <PathListSkeleton />
      ) : (
        <section aria-labelledby="paths-list" className="mt-6">
          <h2 id="paths-list" ref={heading} tabIndex={-1} className={LIST_HEADING}>
            {title}
            {!list.isFetching && <span className="text-sm font-normal text-ink/50 tabular-nums">{data.total.toLocaleString("en")}</span>}
          </h2>
          <p role="status" className="sr-only">
            {asked.search && !list.isFetching ? `${plural(data.total, "path")} found` : ""}
          </p>
          {data.paths.length > 0 ? (
            <ul aria-busy={list.isFetching} className={cx(SUBJECTS_GRID, "transition-opacity", list.isFetching && "opacity-60")}>
              {data.paths.map((path) => (
                <li key={path._id}>
                  <PathCard path={path} mine={asked.mine} />
                </li>
              ))}
            </ul>
          ) : asked.search ? (
            <Empty icon="search" title={`Nothing matches “${asked.search}”`} body="Check the spelling, or make it a new path." action={<NewPathLink signedIn={signedIn} />} />
          ) : data.total > 0 ? (
            <Empty icon="path" title="This page is past the end" body={`There are ${plural(data.pages, "page")} of paths.`} action={<Link to={listHref({ ...asked, page: data.pages })} className={buttonClass("primary")}>Go to the last page</Link>} />
          ) : asked.mine ? (
            <Empty icon="path" title="You haven't made a path yet" body="Build one from study sets, or copy someone else's and change it." action={<NewPathLink signedIn={signedIn} />} />
          ) : (
            <Empty icon="path" title="No paths yet" body="Paths are ordered study sets that add up to a skill." action={<NewPathLink signedIn={signedIn} />} />
          )}
          <Pager page={asked.page} pages={data.pages} href={(p) => listHref({ ...asked, page: p })} label="Pages of paths" />
        </section>
      )}
    </Page>
  );
}

// A path (guide: card): its title links to its page, over the whole card. Chips for what's yours in it; its steps and
// flashcards, its subject and author; signed in, your steps done.
function PathCard({ path, mine }: { path: PathListing; mine: boolean }) {
  const you = path.you;
  const unlisted = path.visibility === "public" && !path.listed;
  return (
    <article className={cardClass}>
      <header className="flex items-start gap-2">
        <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
          <Icon name="path" className="size-4" />
        </span>
        <h3 className="min-w-0 flex-1 font-display text-lg leading-snug font-semibold text-balance">
          <Link to={pathPath(path._id)} data-card-link className={cardLinkClass}>
            {path.title}
          </Link>
        </h3>
      </header>
      {(you?.following || (you?.toReview ?? 0) > 0 || you?.isAuthor || path.visibility === "private" || (unlisted && (mine || you?.canEdit))) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {you?.following && <Chip tone="brand">Following</Chip>}
          {(you?.toReview ?? 0) > 0 && <Chip tone="bell">{`${you?.toReview} to review`}</Chip>}
          {you?.isAuthor && <Chip tone="mint">Yours</Chip>}
          {path.visibility === "private" && (
            <Chip tone="cold">
              <Icon name="lock" className="size-3" /> Private
            </Chip>
          )}
          {unlisted && (mine || you?.canEdit) && <Chip tone="orange">Not listed yet</Chip>}
        </div>
      )}
      {path.description && <p className="mt-1.5 line-clamp-2 text-sm text-pretty text-ink/65">{path.description}</p>}
      <p className="mt-1 text-xs text-ink/55">{`${plural(path.steps, "step")}, ${plural(path.flashcards, "flashcard")}, in ${path.category}${path.author ? `, by @${path.author.username}` : ""}`}</p>
      {you && path.steps > 0 && (
        <div className="mt-auto flex items-center gap-2 pt-3">
          <Bar value={you.done / path.steps} label={`Steps done in ${path.title}`} tone={you.done === path.steps ? "mint" : "brand"} className="h-1.5 flex-1" />
          <span className="text-xs text-ink/55 tabular-nums">{`${you.done}/${path.steps}`}</span>
        </div>
      )}
    </article>
  );
}
