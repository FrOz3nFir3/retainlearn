import React from "react";
import { AcademicCapIcon } from "@heroicons/react/24/outline";

const QuizEmptyState = () => (
  <div className="bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl p-8">
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-surface dark:bg-white/8 rounded-2xl mb-4">
        <AcademicCapIcon className="h-7 w-7 text-brand-primary dark:text-brand-accent/70" />
      </div>
      <h3 className="font-heading text-2xl text-gray-900 dark:text-white mb-2">
        No quiz questions yet
      </h3>
      <p className="text-sm text-gray-500 dark:text-white/40 max-w-sm mx-auto leading-relaxed">
        Add some quizzes from the edit page to start your learning journey.
      </p>
    </div>
  </div>
);

export default QuizEmptyState;
