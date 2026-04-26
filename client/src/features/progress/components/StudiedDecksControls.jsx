import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

const StudiedDecksControls = ({
  searchQuery,
  setSearchQuery,
  totalCount,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
      <div className="relative w-full sm:max-w-sm">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
          <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 dark:text-white/30" />
        </div>
        <input
          type="text"
          placeholder="Search your progress..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-accent/20 focus:border-brand-primary dark:focus:border-brand-accent/40 transition-all duration-200"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-white/60"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30 whitespace-nowrap">
        {totalCount} {totalCount === 1 ? "deck" : "decks"}
      </span>
    </div>
  );
};

export default StudiedDecksControls;
