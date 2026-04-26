import { EyeIcon } from "@heroicons/react/24/outline";

const GuestAccessNote = () => {
  return (
    <div className="flex items-start gap-3 px-4 py-3 bg-brand-surface/60 dark:bg-brand-accent/8 border border-amber-200 dark:border-brand-accent/20 rounded-xl mb-6">
      <EyeIcon className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
      <p className="text-xs text-gray-600 dark:text-white/50 leading-relaxed">
        <span className="font-semibold text-gray-700 dark:text-white/70">No account needed to explore.</span>{" "}
        Browse cards and take quizzes as a guest — sign up when you're ready.
      </p>
    </div>
  );
};

export default GuestAccessNote;
