import React from "react";
import { useNavigate } from "react-router-dom";
import { FireIcon } from "@heroicons/react/24/solid";

const FocusReviewButton = ({ cardId, weakCardCount }) => {
  const navigate = useNavigate();

  // Only render if weak cards exist
  if (!weakCardCount || weakCardCount === 0) {
    return null;
  }

  const handleFocusReview = () => {
    navigate(`/card/${cardId}/focus-review`);
  };

  return (
    <button
      onClick={handleFocusReview}
      className="inline-flex items-center gap-3 px-6 py-3 bg-brand-accent hover:bg-amber-400 text-brand-dark font-semibold rounded-xl transition-colors duration-200"
    >
      <FireIcon className="w-5 h-5" />
      <span>Focus Review</span>
      <span className="bg-brand-dark/15 px-2 py-1 rounded-full text-sm font-bold">
        {weakCardCount}
      </span>
    </button>
  );
};

export default FocusReviewButton;
