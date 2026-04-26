const EditCardPageSkeleton = () => {
  return (
    <div className="bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl p-6 animate-pulse">
      {/* EditCardHeader (amber label + heading, no border-b + Manage Reviewers + New Flashcard buttons) */}
      <div className="flex gap-3 flex-wrap justify-between items-center mb-5">
        <div>
          <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-24 mb-2"></div>
          <div className="h-7 bg-gray-200 dark:bg-white/8 rounded w-40"></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-10 w-36 bg-gray-200 dark:bg-white/8 rounded-xl"></div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-white/8 rounded-xl"></div>
        </div>
      </div>

      {/* ViewSwitcher (3 tabs: Flashcards / Quizzes / Review Queue with border-b) */}
      <div className="mb-6 border-b border-gray-200 dark:border-white/8">
        <div className="flex gap-4 -mb-px">
          <div className="h-11 w-28 bg-gray-200 dark:bg-white/8 rounded-t-lg"></div>
          <div className="h-11 w-24 bg-gray-200 dark:bg-white/8 rounded-t-lg"></div>
          <div className="h-11 w-32 bg-gray-200 dark:bg-white/8 rounded-t-lg"></div>
        </div>
      </div>

      {/* Content area (search + card viewer + navigation) */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="h-11 flex-1 max-w-xs bg-gray-200 dark:bg-white/8 rounded-xl"></div>
          <div className="flex gap-2 ml-3">
            <div className="h-10 w-20 bg-gray-200 dark:bg-white/8 rounded-xl"></div>
            <div className="h-10 w-20 bg-gray-200 dark:bg-white/8 rounded-xl"></div>
          </div>
        </div>

        <div className="aspect-video bg-gray-200 dark:bg-white/8 rounded-2xl mb-6"></div>

        <div className="flex justify-center items-center gap-4">
          <div className="h-10 w-24 bg-gray-200 dark:bg-white/8 rounded-xl"></div>
          <div className="h-4 w-16 bg-gray-200 dark:bg-white/8 rounded"></div>
          <div className="h-10 w-24 bg-gray-200 dark:bg-white/8 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
};

export default EditCardPageSkeleton;
