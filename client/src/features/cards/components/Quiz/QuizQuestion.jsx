import React from "react";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/solid";
import HtmlRenderer from "../../../../components/ui/HtmlRenderer";

const QuizQuestion = ({ questionText, current }) => {
  return (
    <div className="mb-5">
      <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-5">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-1.5 bg-brand-surface dark:bg-white/8 rounded-lg">
            <QuestionMarkCircleIcon className="h-4 w-4 text-brand-primary dark:text-brand-accent/70" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-accent">
              Question {current}
            </span>
            <p className="text-xs text-gray-400 dark:text-white/30">
              Select from the options below
            </p>
          </div>
        </div>

        {/* Question Content */}
        <div className="text-base text-gray-900 dark:text-white leading-relaxed">
          <HtmlRenderer htmlContent={questionText} />
        </div>
      </div>
    </div>
  );
};

export default QuizQuestion;
