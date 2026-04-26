const CardsPageSkeleton = () => {
  return (
    <div className="min-h-screen bg-brand-light dark:bg-[#0f0d1a] animate-pulse">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumbs (matches CategoryBreadcrumbs) */}
        <div className="flex items-center gap-2 mb-10">
          <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-14"></div>
          <div className="h-3 w-3 bg-gray-200 dark:bg-white/8 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-20"></div>
          <div className="h-3 w-3 bg-gray-200 dark:bg-white/8 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-24"></div>
        </div>

        {/* Page header (amber label + Fraunces heading + subtitle) */}
        <div className="mb-10">
          <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-32 mb-3"></div>
          <div className="h-10 sm:h-12 bg-gray-200 dark:bg-white/8 rounded-lg w-48 mb-3"></div>
          <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-64"></div>
        </div>

        {/* Inline search + action (matches CardsPage search row) */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="h-11 bg-gray-200 dark:bg-white/8 rounded-xl flex-1"></div>
          <div className="h-11 bg-gray-200 dark:bg-white/8 rounded-xl w-36"></div>
        </div>

        {/* Cards Grid (matches actual grid: 1/2/3 cols, gap-4, mb-6) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#14112a] rounded-2xl border border-gray-200 dark:border-white/8 h-[180px] flex flex-col overflow-hidden"
            >
              <div className="p-6 grow space-y-3">
                <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-1/4"></div>
                <div className="h-5 bg-gray-200 dark:bg-white/8 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-5/6"></div>
              </div>
              <div className="px-6 py-4 bg-gray-50 dark:bg-white/3 border-t border-gray-100 dark:border-white/6 flex justify-between items-center">
                <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination (plain row, no card wrapper) */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
          <div className="h-5 bg-gray-200 dark:bg-white/8 rounded w-48"></div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-gray-200 dark:bg-white/8 rounded-xl"></div>
            <div className="h-10 w-10 bg-gray-200 dark:bg-white/8 rounded-xl"></div>
            <div className="h-10 w-10 bg-gray-200 dark:bg-white/8 rounded-xl"></div>
            <div className="h-10 w-10 bg-gray-200 dark:bg-white/8 rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardsPageSkeleton;
