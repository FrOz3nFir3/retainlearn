import CardGridSkeleton from "./CardGridSkeleton";

const PublicProfilePageSkeleton = () => {
  return (
    <div className="min-h-screen bg-brand-light dark:bg-[#0f0d1a]">
      <div className="container mx-auto 2xl:max-w-7xl p-4 animate-pulse">
        {/* User header skeleton */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gray-200 dark:bg-white/8 rounded-3xl"></div>
          </div>
          <div className="h-12 bg-gray-200 dark:bg-white/8 rounded-lg w-96 mx-auto mb-4"></div>
          <div className="h-6 bg-gray-200 dark:bg-white/8 rounded-lg w-48 mx-auto"></div>
        </div>

        {/* Cards section skeleton */}
        <div className="mt-12">
          <div className="h-9 bg-gray-200 dark:bg-white/8 rounded-lg w-48 mb-6"></div>
          <CardGridSkeleton count={9} />
        </div>
      </div>
    </div>
  );
};

export default PublicProfilePageSkeleton;
