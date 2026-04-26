import React, { useState } from "react";
import { useSelector } from "react-redux";
import { selectCurrentCard } from "../../state/cardSlice";
import { useQuizSession } from "../../hooks/useQuizSession";

import QuizResults from "./QuizResults";
import QuizSession from "./QuizSession";
import QuizEmptyState from "./QuizEmptyState";

function QuizView() {
  const card = useSelector(selectCurrentCard);
  const [isFinished, setIsFinished] = useState(false);

  const handleFinish = () => setIsFinished(true);

  const session = useQuizSession(card, handleFinish);

  const handleRestart = () => {
    session.restartQuiz();
    setIsFinished(false);
  };

  if (!card || !session.quizzes || session.quizzes.length === 0) {
    return <QuizEmptyState />;
  }

  if (isFinished) {
    return (
      <QuizResults
        score={session.score}
        totalQuestions={session.quizzes.length}
        onRestart={handleRestart}
        cardId={card._id}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl overflow-hidden">
      <QuizSession session={session} cardId={card._id} />
    </div>
  );
}

export default QuizView;
