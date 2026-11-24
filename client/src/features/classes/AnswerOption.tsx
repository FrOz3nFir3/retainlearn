// One of a question's answers, as a button. Its letter turns into a tick or a cross as the answer lands; the right one
// glows and throws sparks when you picked it, and the XP it earned floats up; a wrong pick shakes. Once answered, the
// options you didn't pick and that aren't right fade, and stay readable.
import type { CSSProperties } from "react";
import { cx } from "#utils/cx.ts";
import { Icon } from "#components/ui/Icon.tsx";
import { RichText } from "#components/ui/RichText.tsx";

// Sparks thrown off a right answer: eight ways out from its letter.
const SPARKS = Array.from({ length: 8 }, (_, k) => [Math.round(Math.cos((k / 8) * Math.PI * 2) * 26), Math.round(Math.sin((k / 8) * Math.PI * 2) * 26)] as const);

type Props = { html: string; index: number; answered: boolean; correct: boolean; picked: boolean; xp: number; onPick: () => void };

export function AnswerOption({ html, index, answered, correct, picked, xp, onPick }: Props) {
  const isRight = answered && correct;
  const isWrong = answered && picked && !correct;
  const won = isRight && picked;
  return (
    <button
      type="button"
      onClick={onPick}
      aria-disabled={answered || undefined}
      className={cx(
        "relative flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-brand",
        isRight
          ? "border-mint bg-mint-wash motion-safe:animate-[kit-glow_0.9s_ease-out]"
          : isWrong
            ? "border-danger bg-rose-wash motion-safe:animate-[kit-shake_0.42s_cubic-bezier(0.36,0.07,0.19,0.97)]"
            : answered
              ? "cursor-default border-ink/5 bg-surface/60 opacity-60"
              : "border-ink/10 bg-surface hover:border-brand/50",
      )}
    >
      <span className={cx("relative grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold", isRight ? "bg-mint text-white" : isWrong ? "bg-danger text-white" : "bg-ink/[0.06] text-ink/60")}>
        {isRight || isWrong ? <Icon name={isRight ? "check" : "x"} className="size-4 motion-safe:animate-[kit-land_0.5s_both]" strokeWidth={2.6} /> : ("ABCD"[index] ?? index + 1)}
        {won &&
          SPARKS.map(([dx, dy], k) => (
            <span
              key={k}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-1/2 hidden size-1.5 rounded-full bg-mint motion-safe:block motion-safe:animate-[kit-spark_0.65s_ease-out_forwards]"
              style={{ "--dx": `${dx}px`, "--dy": `${dy}px` } as CSSProperties}
            />
          ))}
      </span>
      <RichText html={html} className="text-[15px]" />
      {won && xp > 0 && (
        <span aria-hidden="true" className="pointer-events-none absolute -top-3 right-4 rounded-full bg-bell px-2 py-0.5 text-xs font-bold text-night shadow-sm motion-safe:animate-[kit-float-up_1.4s_ease-out_forwards] motion-reduce:hidden">
          +{xp} XP
        </span>
      )}
    </button>
  );
}
