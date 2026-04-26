import React from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

const FlashcardControls = ({ searchTerm, onSearchChange, onReset }) => {
  return (
    <div>
      {/* Search Header */}
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-0.5">
          Explore
        </p>
        <h2 className="font-heading text-xl text-gray-900 dark:text-white">
          Flashcard Explorer
        </h2>
        <p className="text-sm text-gray-500 dark:text-white/40 mt-1">
          Search or navigate through your flashcards to find what you need.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 dark:text-white/30" />
        </div>
        <input
          type="text"
          placeholder="Search by questions or answers..."
          value={searchTerm}
          onChange={onSearchChange}
          className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-accent/20 transition-all duration-150"
        />
      </div>

      {/* Search Active Indicator */}
      {searchTerm && (
        <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-surface dark:bg-brand-accent/10 rounded-lg border border-brand-primary/15 dark:border-brand-accent/15">
            <span className="text-sm font-medium text-brand-primary dark:text-brand-accent">
              Searching for "{searchTerm}"
            </span>
          </div>
          <button
            onClick={onReset}
            className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-500 dark:text-white/40 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors duration-150"
          >
            <XMarkIcon className="h-3.5 w-3.5" />
            Clear search
          </button>
        </div>
      )}
    </div>
  );
};

export default FlashcardControls;
