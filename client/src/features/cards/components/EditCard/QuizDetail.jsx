import React from "react";
import {
  PencilIcon,
  TrashIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import { AcademicCapIcon } from "@heroicons/react/24/solid";
import QuizItem from "./QuizItem";
import QuizTips from "./QuizTips";

const QuizDetail = ({
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
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-surface dark:bg-white/8 rounded-2xl mb-4">
          <AcademicCapIcon className="h-6 w-6 text-brand-primary dark:text-brand-accent/70" />
        </div>
        <h3 className="font-heading text-xl text-gray-900 dark:text-white mb-1">
          No Quiz Selected
        </h3>
        <p className="text-sm text-gray-500 dark:text-white/40 max-w-sm mx-auto">
          Select a quiz from the list to view its details.
        </p>
      </div>
    );
  }

  return (
    <div className="py-1 overflow-hidden">
      {/* Quiz Header */}
      <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-surface dark:bg-white/8 rounded-xl">
            <AcademicCapIcon className="h-5 w-5 text-brand-primary dark:text-brand-accent/70" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent">Quiz</p>
            <h2 className="font-heading text-xl text-gray-900 dark:text-white">
              #{originalQuizIndex || currentIndex + 1}
            </h2>
          </div>
        </div>

        <div className="flex justify-end items-center gap-2 flex-wrap">
          <button
            onClick={() => onEdit(quiz)}
            className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-brand-primary hover:bg-indigo-700 dark:bg-brand-accent dark:hover:bg-amber-400 text-white dark:text-brand-dark rounded-xl text-sm font-semibold transition-colors duration-150"
            aria-label="Edit Quiz"
          >
            <PencilIcon className="h-4 w-4" />
            Edit
          </button>

          {hasMultipleQuizzes && (
            <button
              onClick={onReorder}
              className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-transparent border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl text-sm font-medium transition-colors duration-150"
              aria-label="Reorder Quizzes"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
              Reorder
            </button>
          )}

          <button
            onClick={() => onDelete(quiz)}
            className="cursor-pointer p-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-400 dark:text-white/30 hover:text-red-500 hover:border-red-200 dark:hover:text-red-400 dark:hover:border-red-500/20 transition-colors duration-150"
            aria-label="Delete quiz"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <QuizItem quiz={quiz} />
      <QuizTips className="mt-8" />
    </div>
  );
};

export default QuizDetail;
