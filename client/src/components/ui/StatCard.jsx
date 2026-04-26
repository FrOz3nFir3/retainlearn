const StatCard = ({ name, stat, icon: Icon, description, trend }) => (
  <div className="bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl p-6 h-full flex flex-col">
    <div className="flex items-start justify-between mb-4">
      <div className="w-10 h-10 rounded-xl bg-brand-surface dark:bg-white/8 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-brand-primary dark:text-brand-accent/80" />
      </div>
      {trend && (
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">
          {trend}
        </span>
      )}
    </div>
    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-1">
      {name}
    </p>
    <p className="font-heading text-3xl text-gray-900 dark:text-white mb-2">{stat}</p>
    {description && (
      <p className="text-xs text-gray-400 dark:text-white/30 leading-relaxed mt-auto">
        {description}
      </p>
    )}
  </div>
);

export default StatCard;
