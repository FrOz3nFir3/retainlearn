import React from "react";
import {
  QuestionMarkCircleIcon,
  HashtagIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import { LightBulbIcon } from "@heroicons/react/24/solid";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import HtmlRenderer from "../../../../components/ui/HtmlRenderer";

const SectionLabel = ({ icon: Icon, label, desc, accentClass }) => (
  <div className="flex items-center gap-2.5 mb-3">
    <div className={`p-1.5 rounded-lg ${accentClass}`}>
      <Icon className="h-4 w-4" />
    </div>
    <div>
      <p className="text-sm font-semibold text-gray-700 dark:text-white/70">{label}</p>
      {desc && <p className="text-xs text-gray-400 dark:text-white/30">{desc}</p>}
    </div>
  </div>
);

const QuizItem = ({ quiz }) => {
  if (!quiz) return null;

  const { quizQuestion, quizAnswer, options, minimumOptions } = quiz;

  const otherOptions = (options || []).filter((opt) => opt.value !== quizAnswer);
  const correctAnswerOption = { value: quizAnswer, isCorrect: true };
  const finalOptions = [correctAnswerOption, ...otherOptions];

  return (
    <div className="space-y-6">
      {/* Question */}
      <div>
        <SectionLabel
          icon={QuestionMarkCircleIcon}
          label="Question"
          desc="What will be asked in the quiz"
          accentClass="bg-brand-primary/10 dark:bg-white/8 text-brand-primary dark:text-brand-accent/70"
        />
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/4 border border-gray-200 dark:border-white/8">
          <HtmlRenderer htmlContent={quizQuestion} />
        </div>
      </div>

      {/* Correct Answer */}
      <div>
        <SectionLabel
          icon={LightBulbIcon}
          label="Correct Answer"
          desc="The right answer to the question"
          accentClass="bg-brand-surface dark:bg-white/8 text-brand-accent"
        />
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
          <HtmlRenderer htmlContent={quizAnswer} />
        </div>
      </div>

      {/* Minimum Options */}
      <div>
        <SectionLabel
          icon={HashtagIcon}
          label="Minimum Options"
          desc="Required number of answer choices"
          accentClass="bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-white/40"
        />
        <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/4 border border-gray-200 dark:border-white/8 inline-flex items-center gap-2">
          <span className="font-heading text-2xl font-bold text-brand-accent">
            {minimumOptions || 2}
          </span>
          <span className="text-sm text-gray-500 dark:text-white/40">options minimum</span>
        </div>
      </div>

      {/* Answer Options */}
      <div>
        <SectionLabel
          icon={ListBulletIcon}
          label="Answer Options"
          desc={`All possible choices (${finalOptions.length} total)`}
          accentClass="bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-white/40"
        />
        <div className="space-y-2">
          {finalOptions.map((option, index) => {
            const isCorrect = option.value === quizAnswer;
            return (
              <div
                key={index}
                className={`p-4 rounded-xl border ${
                  isCorrect
                    ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
                    : "bg-white dark:bg-white/3 border-gray-200 dark:border-white/8"
                }`}
              >
                <div className="flex items-start gap-3">
                  {isCorrect && (
                    <CheckCircleIcon className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    {isCorrect && (
                      <span className="inline-block text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                        Correct
                      </span>
                    )}
                    <HtmlRenderer
                      className="mt-0!"
                      htmlContent={option.value}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuizItem;
