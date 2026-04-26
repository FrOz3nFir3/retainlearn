import React from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  FireIcon,
} from "@heroicons/react/24/outline";
import { getTextFromHtml } from "../../../../utils/dom";

const FocusQuizGallery = ({
  quizzes,
  currentQuestion,
  handleQuizSelect,
  currentQuestionIndex,
  selectedAnswer,
}) => {
  if (!quizzes || quizzes.length <= 1) return null;

  return (
    <div className="mt-6 px-6 pb-6">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-white/70 mb-0.5">
          Question gallery
        </h3>
        <p className="text-xs text-gray-400 dark:text-white/30">
          Navigate through questions — go back to re-attempt or skip ahead
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-64 overflow-y-auto p-3 bg-gray-50 dark:bg-white/3 border border-gray-100 dark:border-white/6 rounded-2xl">
        {quizzes.map((quiz, index) => {
          const isCurrentQuestion = currentQuestion?._id === quiz._id;
          const questionNumber = index + 1;

          let statusIcon = null;
          let activeClass = "";

          if (isCurrentQuestion && selectedAnswer) {
            if (selectedAnswer.isCorrect) {
              statusIcon = <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" />;
              activeClass = "border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10";
            } else {
              statusIcon = <XCircleIcon className="h-3.5 w-3.5 text-red-500" />;
              activeClass = "border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10";
            }
          } else if (isCurrentQuestion) {
            statusIcon = <FireIcon className="h-3.5 w-3.5 text-brand-accent" />;
            activeClass = "border-brand-primary dark:border-brand-accent bg-brand-surface dark:bg-brand-accent/10";
          }

          const plainText = getTextFromHtml(quiz.quizQuestion);

          return (
            <button
              key={quiz._id}
              onClick={() => handleQuizSelect(index)}
              className={`cursor-pointer relative p-3 rounded-xl border-2 text-left transition-colors duration-150 focus:outline-none ${
                isCurrentQuestion
                  ? activeClass
                  : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-brand-primary/30 dark:hover:border-brand-accent/30"
              }`}
              title={`Question ${questionNumber}: ${plainText?.substring(0, 50)}...`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-gray-700 dark:text-white/70">
                  Q{questionNumber}
                </span>
                {statusIcon}
              </div>
              <p className="text-xs text-gray-500 dark:text-white/40 line-clamp-2 leading-relaxed">
                {plainText || "Question content"}
              </p>
              {/* Struggling indicator dot */}
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand-accent rounded-full" title="Struggling question" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FocusQuizGallery;
