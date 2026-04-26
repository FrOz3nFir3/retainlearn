import React from "react";
import { FireIcon } from "@heroicons/react/24/outline";

const FocusReviewHeader = ({
  showCompletion = false,
  focusCardsCount = 0,
  currentIndex,
}) => {
  return (
    <div className="px-6 pt-6 pb-4 mb-2">
      <div className="flex items-center gap-4 mb-3">
        <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
          <FireIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-0.5">
            Targeted practice
          </p>
          <h2 className="font-heading text-2xl text-gray-900 dark:text-white leading-tight">
            Focus Review
          </h2>
        </div>
      </div>

      {!showCompletion && (
        <p className="text-sm text-gray-500 dark:text-white/40">
          {showCompletion
            ? "Targeted practice session completed"
            : `Practising ${focusCardsCount} challenging ${focusCardsCount === 1 ? "card" : "cards"}`}
        </p>
      )}

      {!showCompletion && currentIndex === 0 && (
        <div className="mt-3 inline-flex items-start gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-2.5">
          <FireIcon className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <strong>Focus Mode:</strong> You're reviewing cards that need extra practice. Rate them honestly to improve your learning.
          </p>
        </div>
      )}
    </div>
  );
};

export default FocusReviewHeader;
