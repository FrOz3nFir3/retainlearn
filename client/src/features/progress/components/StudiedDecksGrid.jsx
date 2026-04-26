import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import StudiedCardGridItem from "../../cards/components/StudiedCardGridItem";
import Pagination from "../../../components/ui/Pagination";
import CardSkeleton from "../../../components/ui/skeletons/CardSkeleton";

const StudiedDecksGrid = ({
  paginatedCards,
  currentPage,
  totalPages,
  onPageChange,
  filteredCount,
  itemsPerPage,
  isFetching = false,
}) => {
  if (filteredCount === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-100 dark:bg-white/8 rounded-2xl mb-5">
          <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 dark:text-white/30" />
        </div>
        <h3 className="font-heading text-xl text-gray-700 dark:text-white mb-2">
          No cards found
        </h3>
        <p className="text-sm text-gray-500 dark:text-white/40 max-w-xs mx-auto leading-relaxed">
          Try adjusting your search term.
        </p>
      </div>
    );
  }

  return (
    <>
      {isFetching ? (
        <CardSkeleton showHeader={false} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {paginatedCards.map((card) => (
            <StudiedCardGridItem key={card._id} card={card} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mb-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            itemsCount={filteredCount}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}
    </>
  );
};

export default StudiedDecksGrid;
