import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { apiSlice } from "../../../../../api/apiSlice";
import {
  FireIcon,
  CheckBadgeIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

const FocusReviewCompletion = ({
  completedCardsCount,
  totalFocusCards = 0,
  allWeakCardsMastered = false,
  perfectCards = new Set(),
  totalWeakCards = 0,
  restartFocusReview,
}) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch();

  const handleStartNormalReview = () => {
    navigate(`/card/${id}/review`);
  };

  const handleRetryFocusReview = () => {
    dispatch(
      apiSlice.util.invalidateTags([
        { type: "FocusReviewData", id: id },
        { type: "FocusReviewData", id: "LIST" },
      ])
    );
    if (restartFocusReview) restartFocusReview();
  };

  const perfectScore = perfectCards.size;
  const masteredAllCards =
    allWeakCardsMastered || completedCardsCount === totalFocusCards;
  const hasLowCompletion =
    totalWeakCards > 0 &&
    (completedCardsCount < totalWeakCards || perfectScore < totalWeakCards);
  const showRetryButton = hasLowCompletion && restartFocusReview;

  const headingText = masteredAllCards
    ? "Outstanding!"
    : hasLowCompletion
    ? "Good progress!"
    : "Focus session complete!";

  return (
    <div className="px-6 pb-6 flex justify-center">
      <div className="bg-gray-50 dark:bg-white/4 border border-gray-100 dark:border-white/6 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-brand-surface dark:bg-white/8 rounded-2xl">
            {masteredAllCards ? (
              <CheckBadgeIcon className="h-10 w-10 text-emerald-500" />
            ) : (
              <FireIcon className="h-10 w-10 text-brand-accent" />
            )}
          </div>
        </div>

        <h3 className="font-heading text-2xl text-gray-900 dark:text-white mb-2">
          {headingText}
        </h3>

        <div className="text-sm text-gray-500 dark:text-white/40 mb-6 space-y-1">
          {masteredAllCards ? (
            <>
              <p>You've mastered all your challenging cards in this session.</p>
              {completedCardsCount > 0 && (
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {completedCardsCount} cards mastered and removed from your focus list.
                </p>
              )}
            </>
          ) : hasLowCompletion ? (
            <>
              <p>You've made progress on your challenging cards.</p>
              {perfectScore > 0 && (
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {perfectScore} cards mastered perfectly!
                </p>
              )}
              {totalWeakCards > completedCardsCount && (
                <p className="text-brand-accent">
                  {totalWeakCards - completedCardsCount} more cards available to practise
                </p>
              )}
            </>
          ) : (
            <>
              <p>Great work on your targeted practice session.</p>
              {completedCardsCount > 0 && (
                <p>You worked through {completedCardsCount} challenging cards.</p>
              )}
            </>
          )}
        </div>

        <div className="space-y-2.5">
          {showRetryButton && (
            <button
              onClick={handleRetryFocusReview}
              className="cursor-pointer w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm font-semibold rounded-xl hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors duration-150"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Review Again
            </button>
          )}

          <button
            onClick={handleStartNormalReview}
            className="cursor-pointer w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand-primary hover:bg-indigo-700 dark:bg-brand-accent dark:hover:bg-amber-400 text-white dark:text-brand-dark text-sm font-semibold rounded-xl transition-colors duration-150"
          >
            {masteredAllCards ? "Continue Regular Review" : "Switch to Regular Review"}
          </button>
        </div>

        <p className="text-xs text-gray-400 dark:text-white/30 mt-4">
          {masteredAllCards
            ? "Keep up the regular practice to maintain your mastery."
            : "Keep practising regularly to master all your challenging cards."}
        </p>
      </div>
    </div>
  );
};

export default FocusReviewCompletion;
