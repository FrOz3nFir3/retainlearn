const ProfilePageSkeleton = () => {
  return (
    <div className="min-h-screen bg-brand-light dark:bg-[#0f0d1a] animate-pulse">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">

        {/* Page header (matches ProfileContent: amber label + heading + subtitle) */}
        <div className="mb-10">
          <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-28 mb-3"></div>
          <div className="h-10 sm:h-12 bg-gray-200 dark:bg-white/8 rounded-lg w-56 mb-3"></div>
          <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-72"></div>
        </div>

        {/* Content grid: lg:grid-cols-3 gap-6 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Profile card — lg:col-span-2 */}
          <div className="lg:col-span-2 bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 dark:border-white/6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-white/8 rounded-lg"></div>
                <div>
                  <div className="h-5 bg-gray-200 dark:bg-white/8 rounded w-36 mb-1.5"></div>
                  <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-48"></div>
                </div>
              </div>
              <div className="h-7 w-16 bg-gray-200 dark:bg-white/8 rounded-lg"></div>
            </div>

            {/* Card body */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-20"></div>
                    <div className="h-11 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Connected accounts sidebar — lg:col-span-1 */}
          <div className="lg:col-span-1 bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl overflow-hidden h-fit">
            {/* Card header */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-white/6">
              <div className="w-8 h-8 bg-gray-200 dark:bg-white/8 rounded-lg"></div>
              <div>
                <div className="h-5 bg-gray-200 dark:bg-white/8 rounded w-40 mb-1.5"></div>
                <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-48"></div>
              </div>
            </div>

            {/* Card body */}
            <div className="p-6 space-y-3">
              <div className="p-4 bg-gray-50 dark:bg-white/4 border border-gray-200 dark:border-white/8 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-gray-200 dark:bg-white/8 rounded-lg"></div>
                  <div className="grow">
                    <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-16 mb-1"></div>
                    <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-28"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-6 bg-gray-200 dark:bg-white/8 rounded-lg w-20"></div>
                  <div className="h-7 bg-gray-200 dark:bg-white/8 rounded-lg w-20"></div>
                </div>
              </div>
              <div className="p-4 border border-dashed border-gray-200 dark:border-white/8 rounded-xl opacity-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 dark:bg-white/6 rounded-lg"></div>
                  <div>
                    <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-28 mb-1"></div>
                    <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-20"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfilePageSkeleton;
