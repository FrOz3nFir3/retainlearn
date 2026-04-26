import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { apiSlice } from "../../../../api/apiSlice";
import {
  FireIcon,
  TrophyIcon,
  ArrowPathIcon,
  AcademicCapIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";

const FocusQuizCompletion = ({
  score,
  totalQuestions,
  completedQuizzesCount,
  totalFocusQuizzes,
  restartFocusQuiz,
}) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch();

  const accuracyPercentage =
    totalFocusQuizzes > 0 ? (score / totalFocusQuizzes) * 100 : 0;
  const isHighScore = accuracyPercentage >= 80;
  const isPerfectScore = accuracyPercentage === 100;

  const handleTakeRegularQuiz = () => navigate(`/card/${id}/quiz`);

  const handleRetryFocusQuiz = () => {
    dispatch(
      apiSlice.util.invalidateTags([
        { type: "FocusQuizData", id: id },
        { type: "FocusQuizData", id: "LIST" },
      ])
    );
    restartFocusQuiz();
  };

  const handleGoToOverview = () => navigate(`/card/${id}`);

  const headingText = isPerfectScore
    ? "Perfect score!"
    : isHighScore
    ? "Great job!"
    : "Keep practising.";

  const Icon = isPerfectScore ? TrophyIcon : isHighScore ? CheckBadgeIcon : FireIcon;
  const iconColorClass = isPerfectScore
    ? "text-brand-accent"
    : isHighScore
    ? "text-emerald-500"
    : "text-amber-500";

  return (
    <div className="p-8 text-center">
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-brand-surface dark:bg-white/8 rounded-2xl">
          <Icon className={`h-10 w-10 ${iconColorClass}`} />
        </div>
      </div>

      {/* Title */}
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-2">
        Focus quiz complete
      </p>
      <h2 className="font-heading text-3xl text-gray-900 dark:text-white mb-2">
        {headingText}
      </h2>
      <p className="text-sm text-gray-500 dark:text-white/40 mb-8">
        {isPerfectScore
          ? "Outstanding! You've mastered these challenging questions."
          : isHighScore
          ? "Excellent work! You're showing great improvement on these difficult questions."
          : "Don't give up — each attempt makes you stronger."}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-8 max-w-xs mx-auto">
        <div className="bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-1.5">Score</p>
          <p className="font-heading text-2xl font-bold text-gray-900 dark:text-white">{score}/{totalFocusQuizzes}</p>
          <p className={`text-xs font-semibold mt-0.5 ${isHighScore ? "text-emerald-500" : "text-amber-500"}`}>
            {Math.round(accuracyPercentage)}% accuracy
          </p>
        </div>
        <div className="bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-1.5">Practised</p>
          <p className="font-heading text-2xl font-bold text-gray-900 dark:text-white">{completedQuizzesCount}/{totalFocusQuizzes}</p>
          <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">questions</p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2.5 max-w-xs mx-auto">
        {accuracyPercentage < 100 && (
          <button
            onClick={handleRetryFocusQuiz}
            className="cursor-pointer w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm font-semibold rounded-xl hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors duration-150"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Retry Focus Quiz
          </button>
        )}

        <button
          onClick={handleTakeRegularQuiz}
          className="cursor-pointer w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand-primary hover:bg-indigo-700 dark:bg-brand-accent dark:hover:bg-amber-400 text-white dark:text-brand-dark text-sm font-semibold rounded-xl transition-colors duration-150"
        >
          <AcademicCapIcon className="h-4 w-4" />
          Take Regular Quiz
        </button>

        <button
          onClick={handleGoToOverview}
          className="cursor-pointer w-full px-5 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 text-sm font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-white/8 transition-colors duration-150"
        >
          Back to Overview
        </button>
      </div>
    </div>
  );
};

export default FocusQuizCompletion;
