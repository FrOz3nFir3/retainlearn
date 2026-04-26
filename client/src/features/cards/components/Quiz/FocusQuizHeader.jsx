import React from "react";
import { FireIcon, TrophyIcon } from "@heroicons/react/24/outline";

const FocusQuizHeader = ({ current, total, focusQuizzesCount, score }) => {
  const progressPercentage = total > 0 ? (current / total) * 100 : 0;
  const accuracyPercentage = current > 0 ? (score / current) * 100 : 0;

  return (
    <div className="px-6 pt-6 pb-4 mb-2">
      <div className="flex flex-wrap gap-3 items-center justify-between mb-5">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
            <FireIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-0.5">
              Targeted practice
            </p>
            <h2 className="font-heading text-2xl text-gray-900 dark:text-white leading-tight">
              Focus Quiz
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {current} / {total}
            </span>
            <span className="text-xs text-gray-400 dark:text-white/30">
              {Math.round(progressPercentage)}%
            </span>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-brand-surface dark:bg-white/5 border border-amber-200 dark:border-brand-accent/20 rounded-xl">
            <TrophyIcon className="h-4 w-4 text-brand-accent" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {current > 0 ? Math.round(accuracyPercentage) : 0}%
            </span>
            <span className="text-xs text-gray-400 dark:text-white/30">accuracy</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-white/40 mb-4">
        Mastering your most challenging questions ({focusQuizzesCount} questions)
      </p>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 dark:bg-white/8 rounded-full h-1.5">
        <div
          className="bg-brand-accent h-1.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5 text-xs text-gray-400 dark:text-white/30">
        <span>Start</span>
        <span>Complete</span>
      </div>
    </div>
  );
};

export default FocusQuizHeader;
