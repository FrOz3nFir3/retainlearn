import React, { useState, useEffect } from "react";
import { usePatchUpdateCardMutation } from "../../../../api/apiSlice";
import HtmlRenderer from "../../../../components/ui/HtmlRenderer";
import {
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import {
  LightBulbIcon,
  QuestionMarkCircleIcon,
  BookOpenIcon,
} from "@heroicons/react/24/solid";

import DeleteConfirmationModal from "../../../../components/ui/DeleteConfirmationModal";
import EditFlashcardModal from "./EditFlashcardModal";
import ReorderModal from "./ReorderModal";
import FlashcardTips from "./FlashcardTips";
import toast from "react-hot-toast";

const FlashcardItem = ({
  review,
  flashcard,
  cardId,
  currentIndex,
  originalIndex,
}) => {
  const [updateCard, { error, isSuccess }] = usePatchUpdateCardMutation();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const errorRef = React.useRef(null);

  const handleDeleteFlashcard = () => {
    const updateDetails = {
      _id: cardId,
      cardId: flashcard._id,
      deleteFlashcard: true,
    };
    updateCard(updateDetails).then((response) => {
      if (response.data) {
        toast.success(response.data.message);
        setIsDeleteModalOpen(false);
      }
    });
  };

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error]);

  return (
    <>
      <div className="py-1 overflow-hidden">
        {/* Status Messages */}
        <div ref={errorRef} className="space-y-4">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-0.5">Something went wrong</p>
                <p className="text-sm text-red-600 dark:text-red-300">
                  {error.data?.error || "An unexpected error occurred. Please try again."}
                </p>
              </div>
            </div>
          )}

          {isSuccess && (
            <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
              <CheckCircleIcon className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-0.5">Changes saved!</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-300">
                  Your flashcard has been updated and is ready for studying.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Card Header */}
        <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-surface dark:bg-white/8 rounded-xl">
              <BookOpenIcon className="h-5 w-5 text-brand-primary dark:text-brand-accent/70" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-0.5">Flashcard</p>
              <h2 className="font-heading text-xl text-gray-900 dark:text-white">
                #{originalIndex || currentIndex + 1}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-brand-primary hover:bg-indigo-700 dark:bg-brand-accent dark:hover:bg-amber-400 text-white dark:text-brand-dark text-sm font-semibold rounded-xl transition-colors duration-150"
              aria-label="Edit flashcard"
            >
              <PencilIcon className="h-4 w-4" />
              Edit
            </button>

            {review?.length > 1 && (
              <button
                onClick={() => setIsReorderModalOpen(true)}
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 text-sm font-semibold rounded-xl hover:border-brand-primary/30 dark:hover:border-brand-accent/30 hover:text-brand-primary dark:hover:text-brand-accent transition-colors duration-150"
                aria-label="Reorder flashcards"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                Reorder
              </button>
            )}

            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="cursor-pointer p-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:border-red-300 dark:hover:border-red-500/40 hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 dark:text-white/30 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-150"
              aria-label="Delete flashcard"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Card Content - Single Column Layout */}
        <div className="mt-4 space-y-8">
          {/* Question Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-brand-primary/10 dark:bg-white/8 rounded-lg">
                <QuestionMarkCircleIcon className="h-4 w-4 text-brand-primary dark:text-brand-accent/70" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-white/70">Front Side</p>
                <p className="text-xs text-gray-400 dark:text-white/30">What you want to learn or remember</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/4 border border-gray-200 dark:border-white/8">
              <div className="text-gray-900 dark:text-gray-100">
                <HtmlRenderer htmlContent={flashcard.question} />
              </div>
            </div>
          </div>

          {/* Answer Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-brand-surface dark:bg-white/8 rounded-lg">
                <LightBulbIcon className="h-4 w-4 text-brand-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-white/70">Back Side</p>
                <p className="text-xs text-gray-400 dark:text-white/30">The answer or explanation</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/4 border border-gray-200 dark:border-white/8">
              <div className="text-gray-900 dark:text-gray-100">
                <HtmlRenderer htmlContent={flashcard.answer} />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Tips Section */}
        <FlashcardTips className="mt-8" />
      </div>

      <EditFlashcardModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        flashcard={flashcard}
        cardId={cardId}
        key={isEditModalOpen}
      />

      <ReorderModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        cardId={cardId}
        contentType="flashcards"
        items={review || []}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteFlashcard}
        title="Delete Flashcard"
        description="Are you sure you want to permanently delete this flashcard? This action cannot be undone and will remove all associated quiz data."
      />
    </>
  );
};

export default FlashcardItem;
