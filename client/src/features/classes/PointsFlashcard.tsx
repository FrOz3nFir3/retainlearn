// A flashcard reviewed point by point: each recall point's prompt is shown, you recall it, reveal it, and mark whether
// you knew it (Space to reveal, 1 knew it, 2 didn't, Enter for the next flashcard). The point you're on scrolls into view;
// a point you knew glows, one you didn't shakes. At the end, how much of the flashcard you recalled, on a ring, and the
// full answer to read.
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { cx } from "#utils/cx.ts";
import { Button } from "#components/ui/Button.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { RichText } from "#components/ui/RichText.tsx";
import { ClassShell } from "./ClassShell.tsx";
import { Note } from "./Note.tsx";
import type { ReviewFlashcard } from "./reviewPlan.ts";
import { Ring } from "./Ring.tsx";

export type FlashcardResult = { id: string; knew: boolean; points: { key: string; knew: boolean }[]; known: number; weight: number; missed: string[] };

type Props = {
  shell: { set: { _id: string; category: string; subtopic: string }; mode: "review" | "reviewMissed"; progressText: string; track: ReactNode };
  flashcard: ReviewFlashcard;
  last: boolean;
  marks: Record<string, boolean>;
  onMark: (key: string, knew: boolean) => void;
  onDone: (result: FlashcardResult) => void;
  notice?: ReactNode;
};

const toneOf = (share: number) => (share >= 0.8 ? "text-mint" : share >= 0.5 ? "text-bell" : "text-danger");

export function PointsFlashcard({ shell, flashcard, last, marks, onMark, onDone, notice }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [justMarked, setJustMarked] = useState<string | null>(null);
  const active = flashcard.points.findIndex((p) => marks[p.key] === undefined);
  const finished = active === -1;
  const known = flashcard.points.filter((p) => marks[p.key]).length;
  const share = known / flashcard.points.length;

  const mark = (knew: boolean) => {
    const point = flashcard.points[active];
    if (finished || !revealed || !point) return;
    setJustMarked(point.key);
    onMark(point.key, knew);
    setRevealed(false);
  };
  const complete = () =>
    onDone({
      id: flashcard._id,
      knew: share >= 0.8,
      points: flashcard.points.map((p) => ({ key: p.key, knew: marks[p.key] === true })),
      known,
      weight: flashcard.points.length,
      missed: flashcard.points.filter((p) => !marks[p.key]).map((p) => p.label),
    });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as Element | null)?.closest?.("input, textarea, button, summary")) return;
      if (e.key === " ") {
        e.preventDefault();
        if (!finished) setRevealed(true);
      } else if (e.key === "1") mark(true);
      else if (e.key === "2") mark(false);
      else if (e.key === "Enter" && finished) complete();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    document.getElementById(finished ? "flashcard-result" : `point-${active}`)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  }, [active, finished]);

  let lastSection: string | null = null;
  return (
    <ClassShell
      {...shell}
      bar={
        finished ? (
          <Button tone="primary" onClick={complete}>
            {last ? "Finish class" : "Next flashcard"}
          </Button>
        ) : !revealed ? (
          <Button tone="primary" className="w-full sm:w-auto" onClick={() => setRevealed(true)}>
            Reveal (Space)
          </Button>
        ) : (
          <>
            <Button icon="x" className="flex-1 sm:flex-none" onClick={() => mark(false)}>
              Didn't know (2)
            </Button>
            <Button tone="primary" icon="check" className="flex-1 bg-mint hover:bg-mint/90 sm:flex-none" onClick={() => mark(true)}>
              Knew it (1)
            </Button>
          </>
        )
      }
    >
      {notice}
      <div className="panel bg-surface p-5">
        <p className="text-xs font-semibold text-brand">Question</p>
        <RichText html={flashcard.question} className="mt-1 text-[17px] font-medium text-ink" />
        <p className="mt-3 text-sm text-ink/55">
          {flashcard.focused
            ? `The ${flashcard.points.length === 1 ? "point" : `${flashcard.points.length} points`} you missed last time. Recall, then reveal.`
            : `Try to recall each point before you reveal it. ${flashcard.points.length} points, about ${Math.max(1, Math.round(flashcard.points.length / 4))} min.`}
        </p>
      </div>
      <ol className="mt-4 space-y-2">
        {flashcard.points.map((p, i) => {
          // A part's own text is prompted by the part's title, so the title isn't shown twice.
          const header = p.section && p.section !== lastSection && p.kind !== "section" ? p.section : null;
          lastSection = p.section;
          const state = marks[p.key] === true ? "knew" : marks[p.key] === false ? "missed" : i === active ? "active" : "later";
          const open = state !== "later" && (state !== "active" || revealed);
          const just = p.key === justMarked && (state === "knew" || state === "missed");
          return (
            <li key={`${p.key}-${i}`} id={`point-${i}`} className="scroll-mt-28">
              {header && <h3 className="mt-4 mb-1.5 px-1 font-display text-base font-semibold first:mt-0">{header}</h3>}
              <div
                className={cx(
                  "rounded-2xl border px-4 py-3 transition-colors",
                  just && (state === "knew" ? "motion-safe:animate-[kit-glow_0.9s_ease-out]" : "motion-safe:animate-[kit-shake_0.42s]"),
                  state === "active" ? "border-brand bg-surface shadow-[0_8px_24px_-14px_rgb(79_70_229/0.6)]" : state === "knew" ? "border-mint/40 bg-mint-wash" : state === "missed" ? "border-danger/30 bg-rose-wash" : "border-ink/[0.07] bg-surface/60",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cx("text-sm font-semibold", state === "later" && "text-ink/40")}>{p.label}</span>
                  {state === "knew" && <Icon name="check" className="size-4 text-mint-ink" strokeWidth={2.4} />}
                  {state === "missed" && <Icon name="x" className="size-4 text-rose-ink" strokeWidth={2.4} />}
                  {state === "active" && !revealed && <span className="ml-auto text-xs text-ink/45">Recall it, then reveal</span>}
                </div>
                {open && <RichText html={p.html} className="mt-1.5 text-[14px]" />}
              </div>
            </li>
          );
        })}
      </ol>
      {finished && (
        <div id="flashcard-result" className="mt-4 flex scroll-mt-28 items-center gap-4 rounded-2xl border border-ink/[0.07] bg-surface p-4 motion-safe:animate-[kit-rise_0.35s_both]" role="status">
          <Ring value={share} tone={toneOf(share)}>
            {known}/{flashcard.points.length}
          </Ring>
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold">{share >= 0.8 ? "Strong recall" : share >= 0.5 ? "Getting there" : "Worth another look"}</p>
            <p className="text-sm text-ink/60">
              {flashcard.points.length - known
                ? `${flashcard.points.length - known === 1 ? "The point you missed waits" : `The ${flashcard.points.length - known} points you missed wait`} in "Go over what you missed": just those, not the whole flashcard.`
                : "Every point recalled."}
            </p>
          </div>
        </div>
      )}
      <details className="mt-5">
        <summary className="cursor-pointer text-sm font-semibold text-brand">Read the full answer</summary>
        <Note html={flashcard.answer} className="panel mt-2 bg-surface p-4" />
      </details>
    </ClassShell>
  );
}
