
const ProfileMenuSkeleton = () => {
  return (
    <div className="hidden md:block animate-pulse">
      <div className="flex items-center space-x-2 p-2 rounded-xl bg-gray-100 dark:bg-white/5">
        <div className="w-7 h-7 bg-gray-200 dark:bg-white/8 rounded-full"></div>
        <div className="w-16 h-4 bg-gray-200 dark:bg-white/8 rounded"></div>
      </div>
    </div>
  );
};

export default ProfileMenuSkeleton;
