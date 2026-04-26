import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../../authentication/state/authSlice";
import { TrophyIcon, FireIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

const ReviewCompletion = ({ onRestart, completedCardsCount }) => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const { id } = useParams();

  const handleFocusReview = () => {
    navigate(`/card/${id}/focus-review`);
  };

  return (
    <div className="px-6 pb-6 flex justify-center">
      <div className="bg-gray-50 dark:bg-white/4 border border-gray-100 dark:border-white/6 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-brand-surface dark:bg-white/8 rounded-2xl">
            <TrophyIcon className="h-10 w-10 text-brand-accent" />
          </div>
        </div>

        <h3 className="font-heading text-2xl text-gray-900 dark:text-white mb-2">
          Session complete!
        </h3>

        <p className="text-sm text-gray-500 dark:text-white/40 mb-1">
          You've finished this review session.
        </p>
        {completedCardsCount > 0 && (
          <p className="text-sm font-semibold text-brand-accent mb-6">
            {completedCardsCount} card{completedCardsCount !== 1 ? "s" : ""} mastered
          </p>
        )}
        {completedCardsCount === 0 && <div className="mb-6" />}

        <div className="space-y-2.5">
          {user && (
            <button
              onClick={handleFocusReview}
              className="cursor-pointer w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm font-semibold rounded-xl hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors duration-150"
            >
              <FireIcon className="h-4 w-4" />
              Do Focus Review
            </button>
          )}

          <button
            onClick={onRestart}
            className="cursor-pointer w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand-primary hover:bg-indigo-700 dark:bg-brand-accent dark:hover:bg-amber-400 text-white dark:text-brand-dark text-sm font-semibold rounded-xl transition-colors duration-150"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Review Again
          </button>

          <p className="text-xs text-gray-400 dark:text-white/30 pt-1">
            Try Quiz Mode below for a different challenge
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReviewCompletion;
