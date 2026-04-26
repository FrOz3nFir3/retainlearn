import React from "react";
import { AcademicCapIcon } from "@heroicons/react/24/outline";

const QuizTips = ({ className = "" }) => {
  return (
    <div
      className={`mt-4 bg-gray-50 dark:bg-white/3 rounded-2xl border border-gray-100 dark:border-white/6 overflow-hidden ${className}`}
    >
      <div className="p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-1.5 bg-brand-surface dark:bg-white/8 rounded-lg">
            <AcademicCapIcon className="h-4 w-4 text-brand-primary dark:text-brand-accent/70" />
          </div>
          <h4 className="text-sm font-semibold text-gray-800 dark:text-white/80">
            Quiz Best Practices
          </h4>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 bg-brand-accent rounded-full mt-1.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-white/70">
                  Clear questions
                </p>
                <p className="text-xs text-gray-400 dark:text-white/30">
                  Make questions unambiguous and direct
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 bg-brand-accent rounded-full mt-1.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-white/70">
                  Balanced options
                </p>
                <p className="text-xs text-gray-400 dark:text-white/30">
                  Make all choices plausible but distinct
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 bg-brand-accent rounded-full mt-1.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-white/70">
                  One correct answer
                </p>
                <p className="text-xs text-gray-400 dark:text-white/30">
                  Ensure only one option is clearly correct
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 bg-brand-accent rounded-full mt-1.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-white/70">
                  Test understanding
                </p>
                <p className="text-xs text-gray-400 dark:text-white/30">
                  Focus on comprehension, not memorization
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizTips;
