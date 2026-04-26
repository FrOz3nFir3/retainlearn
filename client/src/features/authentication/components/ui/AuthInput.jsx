import { forwardRef } from "react";

const AuthInput = forwardRef(({ id, label, Icon, disabled, ...rest }, ref) => {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-2"
      >
        {label}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
          <Icon className="h-4 w-4 text-gray-400 dark:text-white/30" />
        </div>
        <input
          id={id}
          ref={ref}
          disabled={disabled}
          className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-accent/20 focus:border-brand-primary dark:focus:border-brand-accent/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          {...rest}
        />
      </div>
    </div>
  );
});

export default AuthInput;
