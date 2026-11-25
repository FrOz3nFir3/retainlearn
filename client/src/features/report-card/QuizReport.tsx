// A set's quiz report (the prototype's QuizReport): each of its questions as you stand on it, a player card (and its
// level), one to retry, or not answered yet; and, when there's a record to clear, resetting the set's quizzes. The
// questions' text comes with the set's content, read when the report opens (and kept a while, for its classroom).
import { isPlayerCard } from "@retainlearn/core";
import type { QuestionProgress, ReportCardSet } from "@retainlearn/core";
import { Button } from "#components/ui/Button.tsx";
import { Chip } from "#components/ui/Chip.tsx";
import { Dialog } from "#components/ui/Dialog.tsx";
import { Loading, SkeletonText } from "#components/ui/Skeleton.tsx";
import { useGetStudySetQuery } from "#features/classroom/classroomApi.ts";
import { textOf } from "#utils/safeHtml.ts";
import { hasQuizRecord } from "./reportCardStats.ts";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

type Standing = "card" | "retry" | "open";
const standingOf = (q: QuestionProgress | undefined): Standing => (q?.missedOn != null ? "retry" : isPlayerCard(q) ? "card" : "open");

export function QuizReport({ set, onClose, onReset }: { set: ReportCardSet; onClose: () => void; onReset: () => void }) {
  const content = useGetStudySetQuery(set.setId);
  const rows = (content.data?.questions ?? []).map((q) => ({ id: q._id, text: textOf(q.question), code: /<pre[\s>]/i.test(q.question), progress: set.questions[q._id] }));
  const count = (standing: Standing) => rows.filter((r) => standingOf(r.progress) === standing).length;

  return (
    <Dialog
      title="Quiz report"
      eyebrow={set.subtopic}
      onClose={onClose}
      wide
      footer={
        hasQuizRecord(set) && (
          <Button icon="rotateLeft" onClick={onReset} className="mr-auto">
            Reset quiz progress
          </Button>
        )
      }
    >
      {content.isError ? (
        <p className="text-sm text-ink/60">The questions didn't load. Check your connection, then open the report again.</p>
      ) : !content.data ? (
        <Loading label="Loading the questions">
          <p className="mb-3 text-sm">
            <SkeletonText className="w-2/3" />
          </p>
          <div className="divide-y divide-ink/6 rounded-xl border border-ink/7">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="flex items-start gap-3 px-3 py-2.5">
                <span className="w-6 shrink-0 pt-0.5 text-right text-xs text-ink/40 tabular-nums">{n}</span>
                <p className="min-w-0 flex-1 text-sm">
                  <SkeletonText className="w-full" />
                </p>
                <Chip>
                  <SkeletonText className="w-20" />
                </Chip>
              </div>
            ))}
          </div>
        </Loading>
      ) : rows.length === 0 ? (
        <p className="text-sm text-ink/60">This set has no questions yet.</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-ink/60">
            {plural(count("card"), "player card")}, {count("retry")} to retry, {count("open")} not answered yet.
          </p>
          <ol className="divide-y divide-ink/6 rounded-xl border border-ink/7">
            {rows.map((row, i) => {
              const standing = standingOf(row.progress);
              return (
                <li key={row.id} className="flex items-start gap-3 px-3 py-2.5">
                  <span className="w-6 shrink-0 pt-0.5 text-right text-xs text-ink/40 tabular-nums">{i + 1}</span>
                  <p className="line-clamp-3 min-w-0 flex-1 text-sm text-pretty">
                    {row.text}
                    {row.code && <Chip className="ml-1.5 align-middle">Code</Chip>}
                  </p>
                  <span className="shrink-0">
                    {standing === "card" && <Chip tone="brand">{`Player card, level ${row.progress?.level ?? 1}`}</Chip>}
                    {standing === "retry" && <Chip tone="rose">To retry</Chip>}
                    {standing === "open" && <Chip>Not answered yet</Chip>}
                  </span>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </Dialog>
  );
}
