import { useState } from "react";
import { PlusIcon, FolderPlusIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { normalizeCategory } from "../../../utils/textNormalization";

const CreateCategoryCard = ({ onCreate, onCancel }) => {
  const [newCategory, setNewCategory] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newCategory.trim()) {
      onCreate(normalizeCategory(newCategory));
      setNewCategory("");
    }
  };

  return (
    <div className="relative bg-white dark:bg-[#14112a] p-8">
      {onCancel && (
        <button
          onClick={onCancel}
          className="cursor-pointer absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white/60 rounded-lg transition-colors"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}

      {/* Icon */}
      <div className="w-12 h-12 rounded-xl bg-brand-surface dark:bg-white/8 flex items-center justify-center mb-6">
        <FolderPlusIcon className="h-6 w-6 text-brand-primary dark:text-brand-accent/80" />
      </div>

      {/* Heading */}
      <h3 className="font-heading text-2xl text-gray-900 dark:text-white mb-1.5">
        New category
      </h3>
      <p className="text-sm text-gray-500 dark:text-white/45 leading-relaxed mb-8 max-w-sm">
        Give it a name and start adding flashcards and quizzes to it.
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Category name..."
          autoFocus
          className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-accent/20 focus:border-brand-primary dark:focus:border-brand-accent/40 transition-all duration-200"
        />

        <div className="flex gap-2 pt-1">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="cursor-pointer flex-1 px-4 py-3 text-sm font-medium text-gray-600 dark:text-white/60 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-150"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!newCategory.trim()}
            className="cursor-pointer flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed dark:bg-brand-accent dark:hover:bg-amber-400 dark:text-brand-dark dark:disabled:bg-white/10 dark:disabled:text-white/25 text-white font-semibold text-sm rounded-xl transition-colors duration-150"
          >
            <PlusIcon className="h-4 w-4" />
            Create
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCategoryCard;
