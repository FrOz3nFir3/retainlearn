import React from "react";
import { ChartBarIcon, XMarkIcon } from "@heroicons/react/24/solid";
import {
  FolderIcon,
  HashtagIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

const ReportHeader = ({ cardData, onClose }) => {
  if (!cardData) return null;

  return (
    <div className="bg-white dark:bg-white/3 border-b border-gray-200 dark:border-white/6 rounded-t-2xl sm:rounded-t-3xl">
      <div className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex justify-between items-start mb-3 sm:mb-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 sm:p-3 bg-brand-surface dark:bg-white/8 rounded-xl sm:rounded-2xl shrink-0">
              <ChartBarIcon className="h-5 w-5 sm:h-7 sm:w-7 text-brand-primary dark:text-brand-accent/70" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-0.5">
                Performance
              </p>
              <h2 className="text-lg sm:text-2xl font-heading text-gray-900 dark:text-white">
                Quiz Performance Report
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/8 transition-colors duration-150 shrink-0"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-white/40" />
          </button>
        </div>

        <div className="bg-gray-50 dark:bg-white/3 rounded-xl p-3 sm:p-4 border border-gray-100 dark:border-white/6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Category */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg shrink-0">
                <FolderIcon className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-gray-500 dark:text-white/40 uppercase tracking-wide">
                  Category
                </span>
                <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-white/80 truncate">
                  {cardData.category}
                </span>
              </div>
            </div>

            {/* Main Topic */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-brand-surface dark:bg-white/8 rounded-lg shrink-0">
                <HashtagIcon className="h-3 w-3 sm:h-4 sm:w-4 text-brand-primary dark:text-brand-accent/70" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-gray-500 dark:text-white/40 uppercase tracking-wide">
                  Main Topic
                </span>
                <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-white/80 truncate">
                  {cardData["main-topic"]}
                </span>
              </div>
            </div>

            {/* Sub Topic */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg shrink-0">
                <TagIcon className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-gray-500 dark:text-white/40 uppercase tracking-wide">
                  Sub Topic
                </span>
                <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-white/80 truncate">
                  {cardData["sub-topic"]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportHeader;
