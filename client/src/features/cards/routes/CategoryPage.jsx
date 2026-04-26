import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CategorySkeleton from "../../../components/ui/skeletons/CategoryPageSkeleton";
import PreviouslyStudied from "../../progress/components/PreviouslyStudied";
import CreateCategoryCard from "../components/CreateCategoryCard";
import CategoryHeader from "../components/CategoryHeader";
import Modal from "../../../components/ui/Modal";
import CategorySearch from "../components/CategorySearch";
import CategoryGrid from "../components/CategoryGrid";
import CategoryGridSkeleton from "../../../components/ui/skeletons/CategoryGridSkeleton";
import Pagination from "../../../components/ui/Pagination";
import useCategoriesWithSearch from "../../../hooks/useCategoriesWithSearch";
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Helmet } from "@dr.pogodin/react-helmet";

function CategoryPage() {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const {
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    categories: currentCategories,
    total: totalItemsCount,
    totalPages,
    isFetching,
    isLoading,
    isSearching,
  } = useCategoriesWithSearch();

  const filteredItemsCount = currentCategories.length;

  const handleCategoryClick = (category) => {
    navigate(`/category/${category}`);
  };

  const handleCreateCategory = (newCategoryName) => {
    navigate(`/category/${newCategoryName}`);
    setShowCreateForm(false);
  };

  if (isLoading) {
    return <CategorySkeleton />;
  }

  return (
    <div className="min-h-screen bg-brand-light dark:bg-[#0f0d1a] font-sans">
      <Helmet>
        <title>Categories - RetainLearn</title>
        <meta name="description" content="Browse and explore all flashcard categories to begin studying." />
        <meta property="og:title" content="Categories - RetainLearn" />
        <meta property="og:description" content="Browse and explore all flashcard categories to begin studying." />
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <PreviouslyStudied />
        <CategoryHeader />

        <div className="mb-16">
          <CategorySearch
            searchQuery={searchQuery}
            onSearchChange={(e) => setSearchQuery(e.target.value)}
            onShowCreateForm={() => setShowCreateForm(true)}
            filteredCount={filteredItemsCount}
            totalCount={totalItemsCount}
          />

          {filteredItemsCount === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-white/8 rounded-2xl mb-6">
                <MagnifyingGlassIcon className="h-7 w-7 text-gray-400 dark:text-white/30" />
              </div>
              <h3 className="font-heading text-2xl text-gray-700 dark:text-white mb-2">
                {searchQuery ? "No categories found" : "No categories yet"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-white/40 max-w-sm mx-auto mb-8 leading-relaxed">
                {isSearching
                  ? `Nothing matches "${searchQuery}". Try a different search term.`
                  : "Create your first category to start organising your study materials."}
              </p>
              {!isSearching && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-indigo-700 dark:bg-brand-accent dark:hover:bg-amber-400 dark:text-brand-dark text-white font-semibold text-sm rounded-xl transition-colors duration-150 shadow-sm"
                >
                  <PlusIcon className="h-4 w-4" />
                  Create First Category
                </button>
              )}
            </div>
          ) : (
            <>
              {isFetching ? (
                <CategoryGridSkeleton count={12} />
              ) : (
                <CategoryGrid
                  categories={currentCategories}
                  onCategoryClick={handleCategoryClick}
                />
              )}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsCount={totalItemsCount}
                  itemsPerPage={12}
                />
              )}
            </>
          )}
        </div>

        <Modal
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          maxWidth="md"
        >
          <CreateCategoryCard
            onCreate={handleCreateCategory}
            onCancel={() => setShowCreateForm(false)}
          />
        </Modal>
      </div>
    </div>
  );
}

export default CategoryPage;
