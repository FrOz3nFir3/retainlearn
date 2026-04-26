const StatBadge = ({ label, value, icon: Icon }) => (
  <div className="bg-gray-50 dark:bg-white/4 border border-gray-100 dark:border-white/6 rounded-xl p-3 text-center">
    <div className="flex items-center justify-center gap-1 mb-1">
      <Icon className="w-3.5 h-3.5 text-gray-400 dark:text-white/30" />
      <p className="text-xs text-gray-400 dark:text-white/30 font-medium">{label}</p>
    </div>
    <p className="text-lg font-heading text-gray-900 dark:text-white">{value}</p>
  </div>
);

export default StatBadge;
