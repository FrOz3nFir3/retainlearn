
const ProgressPageSkeleton = () => {
  return (
    <div className="min-h-screen bg-brand-light dark:bg-[#0f0d1a] animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Page header (matches ProgressPageHeader: amber label + heading + subtitle) */}
        <div className="mb-10">
          <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-28 mb-3"></div>
          <div className="h-10 sm:h-12 bg-gray-200 dark:bg-white/8 rounded-lg w-64 mb-3"></div>
          <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-80"></div>
        </div>

        {/* Overall stats (matches OverallStats: grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4) */}
        <div className="mb-10">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl p-6"
              >
                <div className="w-10 h-10 bg-gray-200 dark:bg-white/8 rounded-xl mb-4" />
                <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-20 mb-2" />
                <div className="h-8 bg-gray-200 dark:bg-white/8 rounded w-16 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Deck progress list (matches DeckProgressList: section label + search row + grid) */}
        <div>
          {/* Section header */}
          <div className="mb-6">
            <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-28 mb-3"></div>
            <div className="h-7 bg-gray-200 dark:bg-white/8 rounded w-40"></div>
          </div>

          {/* Search bar */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 h-11 bg-gray-200 dark:bg-white/8 rounded-xl" />
          </div>

          {/* Deck cards grid */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#14112a] rounded-2xl border border-gray-200 dark:border-white/8 overflow-hidden flex flex-col">
                <div className="p-6 grow">
                  <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-1/4 mb-4"></div>
                  <div className="h-6 bg-gray-200 dark:bg-white/8 rounded w-3/4 mb-2"></div>
                  <div className="h-5 bg-gray-200 dark:bg-white/8 rounded w-1/2 mb-6"></div>
                  <div className="space-y-4">
                    <div className="h-6 bg-gray-200 dark:bg-white/8 rounded"></div>
                    <div className="h-6 bg-gray-200 dark:bg-white/8 rounded"></div>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="h-10 bg-gray-200 dark:bg-white/8 rounded-xl"></div>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-white/3 px-6 py-4 border-t border-gray-100 dark:border-white/6">
                  <div className="h-10 bg-gray-200 dark:bg-white/8 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProgressPageSkeleton;
