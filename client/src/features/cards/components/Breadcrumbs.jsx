import React from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  FolderIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  PencilIcon,
  ChevronRightIcon,
  BookOpenIcon,
  FireIcon,
  ClipboardDocumentCheckIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";

const Breadcrumbs = ({ card, cardData }) => {
  const location = useLocation();
  const pathname = location.pathname;
  const [searchParams] = useSearchParams();
  const containerRef = React.useRef(null);

  const getCurrentActivity = () => {
    if (pathname.includes("focus-review")) return { name: "Focus Review", icon: FireIcon };
    if (pathname.includes("focus-quiz"))   return { name: "Focus Quiz",   icon: FireIcon };
    if (pathname.includes("review"))       return { name: "Review",       icon: BookOpenIcon };
    if (pathname.includes("quiz"))         return { name: "Quiz",         icon: AcademicCapIcon };
    if (pathname.includes("/edit")) {
      const view = searchParams.get("view");
      if (view === "review-queue") return { name: "Review Queue", icon: ClipboardDocumentCheckIcon };
      if (view === "quizzes")      return { name: "Edit Quizzes", icon: AcademicCapIcon };
      return { name: "Edit", icon: PencilIcon };
    }
    return { name: "Overview", icon: Squares2X2Icon };
  };

  const currentActivity = getCurrentActivity();

  React.useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: containerRef.current.scrollWidth, behavior: "smooth" });
    }
  }, [location]);

  if (!card?.category || !cardData?.category) return null;

  return (
    <nav className="mb-8 overflow-hidden" aria-label="Breadcrumb">
      <div
        className="overflow-x-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        ref={containerRef}
      >
        <ol className="flex items-center gap-1 text-sm min-w-max py-1">
          {/* Category */}
          <li className="shrink-0">
            <Link
              to={`/category/${cardData.category}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/6 transition-colors duration-150"
            >
              <FolderIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium whitespace-nowrap">
                {cardData.categoryName || cardData.category}
              </span>
            </Link>
          </li>

          <li className="shrink-0">
            <ChevronRightIcon className="w-3.5 h-3.5 text-gray-300 dark:text-white/20" />
          </li>

          {/* Card */}
          <li className="shrink-0">
            <Link
              to={`/card/${card._id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/6 transition-colors duration-150"
            >
              <DocumentTextIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="flex items-center gap-1.5 font-medium whitespace-nowrap">
                <span>{card["main-topic"] || "Card"}</span>
                {card["sub-topic"] && (
                  <>
                    <span className="text-gray-300 dark:text-white/20" aria-hidden="true">·</span>
                    <span className="text-gray-400 dark:text-white/30 font-normal">
                      {card["sub-topic"]}
                    </span>
                  </>
                )}
              </span>
            </Link>
          </li>

          {/* Activity */}
          <li className="shrink-0">
            <ChevronRightIcon className="w-3.5 h-3.5 text-gray-300 dark:text-white/20" />
          </li>
          <li aria-current="page" className="shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-surface dark:bg-white/6 border border-gray-200 dark:border-white/10">
              <currentActivity.icon className="w-3.5 h-3.5 shrink-0 text-brand-accent" />
              <span className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                {currentActivity.name}
              </span>
            </div>
          </li>
        </ol>
      </div>
    </nav>
  );
};

export default React.memo(Breadcrumbs);
