// Every subject (/subjects, the prototype's Directory): search, 12 a page, each subject's counts, and a new subject.
// A signed-in player also sees which are on their campus, and can put one there. The search and the page are in the
// address, so a search can be shared and the back button comes back to it.
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { SUBJECT_NAME_MAX, SubjectName, daysSince } from "@retainlearn/core";
import type { SubjectListing, When } from "@retainlearn/core";
import { useSession } from "#app/session.ts";
import { Button, buttonClass } from "#components/ui/Button.tsx";
import { cardClass, cardLinkClass } from "#components/ui/Card.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { Empty } from "#components/ui/Empty.tsx";
import { Field, inputClass, schemaRule, useFieldErrors } from "#components/ui/Field.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { Page } from "#components/ui/Page.tsx";
import { Pager, usePageHeading } from "#components/ui/Pager.tsx";
import { SearchInput } from "#components/ui/SearchInput.tsx";
import { browserTimeZone, useCampus, useToday } from "#features/campus/campusApi.ts";
import { pennantOf, subjectPath } from "#features/campus/subjects.ts";
import { daysAgoInWords } from "#features/report-card/reportCardStats.ts";
import { cx } from "#utils/cx.ts";
import { problemOf } from "#api/problem.ts";
import { useWorld } from "#features/campus/view.ts";
import { useAddSubjectMutation, useGetSubjectsQuery } from "./subjectsApi.ts";
import { DirectoryTabs } from "./DirectoryTabs.tsx";
import { DIRECTORY_DESCRIPTION, DIRECTORY_TITLE, DirectorySkeleton, LIST_HEADING, SEARCH_BOX, SUBJECTS_GRID, TOOLBAR } from "./SubjectsSkeleton.tsx";

const plural = (n: number, word: string) => `${n.toLocaleString("en")} ${word}${n === 1 ? "" : "s"}`;
const NEW_SUBJECT = "new-subject";

// The directory's address for a search and a page: no search and page 1 are left out.
function directoryParams(search: string, page: number): URLSearchParams {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (page > 1) params.set("page", String(page));
  return params;
}
const directoryHref = (search: string, page: number): string => {
  const query = directoryParams(search, page).toString();
  return query ? `/subjects?${query}` : "/subjects";
};

type Notice = { tone: "done" | "failed"; text: string };

export default function Subjects() {
  const [params, setParams] = useSearchParams();
  const search = (params.get("search") ?? "").trim();
  const page = Math.min(10_000, Math.max(1, Math.floor(Number(params.get("page"))) || 1));
  const list = useGetSubjectsQuery({ search, page });
  const session = useSession();
  const signedIn = session === "in";
  // In 3D, the subjects list is a panel over the campus (D-20), the prototype's directory.
  const world = useWorld();
  const overWorld = world.shown && world.view.kind === "directory";
  const campus = useCampus(!signedIn);
  const when = useToday();
  const [addSubject] = useAddSubjectMutation();
  const [adding, setAdding] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const heading = usePageHeading(page);

  // The box leads while you type; it follows the address when that changes from elsewhere (the back button, a link),
  // so a space at the end of what you're typing isn't taken away.
  const [typed, setTyped] = useState(search);
  useEffect(() => setTyped((t) => (t.trim() === search ? t : search)), [search]);
  // What's typed goes into the address after a pause, back on page 1. Replaced, so the back button skips each letter.
  useEffect(() => {
    if (typed.trim() === search) return;
    const timer = setTimeout(() => setParams(directoryParams(typed.trim(), 1), { replace: true }), 300);
    return () => clearTimeout(timer);
  }, [typed, search, setParams]);

  const onCampus = signedIn && campus.data ? new Set(campus.data.subjects.map((s) => s.category)) : null;
  const add = async (name: string) => {
    setAdding(name);
    setNotice(null);
    try {
      const added = await addSubject({ name, tz: browserTimeZone() }).unwrap();
      setNotice({ tone: "done", text: `${added.name} is on your campus now.` });
    } catch (error) {
      setNotice({ tone: "failed", text: problemOf(error, `${name} wasn't added. Check your connection, then try again.`) });
    } finally {
      setAdding(null);
    }
  };
  const openNew = (name = "") => {
    setNewName(name);
    setNewOpen(true);
  };

  const data = list.data;
  return (
    <Page title={DIRECTORY_TITLE.title} eyebrow={DIRECTORY_TITLE.eyebrow} back={overWorld ? "/" : false} description={DIRECTORY_DESCRIPTION} panel={overWorld ? "side" : undefined}>
      <DirectoryTabs />
      <div className={TOOLBAR}>
        <search className={SEARCH_BOX}>
          <form
            action="/subjects"
            method="get"
            onSubmit={(e) => {
              e.preventDefault();
              setParams(directoryParams(typed.trim(), 1), { replace: true });
              (e.currentTarget.elements.namedItem("search") as HTMLInputElement | null)?.blur(); // the phone's keyboard goes
            }}
          >
            <SearchInput name="search" label="Search subjects" value={typed} onChange={setTyped} maxLength={100} />
          </form>
        </search>
        <Button tone="primary" icon="plus" aria-expanded={newOpen} aria-controls={NEW_SUBJECT} onClick={() => (newOpen ? setNewOpen(false) : openNew())}>
          New subject
        </Button>
      </div>
      {newOpen && <NewSubject key={newName} id={NEW_SUBJECT} initial={newName} signedIn={signedIn} />}
      <div role="status" className="mt-3 empty:hidden">
        {notice && <p className={notice.tone === "done" ? "rounded-2xl bg-mint-wash px-3.5 py-2.5 text-sm text-mint-ink" : "rounded-2xl bg-rose-wash px-3.5 py-2.5 text-sm text-rose-ink"}>{notice.text}</p>}
      </div>

      {list.isError && !data ? (
        <div className="mt-6">
          <Empty icon="layers" title="The subjects didn't load" body="Check your connection, then try again." action={<Button tone="primary" onClick={() => void list.refetch()}>Try again</Button>} />
        </div>
      ) : !data ? (
        <DirectorySkeleton />
      ) : (
        <section aria-labelledby="subjects-list" className="mt-6">
          <h2 id="subjects-list" ref={heading} tabIndex={-1} className={LIST_HEADING}>
            {search ? `Subjects matching “${search}”` : "All subjects"}
            {!list.isFetching && <span className="text-sm font-normal text-ink/50 tabular-nums">{data.total.toLocaleString("en")}</span>}
          </h2>
          <p role="status" className="sr-only">
            {search && !list.isFetching ? `${plural(data.total, "subject")} found` : ""}
          </p>
          {data.subjects.length > 0 ? (
            <ul aria-busy={list.isFetching} className={cx(SUBJECTS_GRID, "transition-opacity", list.isFetching && "opacity-60")}>
              {data.subjects.map((subject) => (
                <li key={subject.name}>
                  <SubjectCard
                    subject={subject}
                    when={when}
                    onCampus={onCampus ? onCampus.has(subject.name) : null}
                    adding={adding === subject.name}
                    onAdd={() => void add(subject.name)}
                  />
                </li>
              ))}
            </ul>
          ) : search ? (
            <Empty
              icon="search"
              title={`Nothing matches “${search}”`}
              body="Check the spelling, or start it as a new subject."
              action={
                <Button tone="primary" icon="plus" onClick={() => openNew(search)}>
                  {`New subject “${search}”`}
                </Button>
              }
            />
          ) : data.total > 0 ? (
            <Empty icon="layers" title="This page is past the end" body={`There are ${plural(data.pages, "page")} of subjects.`} action={<Link to={directoryHref(search, data.pages)} className={buttonClass("primary")}>Go to the last page</Link>} />
          ) : (
            <Empty icon="building" title="No subjects yet" body="Start the first: it becomes a building on your campus, with study sets inside." action={<Button tone="primary" icon="plus" onClick={() => openNew()}>New subject</Button>} />
          )}
          <Pager page={page} pages={data.pages} href={(p) => directoryHref(search, p)} label="Pages of subjects" />
        </section>
      )}
    </Page>
  );
}

// A subject (guide: card): its name links to its page, over the whole card; its pennant colour is the one it has on
// the campus. onCampus: whether it's on your campus, or null when signed out.
function SubjectCard({ subject, when, onCampus, adding, onAdd }: { subject: SubjectListing; when: When; onCampus: boolean | null; adding: boolean; onAdd: () => void }) {
  const empty = subject.flashcards === 0 && subject.questions === 0;
  return (
    <article className={cardClass}>
      <header className="flex items-center gap-2">
        <span aria-hidden="true" className="h-7 w-1.5 shrink-0 rounded-full" style={{ background: pennantOf(subject.name) }} />
        <h3 className="min-w-0 flex-1 font-display text-lg font-semibold text-balance">
          <Link to={subjectPath(subject.name)} data-card-link className={cardLinkClass}>
            {subject.name}
          </Link>
        </h3>
      </header>
      <p className="mt-1 text-xs text-ink/55">{`${plural(subject.sets, "study set")}, ${plural(subject.flashcards, "flashcard")}, ${plural(subject.questions, "question")}`}</p>
      {subject.updatedAt && <p className="text-xs text-ink/45">{`Updated ${daysAgoInWords(daysSince(subject.updatedAt, when))}`}</p>}
      {(empty || onCampus != null) && (
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
          {empty && <Chip tone="orange">Needs content</Chip>}
          {onCampus === true && (
            <Chip tone="mint">
              <Icon name="check" className="size-3" /> On your campus
            </Chip>
          )}
          {onCampus === false && (
            <Button size="sm" icon="plus" className="relative z-1" disabled={adding} onClick={onAdd}>
              {adding ? "Adding…" : "Add to campus"}
            </Button>
          )}
        </div>
      )}
    </article>
  );
}

// "New subject": its name, checked as you leave the field and on submit by the same rule the server uses. Created, it
// goes on your campus and its page opens, ready for its first study set. Signed out, the way to sign in instead.
function NewSubject({ id, initial, signedIn }: { id: string; initial: string; signedIn: boolean }) {
  const navigate = useNavigate();
  const [addSubject, { isLoading }] = useAddSubjectMutation();
  const form = useFieldErrors({ name: schemaRule(SubjectName) });
  if (!signedIn) {
    return (
      <div id={id} className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-brand/20 bg-brand/5 p-4 text-sm">
        <p className="min-w-0 flex-1 basis-56">Sign in to start a subject. It becomes a building on your campus, and you add study sets to it.</p>
        <Link to="/sign-in" state={{ returnTo: "/subjects" }} className={buttonClass("primary", "sm")}>
          Sign in
        </Link>
      </div>
    );
  }
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formElement = e.currentTarget;
    if (!form.check(formElement)) return;
    const name = String(new FormData(formElement).get("name") ?? "");
    try {
      const added = await addSubject({ name, tz: browserTimeZone() }).unwrap();
      navigate(subjectPath(added.name));
    } catch (error) {
      form.setError("name", problemOf(error, "The subject wasn't created. Check your connection, then try again."));
      (formElement.elements.namedItem("name") as HTMLInputElement | null)?.focus();
    }
  };
  return (
    <form id={id} noValidate onSubmit={(e) => void submit(e)} className="mt-3 rounded-2xl border border-brand/20 bg-brand/[0.04] p-4">
      <Field label="Subject name" hint="It becomes a building on your campus. You add study sets to it next." error={form.errors.name}>
        {({ id: inputId, describedBy }) => (
          <div className="flex flex-wrap gap-2">
            <input
              id={inputId}
              aria-describedby={describedBy}
              {...form.field("name")}
              defaultValue={initial}
              required
              maxLength={SUBJECT_NAME_MAX}
              autoComplete="off"
              enterKeyHint="go"
              placeholder="For example: Spanish"
              // Opened by "New subject", to type its name straight away.
              autoFocus
              className={cx(inputClass, "h-10 min-w-0 flex-1 basis-56")}
            />
            <Button type="submit" tone="primary" disabled={isLoading}>
              {isLoading ? "Creating…" : "Create subject"}
            </Button>
          </div>
        )}
      </Field>
    </form>
  );
}
