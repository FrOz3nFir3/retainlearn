import React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

const Navigation = ({
  handlePrev,
  handleNext,
  currentIndex,
  filteredReviewLength,
  progressPercentage,
  showEditIcon = true,
}) => {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleEdit = () => {
    navigate(`/card/${params.id}/edit?view=flashcards&${searchParams}`);
  };

  return (
    <div className="px-6 pb-6 mt-4">
      <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {currentIndex + 1} of {filteredReviewLength}
            </span>
            <span className="text-xs text-gray-400 dark:text-white/30">
              · {Math.round(progressPercentage)}%
            </span>
          </div>
          {showEditIcon && (
            <button
              className="cursor-pointer p-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:border-brand-primary/30 dark:hover:border-brand-accent/30 text-gray-400 dark:text-white/30 hover:text-brand-primary dark:hover:text-brand-accent transition-colors duration-150"
              onClick={handleEdit}
              title="Edit flashcards"
            >
              <PencilSquareIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={currentIndex <= 0}
            className="cursor-pointer p-2.5 bg-brand-primary dark:bg-brand-accent rounded-xl text-white dark:text-brand-dark disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-700 dark:hover:bg-amber-400 transition-colors duration-150"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex >= filteredReviewLength - 1}
            className="cursor-pointer p-2.5 bg-brand-primary dark:bg-brand-accent rounded-xl text-white dark:text-brand-dark disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-700 dark:hover:bg-amber-400 transition-colors duration-150"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 dark:bg-white/8 rounded-full h-1.5">
        <div
          className="bg-brand-primary h-1.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5 text-xs text-gray-400 dark:text-white/30">
        <span>Start</span>
        <span>Complete</span>
      </div>
    </div>
  );
};

export default Navigation;
