import { MagnifyingGlassIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

const CategorySearch = ({
  searchQuery,
  onSearchChange,
  onShowCreateForm,
  filteredCount,
  totalCount,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-8">
      {/* Search input */}
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
          <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 dark:text-white/30" />
        </div>
        <input
          type="text"
          placeholder="Search categories..."
          value={searchQuery}
          onChange={onSearchChange}
          className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-accent/20 focus:border-brand-primary dark:focus:border-brand-accent/40 transition-all duration-200"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange({ target: { value: "" } })}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-white/60"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {searchQuery && (
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30 whitespace-nowrap shrink-0">
            {filteredCount} of {totalCount}
          </span>
        )}
        <button
          onClick={onShowCreateForm}
          className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-indigo-700 dark:bg-brand-accent dark:hover:bg-amber-400 dark:text-brand-dark text-white font-semibold text-sm rounded-xl transition-colors duration-150 shadow-sm whitespace-nowrap"
        >
          <PlusIcon className="h-4 w-4" />
          New Category
        </button>
      </div>
    </div>
  );
};

export default CategorySearch;
