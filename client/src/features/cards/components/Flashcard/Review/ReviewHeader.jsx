import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpenIcon, FireIcon } from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../../authentication/state/authSlice";

const ReviewHeader = ({ showCompletion = false, cardId }) => {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  const handleFocusReview = () => {
    navigate(`/card/${cardId}/focus-review`);
  };

  return (
    <div className="px-6 pt-6 pb-4 mb-2">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-brand-surface dark:bg-white/8 rounded-xl">
            <BookOpenIcon className="h-6 w-6 text-brand-primary dark:text-brand-accent/70" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-0.5">
              Study mode
            </p>
            <h2 className="font-heading text-2xl text-gray-900 dark:text-white leading-tight">
              Review Session
            </h2>
          </div>
        </div>

        {!showCompletion && (
          <button
            disabled={!user}
            onClick={handleFocusReview}
            title={!user ? "Sign in to use Focus Review" : undefined}
            className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm font-semibold rounded-xl hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors duration-150"
          >
            <FireIcon className="w-4 h-4" />
            Focus Review
          </button>
        )}
      </div>
    </div>
  );
};

export default ReviewHeader;
