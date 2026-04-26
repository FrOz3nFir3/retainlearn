import { ArrowPathIcon } from "@heroicons/react/24/outline";

const AuthSubmitButton = ({ isLoading, loadingText, buttonText, Icon }) => {
  return (
    <div className="pt-1">
      <button
        type="submit"
        disabled={isLoading}
        className="cursor-pointer w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed dark:bg-brand-accent dark:hover:bg-amber-400 dark:text-brand-dark dark:disabled:bg-white/10 dark:disabled:text-white/25 text-white font-semibold text-sm rounded-xl transition-colors duration-150"
      >
        {isLoading ? (
          <ArrowPathIcon className="h-4 w-4 animate-spin" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
        {isLoading ? loadingText : buttonText}
      </button>
    </div>
  );
};

export default AuthSubmitButton;
