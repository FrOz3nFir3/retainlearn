import { useState } from "react";
import ReviewQueueItem from "./ReviewQueueItem";
import ReviewQueueModal from "./ReviewQueueModal";
import ReviewQueueListModal from "./ReviewQueueListModal";
import { ClipboardDocumentCheckIcon, EyeIcon } from "@heroicons/react/24/solid";
import {
  useAcceptReviewItemMutation,
  useRejectReviewItemMutation,
} from "../../../../api/apiSlice";
import toast from "react-hot-toast";

const ReviewQueueView = ({ cardId, reviewQueue, reviewQueueLength }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [acceptReviewItem, { isLoading: isAccepting }] =
    useAcceptReviewItemMutation();
  const [rejectReviewItem, { isLoading: isRejecting }] =
    useRejectReviewItemMutation();

  const [actionError, setActionError] = useState(null);

  // Check if there are more items than what's shown
  const hasMoreItems = reviewQueueLength > reviewQueue.length;

  const handleAccept = async (itemId) => {
    try {
      setActionError(null);
      const response = await acceptReviewItem({ cardId, itemId }).unwrap();
      toast.success(response.message);
    } catch (error) {
      console.error("Failed to accept review item:", error);
      setActionError(
        error?.data?.error || "Failed to accept review item. Please try again."
      );
    }
  };

  const handleReject = async (itemId) => {
    try {
      setActionError(null);
      const response = await rejectReviewItem({ cardId, itemId }).unwrap();
      toast.success(response.message);
    } catch (error) {
      console.error("Failed to reject review item:", error);
      setActionError(
        error?.data?.error || "Failed to reject review item. Please try again."
      );
    }
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleModalAccept = async () => {
    if (selectedItem) {
      try {
        await handleAccept(selectedItem._id);
        setIsModalOpen(false);
        setSelectedItem(null);
      } catch (error) {
        // Error is already handled in handleAccept
        // Keep modal open to show error
      }
    }
  };

  const handleModalReject = async () => {
    if (selectedItem) {
      try {
        await handleReject(selectedItem._id);
        setIsModalOpen(false);
        setSelectedItem(null);
      } catch (error) {
        // Error is already handled in handleReject
        // Keep modal open to show error
      }
    }
  };

  return (
    <div className="relative z-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-surface dark:bg-white/8 rounded-xl">
              <ClipboardDocumentCheckIcon className="h-5 w-5 text-brand-primary dark:text-brand-accent/70" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-0.5">
                Collaborative edits
              </p>
              <h2 className="font-heading text-xl text-gray-900 dark:text-white">
                Review Queue
              </h2>
            </div>
          </div>

          {hasMoreItems && (
            <button
              onClick={() => setIsListModalOpen(true)}
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 text-sm font-semibold rounded-xl hover:border-brand-primary/30 dark:hover:border-brand-accent/30 hover:text-brand-primary dark:hover:text-brand-accent transition-colors duration-150"
            >
              <EyeIcon className="h-4 w-4" />
              View All ({reviewQueueLength})
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {actionError && (
        <div className="flex items-center gap-3 p-4 mb-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
          <p className="text-sm text-red-700 dark:text-red-400 flex-1">{actionError}</p>
          <button
            onClick={() => setActionError(null)}
            className="cursor-pointer shrink-0 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>
      )}

      {/* Review Queue Content */}
      {reviewQueue.length > 0 ? (
        <div className="space-y-4">
          {reviewQueue.map((item) => (
            <ReviewQueueItem
              key={item._id}
              queueItem={item}
              onAccept={() => handleAccept(item._id)}
              onReject={() => handleReject(item._id)}
              onViewDetails={() => handleViewDetails(item)}
              isAccepting={isAccepting}
              isRejecting={isRejecting}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-surface dark:bg-white/8 rounded-2xl mb-4">
            <ClipboardDocumentCheckIcon className="h-6 w-6 text-brand-primary dark:text-brand-accent/70" />
          </div>
          <h3 className="font-heading text-xl text-gray-900 dark:text-white mb-1">
            No pending reviews
          </h3>
          <p className="text-sm text-gray-500 dark:text-white/40 max-w-sm mx-auto">
            All changes have been reviewed. New collaborative edits will appear here for your approval.
          </p>
        </div>
      )}

      {/* Review Queue Detail Modal */}
      {isModalOpen && selectedItem && (
        <ReviewQueueModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedItem(null);
            setActionError(null);
          }}
          queueItem={selectedItem}
          onAccept={handleModalAccept}
          onReject={handleModalReject}
          isAccepting={isAccepting}
          isRejecting={isRejecting}
          error={actionError}
        />
      )}

      {/* Review Queue List Modal */}
      <ReviewQueueListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        cardId={cardId}
      />
    </div>
  );
};

export default ReviewQueueView;
