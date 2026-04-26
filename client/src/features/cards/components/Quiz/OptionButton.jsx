import React from "react";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import HtmlRenderer from "../../../../components/ui/HtmlRenderer";

const OptionButton = ({ option, answer, selectedAnswer, onSelect, index }) => {
  const isSelected = selectedAnswer?.option === option;
  const isCorrectAnswer = answer === option;
  const optionLabels = ["A", "B", "C", "D", "E", "F"];

  let stateClasses = "";

  if (selectedAnswer) {
    if (isCorrectAnswer) {
      stateClasses = `bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200 ${
        isSelected ? "ring-2 ring-emerald-300 dark:ring-emerald-500/40" : ""
      }`;
    } else if (isSelected) {
      stateClasses =
        "bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/40 text-red-900 dark:text-red-200 ring-2 ring-red-300 dark:ring-red-500/40";
    } else {
      stateClasses =
        "bg-gray-50 dark:bg-white/3 border-gray-200 dark:border-white/8 text-gray-400 dark:text-white/25 cursor-not-allowed opacity-50";
    }
  } else {
    stateClasses =
      "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-brand-primary/40 dark:hover:border-brand-accent/40 hover:bg-gray-50 dark:hover:bg-white/8 text-gray-900 dark:text-white transition-all duration-150";
  }

  return (
    <button
      onClick={() => onSelect(option)}
      disabled={!!selectedAnswer}
      className={`cursor-pointer w-full text-left p-4 rounded-xl border-2 focus:outline-none ${stateClasses}`}
    >
      <div className="flex items-center gap-3">
        {/* Option Label */}
        <div
          className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-colors duration-150 ${
            selectedAnswer
              ? isCorrectAnswer
                ? "bg-emerald-500 text-white"
                : isSelected
                ? "bg-red-500 text-white"
                : "bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-white/30"
              : "bg-brand-surface dark:bg-white/8 text-brand-primary dark:text-brand-accent/70"
          }`}
        >
          {optionLabels[index] || index + 1}
        </div>

        {/* Option Content */}
        <div className="w-0 grow">
          <HtmlRenderer className="max-w-full mt-0!" htmlContent={option} />
        </div>

        {/* Result Icon */}
        {selectedAnswer && (
          <div className="shrink-0 h-5 w-5">
            {isCorrectAnswer ? (
              <CheckCircleIcon className="text-emerald-500" />
            ) : isSelected ? (
              <XCircleIcon className="text-red-500" />
            ) : null}
          </div>
        )}
      </div>
    </button>
  );
};

export default OptionButton;
