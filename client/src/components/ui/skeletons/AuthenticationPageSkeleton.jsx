const AuthenticationPageSkeleton = () => {
  return (
    <div className="min-h-screen bg-brand-light dark:bg-[#0f0d1a] animate-pulse">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-3 gap-12 lg:gap-16 items-start">

          {/* Benefits section — lg:col-span-2 */}
          <div className="lg:col-span-2 space-y-8">
            {/* Section label + heading */}
            <div>
              <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-28 mb-3"></div>
              <div className="h-10 sm:h-12 bg-gray-200 dark:bg-white/8 rounded-lg w-72 mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-64"></div>
            </div>

            {/* Benefit cards */}
            <div className="grid sm:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-[#14112a] rounded-2xl p-6 border border-gray-200 dark:border-white/8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-white/8 rounded-xl"></div>
                    <div>
                      <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-32"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-gray-200 dark:bg-white/8 rounded-full shrink-0"></div>
                        <div className="h-3 bg-gray-200 dark:bg-white/8 rounded flex-1"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Auth form — lg:col-span-1 */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl p-8">
              <div className="mb-8">
                <div className="h-6 bg-gray-200 dark:bg-white/8 rounded w-40 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-56"></div>
              </div>
              <div className="space-y-5">
                <div className="h-11 bg-gray-200 dark:bg-white/8 rounded-xl"></div>
                <div className="h-11 bg-gray-200 dark:bg-white/8 rounded-xl"></div>
                <div className="h-11 bg-gray-200 dark:bg-white/8 rounded-xl"></div>
              </div>
              <div className="mt-6">
                <div className="relative flex items-center my-6">
                  <div className="flex-1 border-t border-gray-200 dark:border-white/8"></div>
                  <div className="mx-4 h-3 bg-gray-200 dark:bg-white/8 rounded w-24"></div>
                  <div className="flex-1 border-t border-gray-200 dark:border-white/8"></div>
                </div>
                <div className="h-11 bg-gray-200 dark:bg-white/8 rounded-xl"></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthenticationPageSkeleton;
