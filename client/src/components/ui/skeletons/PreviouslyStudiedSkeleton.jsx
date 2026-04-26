const PreviouslyStudiedSkeleton = () => {
  return (
    <div className="mb-16 animate-pulse">
      {/* Header (matches StudiedDecksHeader: amber label + h2 + subtitle, left-aligned) */}
      <div className="mb-10">
        <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-32 mb-4"></div>
        <div className="h-8 sm:h-10 bg-gray-200 dark:bg-white/8 rounded-lg w-72 mb-3"></div>
        <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-80 max-w-lg"></div>
      </div>

      {/* Search controls (matches StudiedDecksControls: flex row, no card wrapper) */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        <div className="h-11 bg-gray-200 dark:bg-white/8 rounded-xl w-full sm:max-w-sm"></div>
        <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-16"></div>
      </div>

      {/* Cards grid (matches StudiedDecksGrid: grid-cols-1 md:2 xl:3, gap-4, no card wrapper) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#14112a] rounded-2xl border border-gray-200 dark:border-white/8 flex flex-col overflow-hidden">
            <div className="p-6 grow">
              <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-1/4 mb-2"></div>
              <div className="h-5 bg-gray-200 dark:bg-white/8 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-full mb-1"></div>
              <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-5/6"></div>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-white/3 border-t border-gray-100 dark:border-white/6 flex justify-between items-center">
              <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PreviouslyStudiedSkeleton;
