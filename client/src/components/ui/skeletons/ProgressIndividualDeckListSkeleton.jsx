const DeckCardSkeleton = () => (
  <div className="bg-white dark:bg-[#14112a] rounded-2xl border border-gray-200 dark:border-white/8 overflow-hidden flex flex-col">
    <div className="p-6 grow">
      <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-1/4 mb-4"></div>
      <div className="h-6 bg-gray-200 dark:bg-white/8 rounded w-3/4 mb-2"></div>
      <div className="h-5 bg-gray-200 dark:bg-white/8 rounded w-1/2 mb-6"></div>

      <div className="space-y-4">
        <div className="h-6 bg-gray-200 dark:bg-white/8 rounded"></div>
        <div className="h-6 bg-gray-200 dark:bg-white/8 rounded"></div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="h-10 bg-gray-200 dark:bg-white/8 rounded-xl"></div>
        <div className="h-10 bg-gray-200 dark:bg-white/8 rounded-xl"></div>
        <div className="h-10 bg-gray-200 dark:bg-white/8 rounded-xl"></div>
        <div className="h-10 bg-gray-200 dark:bg-white/8 rounded-xl"></div>
      </div>
    </div>
    <div className="bg-gray-50 dark:bg-white/3 px-6 py-4 mt-auto border-t border-gray-100 dark:border-white/6">
      <div className="h-10 bg-gray-200 dark:bg-white/8 rounded-xl"></div>
    </div>
  </div>
);

const ProgressIndividualDeckListSkeleton = () => {
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <DeckCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};

export default ProgressIndividualDeckListSkeleton;
