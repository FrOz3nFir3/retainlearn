const IndividualCardOverviewPageSkeleton = () => {
  return (
    <div className="text-center py-12 bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl p-8 animate-pulse">
      {/* Heading + subtitle */}
      <div className="mb-8">
        <div className="h-8 bg-gray-200 dark:bg-white/8 rounded-lg w-48 mx-auto mb-3"></div>
        <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-72 mx-auto mb-1"></div>
        <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-56 mx-auto"></div>
      </div>

      {/* CardActions layout="horizontal": grid-cols-1 lg:grid-cols-2 gap-3, 5 action cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Review */}
        <div className="h-24 bg-gray-200 dark:bg-white/8 rounded-2xl"></div>
        {/* Quiz */}
        <div className="h-24 bg-gray-200 dark:bg-white/8 rounded-2xl"></div>
        {/* Review Queue — spans 2 cols */}
        <div className="h-24 bg-gray-200 dark:bg-white/8 rounded-2xl lg:col-span-2"></div>
        {/* Edit flashcards */}
        <div className="h-24 bg-gray-200 dark:bg-white/8 rounded-2xl"></div>
        {/* Edit quizzes */}
        <div className="h-24 bg-gray-200 dark:bg-white/8 rounded-2xl"></div>
      </div>
    </div>
  );
};

export default IndividualCardOverviewPageSkeleton;
