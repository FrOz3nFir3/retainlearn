import { Link, useLocation, useSearchParams } from "react-router-dom";

const ActionCard = ({
  to,
  icon: Icon,
  solidIcon: SolidIcon,
  title,
  subtitle,
  description,
  layout = "vertical",
  stats,
  className,
}) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view");

  let toName = to;
  if (to.includes("..")) {
    const [, routeName] = to.split("/");
    toName = routeName;
  }

  const isActive =
    location.pathname.includes(toName) ||
    (toName?.startsWith("edit") && toName?.includes(view));

  if (layout === "horizontal") {
    return (
      <Link to={to} className={`group block ${className || ""}`}>
        <div
          className={`relative rounded-2xl p-5 h-full overflow-hidden transition-all duration-200 ${
            isActive
              ? "bg-brand-primary dark:bg-brand-dark border-2 border-brand-primary dark:border-brand-accent shadow-lg"
              : "bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 hover:border-gray-300 dark:hover:border-white/15 hover:shadow-sm"
          }`}
        >
          {/* Amber accent bar */}
          {!isActive && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          )}

          <div className="flex items-start gap-4 h-full">
            <div
              className={`shrink-0 p-2.5 rounded-xl transition-colors duration-150 ${
                isActive
                  ? "bg-white/15"
                  : "bg-brand-surface dark:bg-white/8 group-hover:bg-brand-surface dark:group-hover:bg-white/10"
              }`}
            >
              {isActive ? (
                <SolidIcon className="w-6 h-6 text-white dark:text-brand-accent" />
              ) : (
                <Icon className="w-6 h-6 text-brand-primary dark:text-brand-accent/70" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className={`font-heading text-base leading-tight mb-0.5 ${isActive ? "text-white" : "text-gray-900 dark:text-white"}`}>
                {title}
              </h3>
              <p className={`text-xs mb-1 ${isActive ? "text-white/70" : "text-brand-primary dark:text-brand-accent/70"}`}>
                {subtitle}
              </p>
              <p className={`text-xs leading-relaxed ${isActive ? "text-white/60" : "text-gray-500 dark:text-white/40"}`}>
                {description}
              </p>

              {stats && (
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/10">
                  {stats.map((stat, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <stat.icon className={`w-3.5 h-3.5 ${isActive ? "text-white/70" : "text-gray-400 dark:text-white/30"}`} />
                      <span className={`text-xs font-semibold ${isActive ? "text-white" : "text-gray-700 dark:text-white/70"}`}>
                        {stat.value}
                      </span>
                      <span className={`text-xs ${isActive ? "text-white/60" : "text-gray-400 dark:text-white/30"}`}>
                        {stat.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Vertical layout (overview page)
  return (
    <Link to={to} className={`group block ${className || ""}`}>
      <div
        className={`relative rounded-2xl p-8 text-center h-full min-h-[220px] overflow-hidden transition-all duration-200 flex flex-col items-center justify-center gap-4 ${
          isActive
            ? "bg-brand-primary dark:bg-brand-dark border-2 border-brand-primary dark:border-brand-accent shadow-lg"
            : "bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 hover:border-gray-300 dark:hover:border-white/15 hover:shadow-sm"
        }`}
      >
        {/* Amber accent bar */}
        {!isActive && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
        )}

        {/* Icon */}
        <div
          className={`p-4 rounded-2xl transition-colors duration-150 ${
            isActive
              ? "bg-white/15"
              : "bg-brand-surface dark:bg-white/8 group-hover:bg-brand-surface dark:group-hover:bg-white/10"
          }`}
        >
          {isActive ? (
            <SolidIcon className="w-8 h-8 text-white dark:text-brand-accent" />
          ) : (
            <Icon className="w-8 h-8 text-brand-primary dark:text-brand-accent/70" />
          )}
        </div>

        {/* Text */}
        <div>
          <h3 className={`font-heading text-xl mb-1 ${isActive ? "text-white" : "text-gray-900 dark:text-white"}`}>
            {title}
          </h3>
          <p className={`text-xs font-semibold mb-2 ${isActive ? "text-white/70" : "text-brand-primary dark:text-brand-accent/70"}`}>
            {subtitle}
          </p>
          <p className={`text-sm leading-relaxed max-w-xs mx-auto ${isActive ? "text-white/60" : "text-gray-500 dark:text-white/40"}`}>
            {description}
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="flex justify-center gap-6 pt-3 border-t border-white/10 w-full">
            {stats.map((stat, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <stat.icon className={`w-4 h-4 ${isActive ? "text-white/70" : "text-gray-400 dark:text-white/30"}`} />
                <span className={`text-sm font-semibold ${isActive ? "text-white" : "text-gray-700 dark:text-white/70"}`}>
                  {stat.value}
                </span>
                <span className={`text-xs ${isActive ? "text-white/60" : "text-gray-400 dark:text-white/30"}`}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

export default ActionCard;
