import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsCount,
  itemsPerPage,
}) => {
  if (totalPages <= 1) return null;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, itemsCount);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
    }
  };

  const getPageNumbers = () => {
    const pageNeighbours = 1;
    const totalNumbers = 3 + pageNeighbours * 2;
    const totalBlocks = totalNumbers + 2;

    if (totalPages <= totalBlocks) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const result = [];
    const leftSiblingIndex = Math.max(currentPage - pageNeighbours, 2);
    const rightSiblingIndex = Math.min(currentPage + pageNeighbours, totalPages - 1);
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    result.push(1);
    if (shouldShowLeftDots) result.push("...");
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) result.push(i);
    if (shouldShowRightDots) result.push("...");
    if (totalPages !== 1) result.push(totalPages);

    return result;
  };

  const pageNumbers = getPageNumbers();

  const navBtn = (label, onClick, disabled) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="cursor-pointer inline-flex items-center justify-center w-9 h-9 text-sm bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 rounded-xl hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-700 dark:hover:text-white/70 disabled:opacity-35 disabled:cursor-not-allowed transition-all duration-150"
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-5 py-4 bg-white dark:bg-white/4 border border-gray-200 dark:border-white/8 rounded-2xl">
      <p className="text-sm text-gray-500 dark:text-white/40">
        Showing{" "}
        <span className="font-semibold text-gray-700 dark:text-white/70">
          {startIndex + 1}–{endIndex}
        </span>{" "}
        of {itemsCount}
      </p>

      <div className="flex items-center gap-1.5">
        {navBtn(<ChevronLeftIcon className="h-4 w-4" />, () => handlePageChange(currentPage - 1), currentPage === 1)}

        <div className="flex gap-1">
          {pageNumbers.map((pageNum, index) =>
            typeof pageNum === "string" ? (
              <span
                key={`ellipsis-${index}`}
                className="w-9 h-9 inline-flex items-center justify-center text-sm text-gray-400 dark:text-white/25"
              >
                ···
              </span>
            ) : (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`cursor-pointer w-9 h-9 rounded-xl text-sm font-medium transition-all duration-150 ${
                  currentPage === pageNum
                    ? "bg-brand-primary dark:bg-brand-accent text-white dark:text-brand-dark shadow-sm"
                    : "bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/55 hover:border-gray-300 dark:hover:border-white/20"
                }`}
              >
                {pageNum}
              </button>
            )
          )}
        </div>

        {navBtn(<ChevronRightIcon className="h-4 w-4" />, () => handlePageChange(currentPage + 1), currentPage === totalPages)}
      </div>
    </div>
  );
};

export default Pagination;
