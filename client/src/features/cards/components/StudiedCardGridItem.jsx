import { Link, useNavigate } from "react-router-dom";
import {
  ClockIcon,
  CheckBadgeIcon,
  PlayIcon,
  ArrowPathIcon,
  AcademicCapIcon,
  FireIcon,
} from "@heroicons/react/24/solid";
import { BookOpenIcon } from "@heroicons/react/24/outline";

const StudiedCardGridItem = ({ card }) => {
  const navigate = useNavigate();
  const lastReviewedCardNo = card.lastReviewedCardNo ?? 0;
  const totalReviewCards = card.reviewLength ?? 0;
  const weakCardsCount = card.weakCardsCount ?? 0;
  const strugglingQuizCount = card.strugglingQuizCount ?? 0;
  const hasStarted = lastReviewedCardNo > 0;
  const isCompleted = hasStarted && lastReviewedCardNo >= totalReviewCards;
  const progressPercentage =
    totalReviewCards > 0 && hasStarted
      ? Math.round((lastReviewedCardNo / totalReviewCards) * 100)
      : 0;
  const continueReviewLink = isCompleted
    ? `/card/${card._id}/review`
    : hasStarted
    ? `/card/${card._id}/review?cardNo=${lastReviewedCardNo}`
    : `/card/${card._id}/review`;

  const handleQuizClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/card/${card._id}/quiz`);
  };

  const handleFocusReviewClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/card/${card._id}/focus-review`);
  };

  const handleFocusQuizClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/card/${card._id}/focus-quiz`);
  };

  return (
    <Link
      to={continueReviewLink}
      className="group relative bg-white dark:bg-[#14112a] rounded-2xl border border-gray-200 dark:border-white/8 hover:border-gray-300 dark:hover:border-white/15 hover:shadow-sm transition-all duration-200 flex flex-col overflow-hidden"
    >
      {/* Amber bottom accent bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

      {/* Badge */}
      <div className="absolute top-4 right-4 z-10">
        {isCompleted ? (
          <span className="inline-flex items-center gap-1 bg-brand-accent/15 text-brand-accent text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full">
            <CheckBadgeIcon className="h-3 w-3" />
            Done
          </span>
        ) : totalReviewCards > 0 ? (
          <span className="inline-flex items-center gap-1 bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary dark:text-brand-accent/80 text-[10px] font-semibold px-2 py-1 rounded-full">
            <ClockIcon className="h-3 w-3" />
            {hasStarted ? `${progressPercentage}%` : "New"}
          </span>
        ) : null}
      </div>

      {/* Body */}
      <div className="relative p-5 grow">
        {/* Category */}
        <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent mb-3 truncate pr-16">
          {card.category}
        </p>

        {/* Main topic */}
        <h3 className="font-heading text-base text-gray-900 dark:text-white leading-snug line-clamp-2 mb-1.5 group-hover:text-brand-primary dark:group-hover:text-brand-accent transition-colors duration-200">
          {card["main-topic"]}
        </h3>

        {/* Sub topic */}
        <p className="text-xs text-gray-400 dark:text-white/35 line-clamp-2 leading-relaxed mb-4">
          {card["sub-topic"]}
        </p>

        {/* Progress bar */}
        {!isCompleted && totalReviewCards > 0 && (
          <div className="mt-auto">
            <div className="flex justify-between text-[10px] text-gray-400 dark:text-white/30 mb-1.5">
              <span>Progress</span>
              <span>
                {lastReviewedCardNo} / {totalReviewCards}
              </span>
            </div>
            <div className="w-full h-1 bg-gray-100 dark:bg-white/8 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-primary dark:bg-brand-accent rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-100 dark:border-white/6 flex flex-col gap-2">
        {/* Primary actions */}
        <div className="flex gap-2">
          <div className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-primary/8 dark:bg-brand-primary/15 text-brand-primary dark:text-brand-accent border border-brand-primary/15 dark:border-brand-accent/20 rounded-lg text-xs font-semibold">
            {isCompleted ? (
              <ArrowPathIcon className="h-3.5 w-3.5" />
            ) : hasStarted ? (
              <PlayIcon className="h-3.5 w-3.5" />
            ) : (
              <BookOpenIcon className="h-3.5 w-3.5" />
            )}
            {isCompleted ? "Review Again" : hasStarted ? "Continue" : "Start"}
          </div>
          <button
            onClick={handleQuizClick}
            className="cursor-pointer flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/40 rounded-lg text-xs font-semibold hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-700 dark:hover:text-white/65 transition-colors duration-150"
          >
            <AcademicCapIcon className="h-3.5 w-3.5" />
            Quiz
          </button>
        </div>

        {/* Focus actions — amber, stand out */}
        {weakCardsCount > 0 && (
          <button
            onClick={handleFocusReviewClick}
            className="cursor-pointer w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-semibold transition-colors duration-150"
          >
            <FireIcon className="h-3.5 w-3.5" />
            Focus Review
            <span className="ml-auto bg-amber-200 dark:bg-amber-500/30 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
              {weakCardsCount}
            </span>
          </button>
        )}
        {strugglingQuizCount > 0 && (
          <button
            onClick={handleFocusQuizClick}
            className="cursor-pointer w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-semibold transition-colors duration-150"
          >
            <FireIcon className="h-3.5 w-3.5" />
            Focus Quiz
            <span className="ml-auto bg-amber-200 dark:bg-amber-500/30 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
              {strugglingQuizCount}
            </span>
          </button>
        )}
      </div>
    </Link>
  );
};

export default StudiedCardGridItem;
