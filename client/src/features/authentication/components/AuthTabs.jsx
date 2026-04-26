const AuthTabs = ({ isLogin, onTabChange }) => {
  return (
    <div className="flex border-b border-gray-200 dark:border-white/10">
      <button
        onClick={() => onTabChange(true)}
        className={`cursor-pointer w-1/2 py-3 text-center font-semibold text-sm transition-colors duration-150 ${
          isLogin
            ? "border-b-2 border-brand-primary dark:border-brand-accent text-brand-primary dark:text-brand-accent"
            : "text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white/60"
        }`}
      >
        Sign in
      </button>
      <button
        onClick={() => onTabChange(false)}
        className={`cursor-pointer w-1/2 py-3 text-center font-semibold text-sm transition-colors duration-150 ${
          !isLogin
            ? "border-b-2 border-brand-primary dark:border-brand-accent text-brand-primary dark:text-brand-accent"
            : "text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white/60"
        }`}
      >
        Sign up
      </button>
    </div>
  );
};

export default AuthTabs;
