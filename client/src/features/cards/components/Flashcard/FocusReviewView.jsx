import React, { useEffect } from "react";
import { useFocusSession } from "../../hooks/useFocusSession";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../authentication/state/authSlice";
import FocusReviewEmptyState from "./Review/FocusReviewEmptyState";
import FocusReviewSession from "./Review/FocusReviewSession";

function FocusReviewView({ card, onCardMastered }) {
  const { review = [], weakCards = [] } = card ?? {};
  const user = useSelector(selectCurrentUser);
  const session = useFocusSession(review, card?._id, weakCards, onCardMastered);

  useEffect(() => {
    if (session.showCompletion || session.hasNoWeakCards) return;

    const handleKeyDown = (event) => {
      if (event.key === "ArrowRight") session.handleNext();
      else if (event.key === "ArrowLeft") session.handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    session.showCompletion,
    session.hasNoWeakCards,
    session.handleNext,
    session.handlePrev,
  ]);

  if (!user || session.hasNoWeakCards) {
    const hasReviewData = card?.reviewLength > 0;
    return <FocusReviewEmptyState hasReviewData={hasReviewData} />;
  }

  return (
    <div className="bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl overflow-hidden">
      <FocusReviewSession
        focusCards={session.focusCards}
        session={session}
        key={`session-${card?._id}-${weakCards?.length || 0}`}
      />
    </div>
  );
}

export default FocusReviewView;
