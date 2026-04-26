import React from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/solid";

const SearchComponent = ({
  searchTerm,
  handleSearchChange,
  handleSearchReset,
}) => {
  return (
    <div className="relative w-full sm:max-w-sm">
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
      </div>
      <input
        type="text"
        placeholder="Search cards..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="w-full pl-12 pr-12 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-accent/20 transition-all duration-200 text-sm font-medium"
      />
      {searchTerm && (
        <button
          onClick={handleSearchReset}
          className="cursor-pointer absolute inset-y-0 right-0 flex items-center pr-4 group z-10"
          aria-label="Clear search"
        >
          <div className="p-1 rounded-full bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
            <XMarkIcon className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200" />
          </div>
        </button>
      )}
    </div>
  );
};

export default SearchComponent;
