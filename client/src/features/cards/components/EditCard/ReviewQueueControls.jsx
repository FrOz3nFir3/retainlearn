import React from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

const ReviewQueueControls = ({
  searchTerm,
  onSearchChange,
  totalCount,
  filteredCount,
}) => {
  const handleReset = () => {
    // Create a synthetic event to match the expected interface
    const syntheticEvent = {
      target: { value: "" },
    };
    onSearchChange(syntheticEvent);
  };

  return (
    <div className="bg-white dark:bg-[#14112a] rounded-xl border border-gray-200 dark:border-white/8 p-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search Input */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-white/30" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={onSearchChange}
              placeholder="Search review items..."
              className="block w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-accent/20 transition-all duration-200"
            />
            {searchTerm && (
              <button
                onClick={handleReset}
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-white/60 transition-colors duration-200"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Count Display */}
        <div className="flex items-center gap-4 text-sm">
          <div className="text-gray-600 dark:text-white/40">
            {searchTerm ? (
              <>
                Showing{" "}
                <span className="font-semibold text-brand-primary dark:text-brand-accent">
                  {filteredCount}
                </span>{" "}
                of <span className="font-semibold">{totalCount}</span> review
                items
              </>
            ) : (
              <>
                <span className="font-semibold text-brand-primary dark:text-brand-accent">
                  {totalCount}
                </span>{" "}
                review items
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewQueueControls;
