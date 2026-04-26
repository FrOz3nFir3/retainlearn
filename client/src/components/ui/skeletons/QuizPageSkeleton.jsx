const QuizPageSkeleton = () => {
  return (
    <div className="bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl overflow-hidden animate-pulse">
      {/* QuizHeader (px-6 pt-6 pb-4 mb-2: icon tile + amber label + heading + Focus Quiz button + progress counter) */}
      <div className="px-6 pt-6 pb-4 mb-2">
        <div className="flex flex-wrap gap-3 items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gray-200 dark:bg-white/8 rounded-xl w-11 h-11"></div>
            <div>
              <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-28 mb-2"></div>
              <div className="h-7 bg-gray-200 dark:bg-white/8 rounded w-16"></div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 bg-gray-200 dark:bg-white/8 rounded-xl w-28"></div>
            <div className="h-9 bg-gray-200 dark:bg-white/8 rounded-xl w-20"></div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-200 dark:bg-white/8 rounded-full w-full mb-2"></div>
        <div className="flex justify-between">
          <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-8"></div>
          <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-16"></div>
        </div>
      </div>

      <div className="p-6 sm:p-8 pt-2">
        {/* Question */}
        <div className="text-center my-8">
          <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-3/4 mx-auto mb-3"></div>
          <div className="h-8 bg-gray-200 dark:bg-white/8 rounded-lg w-1/2 mx-auto"></div>
        </div>

        {/* Options grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-white/8 rounded-2xl"></div>
          ))}
        </div>

        {/* Fun fact toggle */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/6">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 bg-gray-200 dark:bg-white/8 rounded-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-24"></div>
            <div className="h-6 w-11 bg-gray-200 dark:bg-white/8 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPageSkeleton;
