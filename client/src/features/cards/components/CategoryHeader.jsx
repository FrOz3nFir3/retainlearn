const CategoryHeader = () => {
  return (
    <div className="mb-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-4">
        Browse categories
      </p>
      <h1 className="font-heading text-4xl sm:text-5xl text-gray-900 dark:text-white leading-tight mb-4">
        Pick a category.
        <br />
        <span className="text-gray-400 dark:text-white/30">Start learning.</span>
      </h1>
      <p className="text-base text-gray-500 dark:text-white/50 max-w-lg leading-relaxed">
        Browse public categories or create your own to organise your study
        material.
      </p>
    </div>
  );
};

export default CategoryHeader;
