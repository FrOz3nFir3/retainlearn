import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckBadgeIcon, BookOpenIcon } from "@heroicons/react/24/outline";

const FocusReviewEmptyState = ({
  hasReviewData = false,
  onRefreshFocusReview,
}) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const handleStartNormalReview = () => {
    navigate(`/card/${id}/review`);
  };

  return (
    <div className="bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl p-8 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl mb-4">
        <CheckBadgeIcon className="h-7 w-7 text-emerald-500" />
      </div>

      <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-2">
        You're doing great
      </p>
      <h3 className="font-heading text-2xl text-gray-900 dark:text-white mb-2">
        No weak cards right now
      </h3>
      <p className="text-sm text-gray-500 dark:text-white/40 max-w-sm mx-auto mb-6 leading-relaxed">
        You don't have any cards that need focused practice. Keep up the regular study to maintain your progress.
      </p>

      <button
        onClick={handleStartNormalReview}
        className="cursor-pointer inline-flex items-center gap-2 px-5 py-3 bg-brand-primary hover:bg-indigo-700 dark:bg-brand-accent dark:hover:bg-amber-400 text-white dark:text-brand-dark text-sm font-semibold rounded-xl transition-colors duration-150"
      >
        <BookOpenIcon className="h-4 w-4" />
        Continue Regular Review
      </button>

      <p className="text-xs text-gray-400 dark:text-white/30 mt-4">
        Focus Review becomes available when you encounter challenging cards during study.
      </p>
    </div>
  );
};

export default FocusReviewEmptyState;
