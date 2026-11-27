// A study set's editor (/study-sets/:id/edit; P2-09, the prototype's Tools screen, on today's endpoints): its
// flashcards, its quiz questions, the review queue, its reviewers and its history, as tabs (?view=), with the set's
// details behind a button. What you can do depends on who you are: the set's reviewers (its author is one) save at
// once; anyone else signed in suggests changes, which wait in the review queue; a guest can look. Each action's
// result shows above the tabs until it's dismissed. While the set and who you are load, its skeleton.
import { useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import type { StudySetContent } from "@retainlearn/core";
import { useSession } from "#app/session.ts";
import { Button, buttonClass } from "#components/ui/Button.tsx";
import { Empty } from "#components/ui/Empty.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { IconButton } from "#components/ui/IconButton.tsx";
import { Page } from "#components/ui/Page.tsx";
import { TabPanel, Tabs, useTabsId } from "#components/ui/Tabs.tsx";
import type { TabItem } from "#components/ui/Tabs.tsx";
import { useGetProgressQuery, useGetStudySetQuery } from "#features/classroom/classroomApi.ts";
import { setPath } from "#features/classes/modes.ts";
import { cx } from "#utils/cx.ts";
import { DetailsDialog } from "./DetailsDialog.tsx";
import { EditorSkeleton, GuestNote, RoleNote } from "./EditorSkeleton.tsx";
import { FlashcardsTab } from "./FlashcardsTab.tsx";
import { HistoryTab } from "./HistoryTab.tsx";
import { QuestionsTab } from "./QuestionsTab.tsx";
import { ReviewersTab } from "./ReviewersTab.tsx";
import { SuggestionsTab } from "./SuggestionsTab.tsx";
import { useGetReviewersQuery, useGetSuggestionsQuery } from "./editorApi.ts";
import type { Person } from "./editorApi.ts";
import { clip } from "./shared.ts";
import type { Access, Notice } from "./shared.ts";

type View = "flashcards" | "questions" | "review-queue" | "reviewers" | "history";

export default function Editor() {
  const { id = "" } = useParams();
  const session = useSession();
  const signedIn = session === "in";
  const set = useGetStudySetQuery(id);
  // Whether you're one of the set's reviewers, as your progress in it says; only they fetch the list (anyone else is
  // refused it).
  const progress = useGetProgressQuery(id, { skip: !signedIn });
  const reviewer = progress.data ? progress.data.reviewer === true : progress.isError ? false : null;
  const reviewers = useGetReviewersQuery(id, { skip: reviewer !== true });
  const access: Access | null =
    session === "out" ? "guest" : !signedIn || reviewer === null ? null : !reviewer ? "contributor" : reviewers.isSuccess ? "editor" : reviewers.isError ? "contributor" : null;

  if (set.isError) {
    return (
      <Page title="Not found" back="/subjects">
        <Empty icon="x" title="This study set isn't here" body="It may have been deleted, or the link is wrong." action={<Link to="/subjects" className={buttonClass("primary")}>Find a set</Link>} />
      </Page>
    );
  }
  if (!set.data || !access) return <EditorSkeleton />;
  return <EditorView set={set.data} access={access} reviewers={reviewers.data ?? []} />;
}

const TONES: Record<Notice["tone"], string> = {
  mint: "bg-mint-wash text-mint-ink",
  bell: "bg-bell-wash text-bell-ink",
  rose: "bg-rose-wash text-rose-ink",
};

function EditorView({ set, access, reviewers }: { set: StudySetContent; access: Access; reviewers: Person[] }) {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const tabsId = useTabsId();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [details, setDetails] = useState(false);
  const suggestions = useGetSuggestionsQuery(set._id, { skip: access === "guest" });

  const tabs: TabItem<View>[] = [
    { value: "flashcards", label: "Flashcards", count: set.flashcards.length },
    { value: "questions", label: "Quiz questions", count: set.questions.length },
    ...(access !== "guest" ? [{ value: "review-queue" as const, label: "Review queue", count: suggestions.data?.length ?? 0 }] : []),
    ...(access === "editor" ? [{ value: "reviewers" as const, label: "Reviewers", count: reviewers.length }] : []),
    { value: "history", label: "History" },
  ];
  const asked = params.get("view");
  const view = tabs.find((t) => t.value === asked)?.value ?? "flashcards";
  const pick = (next: View) => {
    setNotice(null);
    setParams(
      (p) => {
        const out = new URLSearchParams(p);
        out.set("view", next);
        out.delete("flashcard"); // the questions' filter belongs to the link that set it, not the tab
        return out;
      },
      { replace: true },
    );
  };
  const props = { set, access, suggestions: suggestions.data ?? [], onNotice: setNotice };

  return (
    <Page
      title={`Edit: ${clip(set.subtopic, 60)}`}
      eyebrow={`${set.topic} in ${set.category}`}
      headTitle={`Edit ${set.topic}: ${set.subtopic}`}
      back={setPath(set._id)}
      noindex
      width="max-w-4xl"
      actions={
        access !== "guest" && (
          <Button size="sm" icon="edit" onClick={() => setDetails(true)}>
            Details
          </Button>
        )
      }
    >
      <div className="space-y-4">
        {access === "guest" ? (
          <GuestNote>
            <Link to="/sign-in" state={{ returnTo: `${location.pathname}${location.search}` }} className={buttonClass("primary", "sm")}>
              Sign in
            </Link>
          </GuestNote>
        ) : (
          <RoleNote access={access} />
        )}

        <Tabs label="Parts of the study set" tabs={tabs} value={view} onChange={pick} idBase={tabsId} />

        <div role="status" className="empty:hidden">
          {notice && (
            <div className={cx("flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium", TONES[notice.tone])}>
              <Icon name={notice.tone === "rose" ? "x" : notice.tone === "bell" ? "clock" : "check"} className="size-4 shrink-0" />
              <span className="flex-1">{notice.text}</span>
              <IconButton icon="x" label="Dismiss" size="sm" onClick={() => setNotice(null)} />
            </div>
          )}
        </div>

        <TabPanel idBase={tabsId} value={view}>
          {view === "flashcards" && <FlashcardsTab {...props} />}
          {view === "questions" && <QuestionsTab {...props} />}
          {view === "review-queue" && access !== "guest" && <SuggestionsTab setId={set._id} access={access} onNotice={setNotice} />}
          {view === "reviewers" && <ReviewersTab setId={set._id} reviewers={reviewers} author={set.author?.username ?? null} onNotice={setNotice} />}
          {view === "history" && <HistoryTab setId={set._id} />}
        </TabPanel>
      </div>
      {details && access !== "guest" && <DetailsDialog set={set} access={access} onClose={() => setDetails(false)} onSaved={setNotice} />}
    </Page>
  );
}
