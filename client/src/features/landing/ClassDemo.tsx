// A class, step by step, on the home page (P2-13: today's page's flip-the-card demo, in the new look): a flashcard's
// question, its answer with the recall points you tick, then a quiz question answered right, which becomes a player
// card. Drawn like the class screens themselves. It moves on by itself every few seconds, with a Pause button beside it
// (guide: motion, WCAG 2.2.2) and a button for each step; it holds still while the pointer or focus is on it, and never
// moves for someone who asked for less motion. To screen readers, a carousel of slides named by their place (guide:
// carousel); the step on show is read out only once it's yours to move (paused).
import { useEffect, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { Chip } from "#components/ui/Chip.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { cx } from "#utils/cx.ts";

const STEPS = ["Question", "Answer", "Quiz"] as const;
const EVERY = 3800; // ms on each step

const lessMotionQuery = typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
const subscribe = (onChange: () => void) => {
  lessMotionQuery?.addEventListener("change", onChange);
  return () => lessMotionQuery?.removeEventListener("change", onChange);
};
const useLessMotion = () => useSyncExternalStore(subscribe, () => lessMotionQuery?.matches ?? false, () => false);

export function ClassDemo({ className }: { className?: string }) {
  const lessMotion = useLessMotion();
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [holding, setHolding] = useState(false); // the pointer or focus is on it
  const moving = !paused && !lessMotion && !holding;
  useEffect(() => {
    if (!moving) return;
    const timer = setTimeout(() => setStep((s) => (s + 1) % STEPS.length), EVERY);
    return () => clearTimeout(timer);
  }, [moving, step]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="A class, step by step"
      className={className}
      onPointerEnter={() => setHolding(true)}
      onPointerLeave={() => setHolding(false)}
      onFocus={() => setHolding(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHolding(false);
      }}
    >
      <div className="relative">
        {/* The rest of the deck, behind the card on show. */}
        <div aria-hidden="true" className="absolute inset-x-6 -top-3 h-full -rotate-2 rounded-3xl bg-brand/10" />
        <div aria-hidden="true" className="absolute inset-x-3 -top-1.5 h-full rotate-1 rounded-3xl bg-brand/15" />
        <div aria-live={moving ? "off" : "polite"} className="relative grid">
          {STEPS.map((name, i) => (
            <div
              key={name}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${STEPS.length}: ${name}`}
              aria-hidden={i !== step}
              inert={i !== step}
              className={cx("rounded-3xl bg-surface [grid-area:1/1] motion-safe:transition-opacity motion-safe:duration-300", i === step ? "opacity-100" : "opacity-0")}
            >
              {SLIDES[i]}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Steps" className="flex gap-1.5">
          {STEPS.map((name, i) => (
            <button
              key={name}
              type="button"
              aria-current={i === step ? "true" : undefined}
              onClick={() => setStep(i)}
              className={cx(
                "cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                i === step ? "bg-ink text-surface" : "bg-ink/[0.06] text-ink/60 hover:text-ink",
              )}
            >
              {name}
            </button>
          ))}
        </div>
        {!lessMotion && (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-ink/60 hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
          >
            <Icon name={paused ? "play" : "pause"} className="size-3.5" />
            {paused ? "Play" : "Pause"}
          </button>
        )}
      </div>
    </section>
  );
}

function Point({ knew, children }: { knew: boolean; children: ReactNode }) {
  return (
    <li>
      <Chip tone={knew ? "mint" : "rose"}>
        <Icon name={knew ? "check" : "x"} className="size-3" strokeWidth={2.4} />
        <span className="sr-only">{knew ? "Knew it: " : "Missed: "}</span>
        {children}
      </Chip>
    </li>
  );
}

const CARD = "flex h-72 flex-col rounded-3xl p-6";

const SLIDES: ReactNode[] = [
  <div key="question" className={cx(CARD, "bg-brand text-white shadow-[0_18px_40px_-18px_rgb(79_70_229/0.8)]")}>
    <p className="text-xs font-semibold text-white/70">Question</p>
    <p className="m-auto text-center font-display text-2xl font-semibold text-balance sm:text-[1.7rem]">What does the event loop do?</p>
    <p className="text-center text-xs text-white/60">Answer it in your head first</p>
  </div>,
  <div key="answer" className={cx(CARD, "border-2 border-bell/60 bg-bell-wash text-ink")}>
    <p className="text-xs font-semibold text-bell-ink">Answer</p>
    <p className="m-auto text-center text-lg leading-snug text-balance">When the call stack is empty, it runs the queued microtasks first, then the next callback.</p>
    <ul aria-label="Recall points" className="flex flex-wrap justify-center gap-1.5">
      <Point knew>an empty call stack</Point>
      <Point knew={false}>microtasks first</Point>
      <Point knew>then the next callback</Point>
    </ul>
    <p className="mt-3 text-center text-xs text-ink/55">You tick what you knew. What you missed comes back tomorrow.</p>
  </div>,
  <div key="quiz" className={cx(CARD, "bg-surface p-5 text-ink shadow-[0_18px_40px_-24px_rgb(30_27_75/0.45)] ring-1 ring-ink/8")}>
    <p className="text-xs font-semibold text-brand">Quiz</p>
    <p className="mt-1 text-[15px] font-medium text-balance">Which runs first after the current script?</p>
    <ul className="mt-3 grid gap-2 text-sm">
      <li className="flex items-center gap-3 rounded-2xl border border-mint bg-mint-wash px-3 py-2">
        <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-mint text-white">
          <Icon name="check" className="size-3.5" strokeWidth={2.6} />
        </span>
        <span>
          <span className="sr-only">Right answer: </span>A resolved promise's callback
        </span>
      </li>
      <li className="flex items-center gap-3 rounded-2xl border border-ink/8 px-3 py-2 opacity-60">
        <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-ink/[0.06] text-xs font-bold text-ink/60">B</span>
        <span>A zero-delay timer</span>
      </li>
    </ul>
    <p className="mt-auto flex items-center gap-2 rounded-2xl bg-bell-wash px-3 py-2 text-xs font-semibold text-bell-ink">
      <Icon name="cards" className="size-4 shrink-0" />
      Right, so it's yours now: a player card that levels up each time you remember it.
    </p>
  </div>,
];
