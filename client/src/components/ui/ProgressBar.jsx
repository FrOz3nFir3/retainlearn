const ProgressBar = ({ label, value, color = "bg-brand-accent" }) => (
  <div className="mt-4">
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30">
        {label}
      </span>
      <span className="text-xs font-bold text-gray-700 dark:text-white/70">{value}%</span>
    </div>
    <div className="w-full bg-gray-100 dark:bg-white/6 rounded-full h-1.5">
      <div
        className={`${color} h-1.5 rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

export default ProgressBar;
