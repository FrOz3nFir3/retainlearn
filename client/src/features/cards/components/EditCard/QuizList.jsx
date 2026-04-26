import React from "react";
import QuizDetail from "./QuizDetail";
import { AcademicCapIcon } from "@heroicons/react/24/outline";

const QuizList = ({
  quiz,
  onEdit,
  onDelete,
  onReorder,
  originalQuizIndex,
  currentIndex,
  hasMultipleQuizzes = false,
}) => {
  if (!quiz) {
    return (
      <div className="text-center py-16 border-t border-gray-100 dark:border-white/6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-surface dark:bg-white/8 rounded-2xl mb-4">
          <AcademicCapIcon className="h-6 w-6 text-brand-primary dark:text-brand-accent/70" />
        </div>
        <h3 className="font-heading text-xl text-gray-900 dark:text-white mb-1">
          No quiz found
        </h3>
        <p className="text-sm text-gray-500 dark:text-white/40 max-w-sm mx-auto">
          Try a different search term, or create a new quiz to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <QuizDetail
        quiz={quiz}
        onEdit={onEdit}
        onDelete={onDelete}
        onReorder={onReorder}
        originalQuizIndex={originalQuizIndex}
        currentIndex={currentIndex}
        hasMultipleQuizzes={hasMultipleQuizzes}
      />
    </div>
  );
};

export default QuizList;
