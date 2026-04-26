import { Link } from "react-router-dom";
import { BookOpenIcon, AcademicCapIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

const CardGridItem = ({ card, showCategory = false }) => {
  return (
    <Link to={`/card/${card._id}`} className="block group">
      <div className="relative bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl overflow-hidden h-full flex flex-col transition-all duration-200 hover:border-gray-300 dark:hover:border-white/15 hover:shadow-sm cursor-pointer">
        {/* Amber bottom accent bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left z-10" />

        {/* Body */}
        <div className="relative p-6 flex flex-col gap-4 grow">
          {/* Category badge */}
          {card.category && showCategory && (
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent">
              {card.category}
            </p>
          )}

          {/* Main topic */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-1.5">
              Main topic
            </p>
            <h3 className="font-heading text-lg text-gray-900 dark:text-white leading-snug line-clamp-3 group-hover:text-brand-primary dark:group-hover:text-brand-accent transition-colors duration-200">
              {card["main-topic"]}
            </h3>
          </div>

          {/* Sub topic */}
          {card["sub-topic"] && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-1.5">
                Sub topic
              </p>
              <p className="text-sm text-gray-500 dark:text-white/45 line-clamp-3 leading-relaxed">
                {card["sub-topic"]}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative px-6 py-4 border-t border-gray-100 dark:border-white/6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-white/30">
              <BookOpenIcon className="h-4 w-4" />
              <span>{card.reviewLength || 0} flashcard{(card.reviewLength || 0) !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-white/30">
              <AcademicCapIcon className="h-4 w-4" />
              <span>{card.quizzesLength || 0} quiz{(card.quizzesLength || 0) !== 1 ? "zes" : ""}</span>
            </div>
          </div>
          <ArrowRightIcon className="h-4 w-4 text-gray-300 dark:text-white/20 group-hover:text-brand-accent group-hover:translate-x-0.5 transition-all duration-200" />
        </div>
      </div>
    </Link>
  );
};

export default CardGridItem;
