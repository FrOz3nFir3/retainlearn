import React from "react";
import { useParams } from "react-router-dom";
import { NewCardForm } from "./NewCardForm";
import CardSkeleton from "../../../components/ui/skeletons/CardSkeleton";
import Pagination from "../../../components/ui/Pagination";
import CardGridItem from "./CardGridItem";
import useCardsWithSearch from "../../../hooks/useCardsWithSearch";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { normalizeCategory } from "../../../utils/textNormalization";

const CardList = () => {
  let { name: category } = useParams();
  category = normalizeCategory(category);
  const cardListRef = React.useRef(null);

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
    <div ref={cardListRef} data-cardlist className="py-6">
      {/* Search bar + action */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
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
      {!(isLoading || isFetching) && filteredItemsCount === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-100 dark:bg-white/8 rounded-2xl mb-4">
            {totalItemsCount === 0 ? (
              <PlusIcon className="h-6 w-6 text-gray-400 dark:text-white/30" />
            ) : (
              <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 dark:text-white/30" />
            )}
          </div>
          <h3 className="font-heading text-xl text-gray-700 dark:text-white mb-2">
            {totalItemsCount === 0 ? "No cards yet" : "No cards found"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-white/40 max-w-sm mx-auto mb-6 leading-relaxed">
            {totalItemsCount === 0
              ? "Create your first card to start building this collection."
              : `Nothing matches "${searchQuery}". Try a different search term.`}
          </p>
          {totalItemsCount === 0 && <NewCardForm category={category} />}
        </div>
      ) : (
        <>
          {isFetching || isLoading ? (
            <CardSkeleton showHeader={false} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
  );
};

export default CardList;
