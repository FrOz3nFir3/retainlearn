import React from "react";
import {
  AcademicCapIcon,
  FireIcon,
} from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectCurrentUser } from "../../../authentication/state/authSlice";

const QuizHeader = ({ current, total, cardId }) => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const progressPercentage = total > 0 ? (current / total) * 100 : 0;

  const handleFocusQuiz = () => {
    navigate(`/card/${cardId}/focus-quiz`);
  };

  return (
    <div className="px-6 pt-6 pb-4 mb-2">
      <div className="flex flex-wrap gap-3 items-center justify-between mb-5">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-brand-surface dark:bg-white/8 rounded-xl">
            <AcademicCapIcon className="h-6 w-6 text-brand-primary dark:text-brand-accent/70" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-0.5">
              Challenge mode
            </p>
            <h2 className="font-heading text-2xl text-gray-900 dark:text-white leading-tight">
              Quiz
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleFocusQuiz}
            disabled={!user}
            title={!user ? "Sign in to use Focus Quiz" : undefined}
            className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm font-semibold rounded-xl hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors duration-150"
          >
            <FireIcon className="h-4 w-4" />
            Focus Quiz
          </button>

          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl">
            <span className="text-base font-semibold text-gray-900 dark:text-white">
              {current} / {total}
            </span>
            <span className="text-xs text-gray-400 dark:text-white/30">
              {Math.round(progressPercentage)}%
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 dark:bg-white/8 rounded-full h-1.5">
        <div
          className="bg-brand-primary h-1.5 rounded-full transition-all duration-500 ease-out"
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

export default QuizHeader;
