import {
  MagnifyingGlassIcon,
  BookOpenIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import DeckProgressCard from "./DeckProgressCard";
import Pagination from "../../../components/ui/Pagination";
import { useGetUserStatsQuery } from "../../../api/apiSlice";
import useQuizProgressWithSearch from "../../../hooks/useQuizProgressWithSearch";
import EmptyState from "./ui/EmptyState";
import { RocketLaunchIcon } from "@heroicons/react/24/solid";
import ProgressIndividualDeckListSkeleton from "../../../components/ui/skeletons/ProgressIndividualDeckListSkeleton";

const DeckProgressList = ({ user, onViewReport }) => {
  const CARDS_PER_PAGE = 6;

  const {
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    cards: currentCards,
    total: totalItems,
    totalPages,
    isFetching,
    isLoading,
    isSearching,
    resetSearch,
  } = useQuizProgressWithSearch(user);

  const { data: stats } = useGetUserStatsQuery(undefined, {
    skip: !user?.studyingCount,
  });

  const totalDecksStudied = stats?.totalDecksStudied || 0;
  const totalQuizzesCompleted = stats?.totalQuizzesFinished || 0;

  if (isLoading) {
    return (
      <div>
        <div className="h-8 bg-gray-200 dark:bg-white/8 rounded-xl w-48 mb-6 animate-pulse" />
        <div className="flex gap-3 mb-6">
          <div className="flex-1 h-11 bg-gray-200 dark:bg-white/8 rounded-xl animate-pulse" />
          <div className="w-28 h-11 bg-gray-200 dark:bg-white/8 rounded-xl animate-pulse" />
        </div>
        <ProgressIndividualDeckListSkeleton />
      </div>
    );
  }

  if (!totalDecksStudied) {
    return (
      <EmptyState
        title="Ready to start learning?"
        message="Your progress will appear here after your first quiz. Choose a deck and go."
        ctaText="Explore decks"
        ctaLink="/categories"
        icon={RocketLaunchIcon}
      />
    );
  }

  return (
    <div>
      {/* Section header */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-3">
          Study collection
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="font-heading text-2xl text-gray-900 dark:text-white">
            Your decks.
          </h2>
          <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-white/30">
            <span><span className="font-semibold text-gray-700 dark:text-white/70">{totalDecksStudied}</span> active</span>
            <span><span className="font-semibold text-gray-700 dark:text-white/70">{totalQuizzesCompleted}</span> completed</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 dark:text-white/30" />
          </div>
          <input
            type="text"
            placeholder="Search your decks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-accent/20 focus:border-brand-primary dark:focus:border-brand-accent/40 transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={resetSearch}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-white/60"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        {searchQuery && (
          <span className="self-center text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30 whitespace-nowrap shrink-0">
            {currentCards.length} of {totalItems}
          </span>
        )}
      </div>

      {/* Grid */}
      {isFetching ? (
        <ProgressIndividualDeckListSkeleton />
      ) : currentCards.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-100 dark:bg-white/8 rounded-2xl mb-4">
            <BookOpenIcon className="w-6 h-6 text-gray-400 dark:text-white/30" />
          </div>
          <h3 className="font-heading text-xl text-gray-700 dark:text-white mb-2">
            {isSearching ? "No decks found" : "No study decks yet"}
          </h3>
          <p className="text-sm text-gray-400 dark:text-white/30 max-w-sm mx-auto">
            {isSearching
              ? `Nothing matches "${searchQuery}". Try a different term.`
              : "Start studying some cards to see your progress here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 mb-6">
          {currentCards.map((card, index) => (
            <DeckProgressCard
              key={index}
              card={card}
              index={index}
              onViewReport={onViewReport}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsCount={totalItems}
          itemsPerPage={CARDS_PER_PAGE}
        />
      )}
    </div>
  );
};

export default DeckProgressList;
