const CategoryPageSkeleton = () => {
  return (
    <div className="min-h-screen bg-brand-light dark:bg-[#0f0d1a] animate-pulse">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section (matches CategoryHeader: left-aligned, amber label + heading + subtitle) */}
        <div className="mb-12">
          <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-40 mb-4"></div>
          <div className="h-10 bg-gray-200 dark:bg-white/8 rounded-lg w-64 mb-3"></div>
          <div className="h-10 bg-gray-200 dark:bg-white/8 rounded-lg w-56 mb-4"></div>
          <div className="h-5 bg-gray-200 dark:bg-white/8 rounded w-80 max-w-full"></div>
        </div>

        {/* Categories Section */}
        <div className="mb-16">
          {/* Search Bar (matches CategorySearch: inline flex, no card bg) */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="h-11 bg-gray-200 dark:bg-white/8 rounded-xl flex-1"></div>
            <div className="h-11 bg-gray-200 dark:bg-white/8 rounded-xl w-40"></div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-36 bg-white dark:bg-[#14112a] rounded-2xl border border-gray-200 dark:border-white/8"
              ></div>
            ))}
          </div>

          {/* Pagination */}
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
    </div>
  );
};

export default CategoryPageSkeleton;
