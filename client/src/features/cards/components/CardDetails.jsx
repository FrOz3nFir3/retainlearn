import { Link } from "react-router-dom";
import { ArrowRightIcon, BookOpenIcon } from "@heroicons/react/24/outline";

const CardDetails = (data) => {
  const {
    _id,
    ["main-topic"]: mainTopic,
    ["sub-topic"]: subTopic,
    category,
    review,
    reviewLength = 0,
    showCategory,
    showContinue,
  } = data;

  const flashcardCount = review?.length || reviewLength;

  return (
    <Link to={`/card/${_id}`} className="block group">
      <div className="relative bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl overflow-hidden h-full flex flex-col transition-all duration-200 hover:border-gray-300 dark:hover:border-white/15 hover:shadow-sm cursor-pointer">
        {/* Amber accent bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left z-10" />

        <div className="p-5 grow">
          {showCategory && (
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-3">
              {category}
            </p>
          )}

          <h2 className="font-heading text-lg text-gray-900 dark:text-white leading-snug line-clamp-2 mb-1.5 group-hover:text-brand-primary dark:group-hover:text-brand-accent transition-colors duration-200">
            {mainTopic}
          </h2>
          {subTopic && (
            <p className="text-sm text-gray-500 dark:text-white/45 line-clamp-2 leading-relaxed">
              {subTopic}
            </p>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-gray-100 dark:border-white/6 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-white/30">
            <BookOpenIcon className="h-4 w-4" />
            <span>{flashcardCount} item{flashcardCount !== 1 ? "s" : ""}</span>
          </div>
          <div className={`flex items-center gap-1 text-sm font-semibold transition-all duration-200 ${showContinue ? "text-brand-primary dark:text-brand-accent" : "text-gray-400 dark:text-white/30 group-hover:text-brand-accent"}`}>
            {showContinue ? "Continue" : "Explore"}
            <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-200" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CardDetails;
