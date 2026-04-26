import React from "react";
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/solid";
import CardGalleryItem from "./CardGalleryItem";
import SearchComponent from "./SearchComponent";
import NoSearchResults from "./NoSearchResults";
import { useCardGallerySearch } from "../../../hooks/useCardGallerySearch";

const CardGallery = ({
  review,
  isFlipped,
  currentFlashcard,
  handleCardSelect,
}) => {
  const scrollContainerRef = React.useRef(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const { searchTerm, filteredReview, handleSearchChange, handleSearchReset } =
    useCardGallerySearch(review);

  // Memoized index mapping to avoid findIndex calls
  const reviewIndexMap = React.useMemo(() => {
    const map = new Map();
    review.forEach((item, index) => {
      map.set(item._id, index);
    });
    return map;
  }, [review]);

  const updateScrollButtons = React.useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 5); // Small threshold for better UX
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5); // Small threshold
    }
  }, []);

  React.useEffect(() => {
    updateScrollButtons();
  }, [filteredReview, updateScrollButtons]);

  // Auto-scroll to selected card when currentFlashcard changes
  React.useEffect(() => {
    if (scrollContainerRef.current && currentFlashcard) {
      const selectedIndex = filteredReview.findIndex(
        (item) => item._id === currentFlashcard._id
      );

      if (selectedIndex !== -1) {
        const container = scrollContainerRef.current;
        const cardElements = container.children;
        const selectedCard = cardElements[selectedIndex];

        if (selectedCard) {
          const containerRect = container.getBoundingClientRect();
          const cardRect = selectedCard.getBoundingClientRect();

          // Check if card is not fully visible
          if (
            cardRect.left < containerRect.left ||
            cardRect.right > containerRect.right
          ) {
            const scrollLeft =
              selectedCard.offsetLeft -
              container.clientWidth / 2 +
              selectedCard.clientWidth / 2;
            container.scrollTo({
              left: Math.max(0, scrollLeft),
              behavior: "smooth",
            });
          }
        }
      }
    }
  }, [currentFlashcard, filteredReview]);

  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", updateScrollButtons);
      // Also listen for resize to update when container size changes
      const resizeObserver = new ResizeObserver(updateScrollButtons);
      resizeObserver.observe(container);

      return () => {
        container.removeEventListener("scroll", updateScrollButtons);
        resizeObserver.disconnect();
      };
    }
  }, [updateScrollButtons]);

  const handlePrev = () => {
    if (scrollContainerRef.current && canScrollLeft) {
      scrollContainerRef.current.scrollBy({
        left: -scrollContainerRef.current.clientWidth,
        behavior: "smooth",
      });
    }
  };

  const handleNext = () => {
    if (scrollContainerRef.current && canScrollRight) {
      scrollContainerRef.current.scrollBy({
        left: scrollContainerRef.current.clientWidth,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-surface dark:bg-white/8 rounded-xl">
            <RectangleStackIcon className="h-5 w-5 text-brand-primary dark:text-brand-accent/70" />
          </div>
          <div>
            <h3 className="font-heading text-xl text-gray-900 dark:text-white">
              Card Gallery
            </h3>
            <p className="text-xs text-gray-500 dark:text-white/40">
              Quick access to all your flashcards
            </p>
          </div>
        </div>
        <SearchComponent
          searchTerm={searchTerm}
          handleSearchChange={handleSearchChange}
          handleSearchReset={handleSearchReset}
        />
      </div>

      <div className="relative">
        <div className="flex items-center gap-3">
          {/* Left Scroll Button */}
          <button
            onClick={handlePrev}
            title="Scroll cards left"
            disabled={filteredReview.length === 0 || !canScrollLeft}
            className="hidden sm:flex cursor-pointer shrink-0 p-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/40 hover:border-brand-primary/30 dark:hover:border-brand-accent/30 hover:text-brand-primary dark:hover:text-brand-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150"
          >
            <ChevronDoubleLeftIcon className="h-4 w-4" />
          </button>

          {/* Cards Container */}
          <div className="flex-1 relative bg-white dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-2xl overflow-hidden">
            {filteredReview.length > 0 ? (
              <>
                {/* Mobile Scroll Buttons - Overlaid */}
                <button
                  onClick={handlePrev}
                  disabled={filteredReview.length === 0 || !canScrollLeft}
                  className="sm:hidden cursor-pointer absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-lg bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/40 hover:text-brand-primary dark:hover:text-brand-accent disabled:opacity-20 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  <ChevronDoubleLeftIcon className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={handleNext}
                  disabled={filteredReview.length === 0 || !canScrollRight}
                  className="sm:hidden cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-lg bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/40 hover:text-brand-primary dark:hover:text-brand-accent disabled:opacity-20 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  <ChevronDoubleRightIcon className="h-3.5 w-3.5" />
                </button>

                {/* Scrollable Cards Area */}
                <div
                  ref={scrollContainerRef}
                  className="flex overflow-x-auto gap-3 p-4 scroll-smooth"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {filteredReview.map((item, index) => {
                    const isSelected = item?._id === currentFlashcard?._id;

                    const handleOnClick = () => {
                      if (!searchTerm?.trim()) {
                        handleCardSelect(index);
                      } else {
                        const reviewIndex = reviewIndexMap.get(item._id);
                        if (reviewIndex !== undefined) {
                          handleCardSelect(reviewIndex);
                        }
                      }
                    };

                    return (
                      <CardGalleryItem
                        key={item.question}
                        item={item}
                        isFlipped={isFlipped}
                        isSelected={isSelected}
                        isFilteredOut={false}
                        handleOnClick={handleOnClick}
                      />
                    );
                  })}
                </div>

                <div className="px-4 pb-2.5 text-center text-xs text-gray-400 dark:text-white/30">
                  <span className="hidden sm:inline">Click cards to select · Use arrow buttons to scroll</span>
                  <span className="sm:hidden">Tap cards to select · Swipe to scroll</span>
                </div>
              </>
            ) : (
              <NoSearchResults />
            )}
          </div>

          {/* Right Scroll Button */}
          <button
            onClick={handleNext}
            title="Scroll cards right"
            disabled={filteredReview.length === 0 || !canScrollRight}
            className="hidden sm:flex cursor-pointer shrink-0 p-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/40 hover:border-brand-primary/30 dark:hover:border-brand-accent/30 hover:text-brand-primary dark:hover:text-brand-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150"
          >
            <ChevronDoubleRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardGallery;
