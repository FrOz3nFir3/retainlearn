import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../authentication/state/authSlice";
import { useReviewSession } from "../../hooks/useReviewSession";
import ReviewEmptyState from "./Review/ReviewEmptyState";
import ReviewSession from "./Review/ReviewSession";

function Review({ card }) {
  const { review = [] } = card ?? {};
  const user = useSelector(selectCurrentUser);
  const session = useReviewSession(review, card?._id);

  useEffect(() => {
    if (session.showCompletion) return;

    const handleKeyDown = (event) => {
      if (event.key === "ArrowRight") session.handleNext();
      else if (event.key === "ArrowLeft") session.handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [session.showCompletion, session.handleNext, session.handlePrev]);

  if (!review || review.length === 0) {
    return <ReviewEmptyState />;
  }

  return (
    <div className="bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl overflow-hidden">
      <ReviewSession review={review} session={session} cardId={card?._id} />
    </div>
  );
}

export default Review;
