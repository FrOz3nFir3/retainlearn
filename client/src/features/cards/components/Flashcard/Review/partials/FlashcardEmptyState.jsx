import React from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";

const FlashcardEmptyState = () => {
  return (
    <div className="rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10">
      <div className="text-center py-12 px-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-surface dark:bg-white/8 rounded-2xl mb-4">
          <MagnifyingGlassIcon className="h-6 w-6 text-brand-primary dark:text-brand-accent/70" />
        </div>
        <h3 className="font-heading text-xl text-gray-900 dark:text-white mb-1">
          No matching cards found
        </h3>
        <p className="text-sm text-gray-500 dark:text-white/40">
          Clear the search to see all cards
        </p>
      </div>
    </div>
  );
};

export default FlashcardEmptyState;
