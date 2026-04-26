import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import {
  QuestionMarkCircleIcon,
  LightBulbIcon,
} from "@heroicons/react/24/solid";

const MODES = ["flashcard-front", "flashcard-back", "quiz"];
const DURATIONS = [3000, 2500, 3500];

const HeroSection = ({ onLearnMoreClick }) => {
  const [modeIndex, setModeIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(() => {
        setModeIndex((prev) => (prev + 1) % MODES.length);
        setFading(false);
      }, 280);
    }, DURATIONS[modeIndex]);
    return () => clearTimeout(timer);
  }, [modeIndex]);

  const mode = MODES[modeIndex];

  return (
    <section className="relative min-h-screen flex items-center bg-brand-dark overflow-hidden">
      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
        }}
      />

      {/* Amber glow — top left, very subtle */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-accent/8 rounded-full blur-3xl pointer-events-none" />
      {/* Indigo glow — bottom right */}
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-brand-primary/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 w-full py-16 sm:py-20 lg:py-0 lg:min-h-screen lg:flex lg:items-center">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10 sm:gap-14 lg:gap-24 w-full">

          {/* ── Left: Copy ── */}
          <div className="lg:w-[54%]">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-10">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
              <span className="text-sm font-medium text-brand-accent/80 tracking-wide">
                Open source &middot; Forever free
              </span>
            </div>

            {/* Heading */}
            <h1 className="font-heading text-[2.25rem] sm:text-[3.25rem] lg:text-[4.5rem] xl:text-[5.5rem] text-white leading-[1.05] tracking-tight mb-6 sm:mb-8">
              The simplest way
              <br />
              to{" "}
              <em className="not-italic text-brand-accent">study</em>
              {" "}and actually
              <br />
              remember.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-white/50 leading-relaxed max-w-lg mb-8 sm:mb-10">
              Create flashcards, take quizzes, mark what's tough, and track
              how you're doing — all organized by topic, completely free.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/categories"
                className="inline-flex items-center justify-center px-7 py-3.5 text-sm font-semibold text-brand-dark bg-brand-accent hover:bg-amber-400 rounded-xl transition-colors duration-150 shadow-lg shadow-brand-accent/20"
              >
                Browse flashcards
              </Link>
              <button
                onClick={onLearnMoreClick}
                className="cursor-pointer inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold text-white/70 border border-white/10 hover:border-white/25 hover:text-white rounded-xl transition-all duration-150"
              >
                How it works
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Feature pills row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-8 sm:mt-12">
              {["Flashcards", "Quizzes", "Focus Mode", "Progress Tracking"].map((label, i, arr) => (
                <div key={label} className="flex items-center gap-5">
                  <span className="text-xs text-white/45 font-medium tracking-wide">{label}</span>
                  {i < arr.length - 1 && <span className="w-1 h-1 rounded-full bg-white/20" />}
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Animated card showcase ── */}
          <div className="w-full lg:w-[46%] flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-none">
              {/* Stacked peek cards */}
              <div className="absolute -top-3 left-5 right-5 h-full rounded-3xl bg-white/4 -rotate-3 pointer-events-none" />
              <div className="absolute -top-1.5 left-2.5 right-2.5 h-full rounded-3xl bg-white/6 rotate-1 pointer-events-none" />

              {/* Card */}
              <div
                className={`relative transition-opacity duration-280 ${
                  fading ? "opacity-0" : "opacity-100"
                }`}
              >
                {/* ── Flashcard Front (mirrors FlashcardFront.jsx) ── */}
                {mode === "flashcard-front" && (
                  <div className="bg-brand-primary rounded-3xl shadow-xl border-2 border-brand-primary/30 flex flex-col min-h-88">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-white/15 rounded-xl">
                          <QuestionMarkCircleIcon className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-white/80 text-sm font-medium">
                          Question
                        </span>
                      </div>
                      <div className="text-white/80 text-xs font-semibold bg-white/15 px-2.5 py-1 rounded-full">
                        2 / 8
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex items-center justify-center px-6 py-8">
                      <p className="font-heading text-xl sm:text-2xl text-white leading-snug text-center">
                        What is active recall and why does it work?
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pb-4 text-center">
                      <div className="inline-block text-white/70 text-xs sm:text-sm bg-white/10 px-4 py-1.5 rounded-full border border-white/15">
                        Click to reveal answer
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Flashcard Back (mirrors FlashcardBack.jsx) ── */}
                {mode === "flashcard-back" && (
                  <div className="bg-brand-accent rounded-3xl shadow-xl border-2 border-brand-accent/30 flex flex-col min-h-88">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-brand-dark/15 rounded-xl">
                          <LightBulbIcon className="h-5 w-5 text-brand-dark" />
                        </div>
                        <span className="text-brand-dark/80 text-sm font-medium">
                          Answer
                        </span>
                      </div>
                      <div className="text-brand-dark/70 text-xs font-semibold bg-brand-dark/10 px-2.5 py-1 rounded-full">
                        2 / 8
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex items-center justify-center px-6 py-8 text-brand-dark">
                      <p className="text-sm sm:text-base leading-relaxed text-center">
                        Testing yourself forces your brain to retrieve
                        information rather than passively re-read it —
                        strengthening the memory pathway each time.
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pb-4 text-center">
                      <div className="inline-block text-brand-dark/70 text-xs sm:text-sm bg-brand-dark/10 px-4 py-1.5 rounded-full border border-brand-dark/15">
                        Click to see question
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Quiz (mirrors QuizQuestion.jsx + OptionButton.jsx, dark mode) ── */}
                {mode === "quiz" && (
                  <div className="space-y-3">
                    {/* Question card */}
                    <div className="bg-white/5 rounded-3xl border border-white/10 p-5">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="p-1.5 bg-white/8 rounded-lg">
                          <QuestionMarkCircleIcon className="h-4 w-4 text-brand-accent/70" />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-widest text-brand-accent">
                          Question 4
                        </span>
                      </div>
                      <p className="text-base text-white leading-relaxed">
                        Which technique involves testing yourself instead of
                        re-reading?
                      </p>
                    </div>

                    {/* Options */}
                    <div className="space-y-2">
                      {[
                        { letter: "A", text: "Highlighting notes" },
                        { letter: "B", text: "Active recall", correct: true },
                        { letter: "C", text: "Summarising chapters" },
                        { letter: "D", text: "Re-reading pages" },
                      ].map((opt) => (
                        <div
                          key={opt.letter}
                          className={`w-full p-3.5 rounded-xl border-2 ${
                            opt.correct
                              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-200"
                              : "bg-white/3 border-white/8 text-white/55"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                                opt.correct
                                  ? "bg-emerald-500 text-white"
                                  : "bg-white/8 text-white/50"
                              }`}
                            >
                              {opt.letter}
                            </div>
                            <span className="text-sm grow">{opt.text}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Progress dots */}
              <div className="flex justify-center gap-1.5 mt-5">
                {MODES.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === modeIndex
                        ? "w-5 bg-brand-accent"
                        : "w-1 bg-white/15"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
