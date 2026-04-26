import React from "react";
import {
  QuestionMarkCircleIcon,
  LightBulbIcon,
  CheckCircleIcon,
  TrophyIcon,
} from "@heroicons/react/24/solid";
import HtmlRenderer from "../../../../components/ui/HtmlRenderer";

const ReportContent = ({
  currentQuestion,
  shuffledOptions,
  slideClassName,
  currentIndex,
}) => {
  if (!currentQuestion) return null;

  return (
    <div className="px-3 sm:px-6 pb-6 overflow-x-hidden">
      <div className={slideClassName}>
        <div className="bg-white dark:bg-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200 dark:border-white/8">
          {/* Question Header */}
          <div className="mb-4">
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="p-3 bg-brand-surface dark:bg-white/8 rounded-xl sm:rounded-2xl shrink-0">
                <QuestionMarkCircleIcon className="h-5 w-5 text-brand-primary dark:text-brand-accent/70" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-0.5">
                  Question {currentIndex + 1}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Review the question and correct answer
                </p>
              </div>
            </div>

            {/* Question Content */}
            <HtmlRenderer
              className="!mt-0 text-base text-gray-900 dark:text-white"
              htmlContent={currentQuestion.question}
            />
          </div>

          {/* Answer Options */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl sm:rounded-2xl shrink-0">
                <LightBulbIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Answer Options
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  The correct answer is highlighted
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:gap-4">
              {shuffledOptions.map((option, i) => (
                <div
                  key={i}
                  className={`relative rounded-xl sm:rounded-2xl border-2 transition-colors duration-200 cursor-default ${
                    option === currentQuestion.answer
                      ? "bg-emerald-50 dark:bg-emerald-500/8 border-emerald-300 dark:border-emerald-500/30"
                      : "bg-white dark:bg-white/3 border-gray-200 dark:border-white/8 hover:border-gray-300 dark:hover:border-white/12"
                  }`}
                >
                  <div className="relative z-10 p-4 flex items-center">
                    <div
                      className={`shrink-0 w-8 h-8 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-sm sm:text-lg mr-3 sm:mr-4 ${
                        option === currentQuestion.answer
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-100 dark:bg-white/8 text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <HtmlRenderer
                        className={`!mt-0 text-sm leading-relaxed ${
                          option === currentQuestion.answer
                            ? "text-emerald-800 dark:text-emerald-200"
                            : "text-gray-800 dark:text-gray-200"
                        }`}
                        htmlContent={option}
                      />
                    </div>
                    {option === currentQuestion.answer && (
                      <div className="shrink-0 ml-3 sm:ml-4">
                        <CheckCircleIcon className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-500 dark:text-emerald-400" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hint Text */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-gray-500 dark:text-white/40 bg-gray-50 dark:bg-white/3 rounded-xl px-3 sm:px-4 py-2">
              <TrophyIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <p className="text-xs sm:text-sm font-medium">
                Performance stats are shown above
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportContent;
