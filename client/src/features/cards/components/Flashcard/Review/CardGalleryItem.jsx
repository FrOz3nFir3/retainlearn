import React from "react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { getTextFromHtml } from "../../../../../utils/dom";

const CardGalleryItem = ({
  item,
  isSelected,
  handleOnClick,
  isFilteredOut,
}) => {
  return (
    <button
      onClick={handleOnClick}
      disabled={isFilteredOut}
      title={`Click to select: ${getTextFromHtml(item.question).substring(0, 50)}...`}
      className={`cursor-pointer shrink-0 w-40 h-28 p-3 rounded-xl text-left text-xs font-medium transition-colors duration-150 relative overflow-hidden border-2
        ${
          isSelected
            ? "bg-brand-primary dark:bg-brand-dark border-brand-primary dark:border-brand-accent text-white"
            : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/60 hover:border-brand-primary/40 dark:hover:border-brand-accent/40 hover:bg-gray-50 dark:hover:bg-white/8"
        }
        ${isFilteredOut ? "opacity-30 cursor-not-allowed!" : "opacity-100"}
      `}
    >
      <div className="flex flex-col justify-between h-full">
        <div className="flex-1 flex items-center justify-center">
          <p className={`text-xs leading-tight line-clamp-4 text-center ${isSelected ? "text-white/90" : ""}`}>
            {getTextFromHtml(item.question)}
          </p>
        </div>

        {isSelected && (
          <div className="absolute top-1.5 right-1.5">
            <CheckCircleIcon className="h-3.5 w-3.5 text-white/80" />
          </div>
        )}
      </div>
    </button>
  );
};

export default CardGalleryItem;
