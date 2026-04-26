const ReviewPageSkeleton = () => {
  return (
    <div className="bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl overflow-hidden animate-pulse">
      {/* ReviewHeader (px-6 pt-6 pb-4 mb-2: icon tile + amber label + heading + Focus Review button) */}
      <div className="px-6 pt-6 pb-4 mb-2">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gray-200 dark:bg-white/8 rounded-xl w-11 h-11"></div>
            <div>
              <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-20 mb-2"></div>
              <div className="h-7 bg-gray-200 dark:bg-white/8 rounded w-40"></div>
            </div>
          </div>
          <div className="h-9 bg-gray-200 dark:bg-white/8 rounded-xl w-32"></div>
        </div>
      </div>

      <div className="p-6 sm:p-8 pt-2">
        {/* Flashcard area */}
        <div className="aspect-video bg-gray-200 dark:bg-white/8 rounded-2xl mb-6"></div>

        {/* Keyboard hint */}
        <div className="text-center mt-6 mb-4">
          <div className="hidden md:inline-flex h-9 bg-gray-200 dark:bg-white/8 rounded-xl w-64"></div>
        </div>

        {/* Navigation (prev / counter / next) */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-10 w-28 bg-gray-200 dark:bg-white/8 rounded-xl"></div>
          <div className="h-4 w-20 bg-gray-200 dark:bg-white/8 rounded"></div>
          <div className="h-10 w-28 bg-gray-200 dark:bg-white/8 rounded-xl"></div>
        </div>

        {/* Card gallery thumbnails */}
        <div className="flex gap-2 overflow-hidden mt-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 w-12 bg-gray-200 dark:bg-white/8 rounded-lg shrink-0"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewPageSkeleton;
