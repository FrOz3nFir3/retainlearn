const CategoryGridSkeleton = ({ count = 12 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="h-36 bg-gray-200 dark:bg-white/6 rounded-2xl animate-pulse"
        />
      ))}
    </div>
  );
};

export default CategoryGridSkeleton;
