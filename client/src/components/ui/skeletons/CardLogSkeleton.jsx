
const CardLogSkeleton = () => {
  return (
    <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/8 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-2.5 h-2.5 bg-gray-200 dark:bg-white/8 rounded-full mt-2"></div>
        <div className="grow">
          <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-1/2"></div>
          <div className="flex gap-2 items-center mt-3">
            <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-20"></div>
            <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardLogSkeleton;
