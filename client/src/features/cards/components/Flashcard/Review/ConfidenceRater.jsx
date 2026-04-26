import React from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../../authentication/state/authSlice";
import {
  CheckIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";

const ConfidenceRater = ({ onRate, isFocusReview = false }) => {
  const user = useSelector(selectCurrentUser);
  const focusLabel = user && !isFocusReview ? "Focus" : "Review";

  return (
    <div className="px-6 pb-6">
      <div className="bg-gray-50 dark:bg-white/4 border border-gray-100 dark:border-white/6 rounded-2xl p-5">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-0.5">
            Rate your understanding
          </p>
          <p className="text-xs text-gray-500 dark:text-white/40">
            {user && !isFocusReview
              ? "Cards marked for focus will be available in Focus Review for targeted practice"
              : "Cards marked for review will be added to this session for immediate practice"}
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {/* Mastered */}
          <button
            onClick={() => onRate("mastered")}
            className="cursor-pointer group flex items-center gap-3 p-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all duration-150"
          >
            <div className="shrink-0 w-9 h-9 bg-emerald-100 dark:bg-emerald-500/15 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-500/25 transition-colors duration-150">
              <CheckIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">Perfect!</div>
              <div className="text-xs text-gray-500 dark:text-white/40">I knew this well</div>
            </div>
          </button>

          {/* Partial */}
          <button
            onClick={() => onRate("partial")}
            className="cursor-pointer group relative flex items-center gap-3 p-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:border-amber-300 dark:hover:border-amber-500/40 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all duration-150"
          >
            <div className="shrink-0 w-9 h-9 bg-amber-100 dark:bg-amber-500/15 rounded-xl flex items-center justify-center group-hover:bg-amber-200 dark:group-hover:bg-amber-500/25 transition-colors duration-150">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">Close</div>
              <div className="text-xs text-gray-500 dark:text-white/40">Almost got it</div>
            </div>
            <span className="absolute top-2 right-2 text-xs font-semibold px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 rounded-md">
              {focusLabel}
            </span>
          </button>

          {/* Struggling */}
          <button
            onClick={() => onRate("struggling")}
            className="cursor-pointer group relative flex items-center gap-3 p-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:border-red-300 dark:hover:border-red-500/40 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-150"
          >
            <div className="shrink-0 w-9 h-9 bg-red-100 dark:bg-red-500/15 rounded-xl flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-500/25 transition-colors duration-150">
              <QuestionMarkCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">Difficult</div>
              <div className="text-xs text-gray-500 dark:text-white/40">Need more practice</div>
            </div>
            <span className="absolute top-2 right-2 text-xs font-semibold px-1.5 py-0.5 bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 rounded-md">
              {focusLabel}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfidenceRater;
