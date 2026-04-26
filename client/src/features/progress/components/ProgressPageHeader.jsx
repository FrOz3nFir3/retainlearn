const ProgressPageHeader = ({ user }) => {
  return (
    <div className="mb-10">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-3">
        Your progress
      </p>
      <h1 className="font-heading text-4xl sm:text-5xl text-gray-900 dark:text-white leading-tight">
        Learning dashboard.
      </h1>
      <p className="text-sm text-gray-500 dark:text-white/45 mt-2">
        Welcome back,{" "}
        <span className="font-semibold text-gray-700 dark:text-white/70">
          {user.name || user.email}
        </span>
        . Here's how you're doing.
      </p>
    </div>
  );
};

export default ProgressPageHeader;
