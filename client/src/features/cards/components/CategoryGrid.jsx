import { ArrowRightIcon } from "@heroicons/react/24/outline";

const CategoryGrid = ({ categories, onCategoryClick, activeCategory }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
      {categories.map((item) => {
        const { category, cardCount } = item ?? {};
        const isActive = activeCategory === category;

        return (
          <div
            key={category}
            onClick={() => onCategoryClick(category)}
            className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 ${
              isActive
                ? "bg-brand-primary dark:bg-brand-primary border border-brand-primary shadow-lg shadow-brand-primary/20"
                : "bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 hover:border-gray-300 dark:hover:border-white/15 hover:shadow-sm"
            }`}
          >
            {/* Bottom amber accent bar — slides in on hover */}
            {!isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left z-10" />
            )}

            <div className="relative p-6 h-36 flex flex-col justify-between">
              <h3
                className={`font-heading text-lg leading-snug line-clamp-3 transition-colors duration-200 ${
                  isActive
                    ? "text-white"
                    : "text-gray-900 dark:text-white group-hover:text-brand-primary dark:group-hover:text-brand-accent"
                }`}
              >
                {category}
              </h3>

              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-medium ${
                    isActive
                      ? "text-white/70"
                      : "text-gray-400 dark:text-white/35"
                  }`}
                >
                  {cardCount} {cardCount === 1 ? "card" : "cards"}
                </span>
                <ArrowRightIcon
                  className={`h-4 w-4 transition-all duration-200 ${
                    isActive
                      ? "text-white/60"
                      : "text-gray-300 dark:text-white/20 group-hover:text-brand-accent group-hover:translate-x-0.5"
                  }`}
                />
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
};

export default CategoryGrid;
