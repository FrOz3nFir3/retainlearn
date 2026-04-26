import React from "react";
import { Link } from "react-router-dom";
import {
  RectangleStackIcon,
  ChevronRightIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import { FolderIcon as FolderIconSolid } from "@heroicons/react/24/solid";

const CategoryBreadcrumbs = ({ categoryName }) => {
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      container.scrollBy({ left: container.scrollWidth, behavior: "smooth" });
    }
  }, [categoryName]);

  if (!categoryName) return null;

  return (
    <nav className="mb-8 overflow-hidden" aria-label="Breadcrumb">
      <div
        className="overflow-x-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        ref={containerRef}
      >
        <ol className="flex items-center gap-1 text-sm min-w-max py-1">
          {/* Home */}
          <li className="shrink-0">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/6 transition-colors duration-150"
            >
              <HomeIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium">Home</span>
            </Link>
          </li>

          <li className="shrink-0">
            <ChevronRightIcon className="w-3.5 h-3.5 text-gray-300 dark:text-white/20" />
          </li>

          {/* Categories */}
          <li className="shrink-0">
            <Link
              to="/categories"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/6 transition-colors duration-150"
            >
              <RectangleStackIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium">Categories</span>
            </Link>
          </li>

          <li className="shrink-0">
            <ChevronRightIcon className="w-3.5 h-3.5 text-gray-300 dark:text-white/20" />
          </li>

          {/* Current category */}
          <li aria-current="page" className="shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-surface dark:bg-white/6 border border-gray-200 dark:border-white/10">
              <FolderIconSolid className="w-3.5 h-3.5 shrink-0 text-brand-accent" />
              <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[140px] sm:max-w-xs">
                {categoryName}
              </span>
            </div>
          </li>
        </ol>
      </div>
    </nav>
  );
};

export default React.memo(CategoryBreadcrumbs);
