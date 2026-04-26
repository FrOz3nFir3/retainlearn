
const MobileMenuSkeleton = () => {
  return (
    <div className="block md:hidden animate-pulse">
      <div className="flex items-center h-10 space-x-2 p-2 rounded-xl bg-gray-200 dark:bg-white/8"></div>
    </div>
  );
};

export default MobileMenuSkeleton;
