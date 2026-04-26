import React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import NavigationDropdown from "../../../cards/components/EditCard/NavigationDropdown";
import { getTextFromHtml } from "../../../../utils/dom";

const ReportNavigation = ({
  onPrev,
  onNext,
  onQuestionSelect,
  currentIndex,
  totalQuestions,
  report,
}) => {
  const getQuestionLabel = (question, index) => {
    return `Question ${index + 1}`;
  };

  const getQuestionDescription = (question) => {
    if (!question?.question) return "";
    const plainText = getTextFromHtml(question.question);
    return plainText;
  };

  return (
    <div className="sticky top-0 z-[100] bg-gray-50 dark:bg-[#14112a] border-b border-gray-200 dark:border-white/6">
      <div className="px-3 sm:px-6 py-3">
        <div className="bg-white dark:bg-white/5 rounded-2xl p-3 sm:p-4 border border-gray-200 dark:border-white/8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Left: Navigation Buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={onPrev}
                disabled={currentIndex === 0}
                className="cursor-pointer p-2 rounded-xl bg-brand-primary dark:bg-brand-accent text-white dark:text-brand-dark disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 dark:hover:bg-amber-400 transition-colors duration-150"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>

              <div className="px-4 py-2 bg-brand-surface dark:bg-white/8 rounded-xl border border-amber-200 dark:border-white/10">
                <span className="text-sm font-bold text-gray-800 dark:text-white/80">
                  {currentIndex + 1} of {totalQuestions}
                </span>
              </div>

              <button
                onClick={onNext}
                disabled={currentIndex === totalQuestions - 1}
                className="cursor-pointer p-2 rounded-xl bg-brand-primary dark:bg-brand-accent text-white dark:text-brand-dark disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 dark:hover:bg-amber-400 transition-colors duration-150"
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Right: Go to Question Dropdown */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600 dark:text-white/40">
                Go to:
              </span>
              <NavigationDropdown
                items={report}
                currentIndex={currentIndex}
                onItemSelect={onQuestionSelect}
                placeholder="Select question..."
                getItemLabel={getQuestionLabel}
                getItemDescription={getQuestionDescription}
                type="quiz"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportNavigation;
