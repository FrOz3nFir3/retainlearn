import React from "react";
import { AcademicCapIcon } from "@heroicons/react/24/outline";

const tips = [
  { label: "Read carefully", desc: "Take time to understand each question" },
  { label: "Think first", desc: "Consider your answer before seeing options" },
  { label: "Eliminate wrong answers", desc: "Rule out obviously incorrect options" },
  { label: "Trust your instinct", desc: "Your first answer is often correct" },
];

const QuizTips = ({ className = "" }) => {
  return (
    <div
      className={`bg-gray-50 dark:bg-white/4 border border-gray-100 dark:border-white/6 rounded-2xl p-5 ${className}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-brand-surface dark:bg-white/8 rounded-xl">
          <AcademicCapIcon className="h-4 w-4 text-brand-primary dark:text-brand-accent/70" />
        </div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-white/70">
          Quiz taking tips
        </h4>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {tips.map((tip) => (
          <div key={tip.label} className="flex items-start gap-2.5">
            <div className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-brand-accent" />
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-white/70">
                {tip.label}
              </p>
              <p className="text-xs text-gray-400 dark:text-white/30">
                {tip.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizTips;
