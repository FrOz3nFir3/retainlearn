import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

const FeatureCard = ({ title, subtitle, icon: Icon, features, isHighlight = false }) => {
  return (
    <div
      className={`relative rounded-2xl p-6 h-fit overflow-hidden ${
        isHighlight
          ? "bg-white dark:bg-[#14112a] border-2 border-brand-primary dark:border-brand-accent"
          : "bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8"
      }`}
    >
      {isHighlight && (
        <div className="absolute top-0 right-0 px-3 py-1 bg-brand-accent text-brand-dark text-xs font-bold rounded-bl-xl">
          Full access
        </div>
      )}

      <div className="flex items-center gap-3 mb-5">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isHighlight
              ? "bg-brand-surface dark:bg-brand-accent/15"
              : "bg-gray-100 dark:bg-white/6"
          }`}
        >
          <Icon
            className={`w-5 h-5 ${
              isHighlight
                ? "text-brand-primary dark:text-brand-accent"
                : "text-gray-500 dark:text-white/40"
            }`}
          />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className={`text-xs ${isHighlight ? "text-brand-primary dark:text-brand-accent" : "text-gray-400 dark:text-white/30"}`}>
            {subtitle}
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {features.map((feature, i) => (
          <div key={i} className="flex items-start gap-2.5">
            {feature.available ? (
              <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <XMarkIcon className="w-4 h-4 text-gray-300 dark:text-white/20 shrink-0 mt-0.5" />
            )}
            <span
              className={`text-xs leading-relaxed ${
                feature.available
                  ? "text-gray-700 dark:text-white/70"
                  : "text-gray-400 dark:text-white/25"
              }`}
            >
              {feature.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeatureCard;
