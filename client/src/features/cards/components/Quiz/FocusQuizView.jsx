import React, { useEffect } from "react";
import { useFocusQuiz } from "../../hooks/useFocusQuiz";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../authentication/state/authSlice";
import FocusQuizEmptyState from "./FocusQuizEmptyState";
import FocusQuizSession from "./FocusQuizSession";

function FocusQuizView({ card, onQuizMastered }) {
  const { quizzes = [], strugglingQuizzes = [] } = card ?? {};
  const user = useSelector(selectCurrentUser);
  const session = useFocusQuiz(card, card?._id, strugglingQuizzes, onQuizMastered);

  useEffect(() => {
    if (session.showCompletion || session.hasNoStrugglingQuizzes) return;

    const handleKeyDown = (event) => {
      // Respect navigation boundaries for keyboard navigation
      if (event.key === "ArrowRight" && !session.isLastQuestion) {
        session.handleNext();
      } else if (event.key === "ArrowLeft" && !session.isFirstQuestion) {
        session.handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    session.showCompletion,
    session.hasNoStrugglingQuizzes,
    session.handleNext,
    session.handlePrev,
    session.isFirstQuestion,
    session.isLastQuestion,
  ]);

  // Show empty state if user has no struggling quizzes
  if (!user || session.hasNoStrugglingQuizzes) {
    // Check if user has quiz data (quizzesLength > 0 indicates they've done quizzes)
    const hasQuizData = card?.quizzesLength > 0;
    return <FocusQuizEmptyState hasQuizData={hasQuizData} />;
  }

  return (
    <div className="bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl overflow-hidden">
      <FocusQuizSession
        focusQuizzes={session.focusQuizzes}
        session={session}
        key={`session-${card?._id}-${strugglingQuizzes?.length || 0}`}
      />
    </div>
  );
}

export default FocusQuizView;