import React, { useState } from "react";
import {
  MagnifyingGlassIcon,
  FaceFrownIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import CardDetails from "./CardDetails";

const SearchableCardGrid = ({
  cards,
  showCategory = false,
  showContinue = false,
}) => {
  const [searchValue, setSearchValue] = useState("");
  const handleSearchChange = (event) =>
    setSearchValue(event.target.value.toLowerCase());

  const filteredCards = searchValue.trim()
    ? cards.filter(
        (card) =>
          card["main-topic"].toLowerCase().includes(searchValue) ||
          card["sub-topic"].toLowerCase().includes(searchValue)
      )
    : cards;

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="relative max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 dark:text-white/30" />
        </div>
        <input
          type="text"
          placeholder="Search by main topic or sub topic..."
          value={searchValue}
          onInput={handleSearchChange}
          disabled={cards.length === 0}
          className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-accent/20 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150 text-sm"
        />
        {searchValue && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <button
              onClick={() => setSearchValue("")}
              className="cursor-pointer p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white/60 transition-colors duration-150"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Search Results Info */}
      {searchValue && (
        <div className="text-center">
          <p className="text-xs text-gray-400 dark:text-white/30">
            {filteredCards.length === 0
              ? "No cards match your search"
              : `Found ${filteredCards.length} card${filteredCards.length !== 1 ? "s" : ""} matching "${searchValue}"`}
          </p>
        </div>
      )}

      {/* Cards Grid or Empty State */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-surface dark:bg-white/8 rounded-2xl mb-4">
            {cards.length === 0 ? (
              <SparklesIcon className="h-7 w-7 text-brand-primary dark:text-brand-accent/70" />
            ) : (
              <FaceFrownIcon className="h-7 w-7 text-brand-primary dark:text-brand-accent/70" />
            )}
          </div>
          <h2 className="font-heading text-xl text-gray-900 dark:text-white mb-1">
            {cards.length === 0 ? "No Cards Yet" : "No Cards Found"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-white/40 max-w-md mx-auto">
            {cards.length === 0
              ? "Create your first card to start building your knowledge collection."
              : "Try adjusting your search terms or browse all available cards."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCards.map((card, index) => (
            <div
              key={card._id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardDetails
                {...card}
                showCategory={showCategory}
                showContinue={showContinue}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchableCardGrid;
