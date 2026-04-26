import React from "react";
import {
  TrophyIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChartPieIcon,
} from "@heroicons/react/24/solid";

const ReportStats = ({ currentQuestion }) => {
  if (!currentQuestion) return null;

  const accuracy =
    currentQuestion.answerAttempts > 0
      ? `${Math.round(
          (currentQuestion.timesCorrect / currentQuestion.answerAttempts) * 100
        )}%`
      : "N/A";

  return (
    <div className="px-3 sm:px-6 py-4">
      <div className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-gray-200 dark:border-white/8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-brand-surface dark:bg-white/8 rounded-xl shrink-0">
            <TrophyIcon className="h-5 w-5 text-brand-primary dark:text-brand-accent/70" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Question Performance
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-blue-50 dark:bg-blue-500/8 rounded-xl p-3 text-center border border-blue-200 dark:border-blue-500/20">
            <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {currentQuestion.answerAttempts}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Attempts</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-500/8 rounded-xl p-3 text-center border border-emerald-200 dark:border-emerald-500/20">
            <CheckCircleIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {currentQuestion.timesCorrect}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Correct</p>
          </div>
          <div className="bg-red-50 dark:bg-red-500/8 rounded-xl p-3 text-center border border-red-200 dark:border-red-500/20">
            <XMarkIcon className="h-5 w-5 text-red-600 dark:text-red-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-red-600 dark:text-red-400">
              {currentQuestion.timesIncorrect || 0}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Incorrect
            </p>
          </div>
          <div className="bg-brand-surface dark:bg-white/8 rounded-xl p-3 text-center border border-amber-200 dark:border-white/10">
            <ChartPieIcon className="h-5 w-5 text-brand-primary dark:text-brand-accent/70 mx-auto mb-1" />
            <p className="text-lg font-bold text-brand-primary dark:text-brand-accent">
              {accuracy}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Accuracy</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportStats;
