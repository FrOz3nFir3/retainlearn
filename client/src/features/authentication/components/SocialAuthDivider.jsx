const SocialAuthDivider = () => {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200 dark:border-white/10" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="px-3 bg-white dark:bg-[#14112a] text-gray-400 dark:text-white/30 font-medium uppercase tracking-widest">
          or continue with
        </span>
      </div>
    </div>
  );
};

export default SocialAuthDivider;
