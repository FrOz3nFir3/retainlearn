import React from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";

const FunFactToggle = ({ showFacts, onToggle }) => {
  return (
    <div className="px-6 pb-2 flex justify-center">
      <div className="inline-flex items-center gap-4 bg-gray-50 dark:bg-white/4 border border-gray-100 dark:border-white/6 rounded-xl px-5 py-3">
        <SparklesIcon
          className={`h-4 w-4 transition-colors duration-200 ${
            showFacts ? "text-brand-accent" : "text-gray-400 dark:text-white/30"
          }`}
        />
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-white/70">Show Fun Facts</p>
          <p className="text-xs text-gray-400 dark:text-white/30">Get interesting facts after each answer</p>
        </div>
        <button
          onClick={onToggle}
          className={`cursor-pointer relative inline-flex shrink-0 h-6 w-11 items-center rounded-full transition-colors duration-200 ${
            showFacts
              ? "bg-brand-primary dark:bg-brand-accent"
              : "bg-gray-200 dark:bg-white/10"
          }`}
        >
          <span
            className={`${
              showFacts ? "translate-x-6" : "translate-x-1"
            } inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200`}
          />
        </button>
      </div>
    </div>
  );
};

export default FunFactToggle;
