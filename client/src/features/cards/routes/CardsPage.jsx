import { useRef } from "react";
import { useParams } from "react-router-dom";
import { NewCardForm } from "../components/NewCardForm";
import CardSkeleton from "../../../components/ui/skeletons/CardSkeleton";
import Pagination from "../../../components/ui/Pagination";
import CardGridItem from "../components/CardGridItem";
import CategoryBreadcrumbs from "../components/CategoryBreadcrumbs";
import useCardsWithSearch from "../../../hooks/useCardsWithSearch";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { normalizeCategory } from "../../../utils/textNormalization";
import { Helmet } from "@dr.pogodin/react-helmet";

const CardsPage = () => {
  let { name: category } = useParams();
  category = normalizeCategory(category);
  const cardListRef = useRef(null);

  const {
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    cards,
    total: totalItemsCount,
    totalPages,
    isFetching,
    isLoading,
  } = useCardsWithSearch(category);

  const filteredItemsCount = cards.length;

  return (
    <div className="min-h-screen bg-brand-light dark:bg-[#0f0d1a] font-sans">
      <Helmet>
        <title>{category} Flashcards - RetainLearn</title>
        <meta name="description" content={`Study and review flashcards in the ${category} category.`} />
        <meta property="og:title" content={`${category} Flashcards - RetainLearn`} />
        <meta property="og:description" content={`Study and review flashcards in the ${category} category.`} />
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <CategoryBreadcrumbs categoryName={category} />

        {/* Page header */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-3">
            {category}
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl text-gray-900 dark:text-white leading-tight">
            Study sets.
          </h1>
          <p className="text-sm text-gray-500 dark:text-white/45 mt-2">
            {isLoading || isFetching ? (
              <span className="inline-block w-32 h-4 bg-gray-200 dark:bg-white/8 rounded animate-pulse" />
            ) : (
              <>
                {totalItemsCount === 0
                  ? "No cards yet — create the first one."
                  : `${totalItemsCount} card${totalItemsCount !== 1 ? "s" : ""} in this category`}
              </>
            )}
          </p>
        </div>

        {/* Search bar + action */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 dark:text-white/30" />
            </div>
            <input
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-accent/20 focus:border-brand-primary dark:focus:border-brand-accent/40 transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-white/60"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {searchQuery && (
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30 whitespace-nowrap shrink-0">
                {filteredItemsCount} of {totalItemsCount}
              </span>
            )}
            <NewCardForm category={category} />
          </div>
        </div>

        {/* Content */}
        <div ref={cardListRef} data-cardlist>
          {!(isLoading || isFetching) && filteredItemsCount === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-100 dark:bg-white/8 rounded-2xl mb-5">
                {totalItemsCount === 0 ? (
                  <PlusIcon className="h-6 w-6 text-gray-400 dark:text-white/30" />
                ) : (
                  <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 dark:text-white/30" />
                )}
              </div>
              <h3 className="font-heading text-2xl text-gray-700 dark:text-white mb-2">
                {totalItemsCount === 0 ? "No cards yet" : "No cards found"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-white/40 max-w-sm mx-auto mb-8 leading-relaxed">
                {totalItemsCount === 0
                  ? "Create your first card to start building this study set."
                  : `Nothing matches "${searchQuery}". Try a different search term.`}
              </p>
              {totalItemsCount === 0 && <NewCardForm category={category} />}
            </div>
          ) : (
            <>
              {isLoading || isFetching ? (
                <CardSkeleton showHeader={false} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                  {cards.map((card) => (
                    <CardGridItem key={card._id} card={card} />
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsCount={totalItemsCount}
                  itemsPerPage={9}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardsPage;
