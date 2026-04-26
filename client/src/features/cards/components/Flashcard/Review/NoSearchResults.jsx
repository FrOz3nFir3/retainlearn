import React from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const NoSearchResults = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center h-[180px] px-8">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-surface dark:bg-white/8 rounded-2xl mb-3">
        <MagnifyingGlassIcon className="h-5 w-5 text-brand-primary dark:text-brand-accent/70" />
      </div>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-white/70 mb-1">
        No cards match your search
      </h3>
      <p className="text-xs text-gray-400 dark:text-white/30 max-w-xs">
        Try different keywords or clear your search
      </p>
    </div>
  );
};

export default NoSearchResults;
