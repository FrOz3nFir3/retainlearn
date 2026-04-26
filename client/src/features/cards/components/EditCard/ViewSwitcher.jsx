import React from "react";
import {
  BookOpenIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";

const ViewSwitcher = ({
  view,
  setSearchParams,
  totalFlashcards,
  totalQuizzes,
  totalReviewQueue = 0,
}) => {
  const tabs = [
    {
      name: "Flashcards",
      view: "flashcards",
      icon: BookOpenIcon,
      count: totalFlashcards,
    },
    {
      name: "Quizzes",
      view: "quizzes",
      icon: AcademicCapIcon,
      count: totalQuizzes,
    },
    {
      name: "Review Queue",
      view: "review-queue",
      icon: ClipboardDocumentCheckIcon,
      count: totalReviewQueue,
    },
  ];

  return (
    <div className="mb-6">
      <div className="border-b border-gray-200 dark:border-white/8">
        <nav className="-mb-px flex flex-wrap gap-1 sm:gap-4" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = view === tab.view;
            return (
              <button
                key={tab.name}
                onClick={() => setSearchParams({ view: tab.view })}
                className={`cursor-pointer whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium flex items-center gap-2 transition-colors duration-150 ${
                  isActive
                    ? "border-brand-primary dark:border-brand-accent text-brand-primary dark:text-brand-accent"
                    : "border-transparent text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/70 hover:border-gray-300 dark:hover:border-white/20"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
                <span
                  className={`py-0.5 px-2 rounded-full text-xs font-semibold ${
                    isActive
                      ? "bg-brand-surface dark:bg-brand-accent/15 text-brand-primary dark:text-brand-accent"
                      : "bg-gray-100 dark:bg-white/6 text-gray-500 dark:text-white/30"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default ViewSwitcher;
