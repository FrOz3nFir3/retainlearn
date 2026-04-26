import React from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/solid";

const SearchBar = ({ searchTerm, handleSearchChange, handleSearchReset }) => (
  <div className="mb-8">
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 dark:text-white/30" />
      </div>
      <input
        type="text"
        placeholder="Search your flashcards..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="w-full pl-11 pr-12 py-3.5 text-sm font-medium border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-accent/20 transition-all duration-150"
      />
      {searchTerm && (
        <button
          onClick={handleSearchReset}
          className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-gray-100 dark:bg-white/8 hover:bg-gray-200 dark:hover:bg-white/12 text-gray-500 dark:text-white/40 transition-colors duration-150"
        >
          <XMarkIcon className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
    {searchTerm && (
      <p className="mt-2 text-xs text-gray-400 dark:text-white/30 pl-1">
        Searching for "{searchTerm}"
      </p>
    )}
  </div>
);

export default SearchBar;
