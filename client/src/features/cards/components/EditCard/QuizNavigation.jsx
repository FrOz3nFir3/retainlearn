import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import NavigationDropdown from "./NavigationDropdown";
import { getTextFromHtml } from "../../../../utils/dom";

const QuizNavigation = ({
  onPrev,
  onNext,
  currentIndex,
  totalCount,
  disabled,
  searchTerm,
  selectedFlashcardId,
  quizzes = [],
  onQuizSelect,
  quizMap = new Map(),
}) => {
  const getQuizLabel = (quiz) => {
    const originalIndex = quizMap.get(quiz._id);
    return `Quiz ${originalIndex + 1}`;
  };

  const getQuizDescription = (quiz) => {
    if (!quiz?.quizQuestion) return "";
    const plainText = getTextFromHtml(quiz.quizQuestion);
    return plainText;
  };

  return (
    <div className="bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl p-4">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Navigation Buttons + Counter */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPrev}
            disabled={disabled || currentIndex === 0}
            className="cursor-pointer p-2 rounded-xl bg-brand-primary dark:bg-brand-accent text-white dark:text-brand-dark disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-700 dark:hover:bg-amber-400 transition-colors duration-150"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>

          <div className="px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {currentIndex + 1} of {totalCount}
            </span>
            {(searchTerm || selectedFlashcardId) && (
              <span className="text-xs text-gray-400 dark:text-white/30 ml-2">
                (filtered)
              </span>
            )}
          </div>

          <button
            onClick={onNext}
            disabled={disabled || currentIndex === totalCount - 1}
            className="cursor-pointer p-2 rounded-xl bg-brand-primary dark:bg-brand-accent text-white dark:text-brand-dark disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-700 dark:hover:bg-amber-400 transition-colors duration-150"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Go to Dropdown */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-400 dark:text-white/30">Go to:</span>
          <NavigationDropdown
            items={quizzes}
            currentIndex={currentIndex}
            onItemSelect={onQuizSelect}
            placeholder="Select quiz..."
            getItemLabel={getQuizLabel}
            getItemDescription={getQuizDescription}
            type="quiz"
          />
        </div>
      </div>
    </div>
  );
};

export default QuizNavigation;
