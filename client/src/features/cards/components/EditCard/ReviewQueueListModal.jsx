import React, { useEffect, useState } from "react";
import ReviewQueueItem from "./ReviewQueueItem";
import ReviewQueueModal from "./ReviewQueueModal";
import CardLogSkeleton from "../../../../components/ui/skeletons/CardLogSkeleton";
import {
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import useReviewQueue from "../../../../hooks/useReviewQueue";
import {
  useAcceptReviewItemMutation,
  useRejectReviewItemMutation,
} from "../../../../api/apiSlice";
import { toast } from "react-hot-toast";

const ReviewQueueListModal = ({ isOpen, onClose, cardId }) => {
  const {
    items: reviewQueue,
    isFetching,
    isError,
    lastItemElementRef,
  } = useReviewQueue(cardId, isOpen);

  const [acceptReviewItem, { isLoading: isAccepting }] =
    useAcceptReviewItemMutation();
  const [rejectReviewItem, { isLoading: isRejecting }] =
    useRejectReviewItemMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [actionError, setActionError] = useState(null);

  const reviewQueueContentRef = React.useRef(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleAccept = async (itemId) => {
    try {
      setActionError(null);
      const response = await acceptReviewItem({ cardId, itemId }).unwrap();
      toast.success(response.message);
    } catch (error) {
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
      setActionError(
        error?.data?.error || "Failed to reject review item. Please try again."
      );
    }
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const handleModalAccept = async () => {
    if (selectedItem) {
      try {
        await handleAccept(selectedItem._id);
        setIsDetailModalOpen(false);
        setSelectedItem(null);
      } catch (error) {}
    }
  };

  const handleModalReject = async () => {
    if (selectedItem) {
      try {
        await handleReject(selectedItem._id);
        setIsDetailModalOpen(false);
        setSelectedItem(null);
      } catch (error) {}
    }
  };

  const filteredItems = reviewQueue.filter((item) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.field?.toLowerCase().includes(searchLower) ||
      item.changeType?.toLowerCase().includes(searchLower) ||
      item.submittedBy?.name?.toLowerCase().includes(searchLower) ||
      item.submittedBy?.username?.toLowerCase().includes(searchLower) ||
      (typeof item.newValue === "string" &&
        item.newValue.toLowerCase().includes(searchLower)) ||
      (typeof item.oldValue === "string" &&
        item.oldValue.toLowerCase().includes(searchLower))
    );
  });

  const clearSearch = () => setSearchTerm("");

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex justify-end z-60"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#14112a] w-full max-w-2xl h-full shadow-2xl border-l border-gray-200 dark:border-white/8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-[#14112a] px-6 py-4 border-b border-gray-100 dark:border-white/6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-surface dark:bg-white/8 rounded-xl">
                <ClipboardDocumentCheckIcon className="h-5 w-5 text-brand-primary dark:text-brand-accent/70" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-0.5">
                  Collaborative
                </p>
                <h2 className="font-heading text-lg text-gray-900 dark:text-white">
                  Review Queue
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/8 transition-colors duration-150"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-white/40" />
            </button>
          </div>

          {/* Search */}
          <div className="mt-3 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 dark:text-white/30" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-9 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-accent/20"
              placeholder="Search review items..."
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="cursor-pointer absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-white/60"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {actionError && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-2.5">
            <p className="text-sm text-red-700 dark:text-red-300 flex-1">
              {actionError}
            </p>
            <button
              onClick={() => setActionError(null)}
              className="cursor-pointer text-red-400 hover:text-red-600 dark:hover:text-red-300 shrink-0"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Content */}
        <div
          ref={reviewQueueContentRef}
          className="flex-1 overflow-y-auto p-6 space-y-3"
          style={{ height: "calc(100vh - 140px)" }}
        >
          {isError ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-2xl mb-3">
                <ClipboardDocumentCheckIcon className="h-5 w-5 text-red-500 dark:text-red-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Failed to load review queue
              </h3>
              <p className="text-xs text-gray-400 dark:text-white/30">
                Please try refreshing the page.
              </p>
            </div>
          ) : filteredItems.length > 0 ? (
            <>
              {filteredItems.map((item, index) => {
                const isLastItem = index === filteredItems.length - 1;
                return (
                  <ReviewQueueItem
                    key={item._id}
                    ref={isLastItem ? lastItemElementRef : null}
                    queueItem={item}
                    onAccept={() => handleAccept(item._id)}
                    onReject={() => handleReject(item._id)}
                    onViewDetails={() => handleViewDetails(item)}
                    isAccepting={isAccepting}
                    isRejecting={isRejecting}
                  />
                );
              })}
              {isFetching && (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <CardLogSkeleton key={`skeleton-${i}`} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-surface dark:bg-white/8 rounded-2xl mb-3">
                <ClipboardDocumentCheckIcon className="h-5 w-5 text-brand-primary dark:text-brand-accent/70" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {searchTerm ? "No matching items" : "No pending reviews"}
              </h3>
              <p className="text-xs text-gray-400 dark:text-white/30 max-w-sm mx-auto">
                {searchTerm
                  ? "Try different search terms."
                  : "All changes have been reviewed!"}
              </p>
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="cursor-pointer mt-3 px-4 py-2 text-sm font-medium text-white dark:text-brand-dark bg-brand-primary hover:bg-indigo-700 dark:bg-brand-accent dark:hover:bg-amber-400 rounded-xl transition-colors duration-150"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {isDetailModalOpen && selectedItem && (
          <ReviewQueueModal
            isOpen={isDetailModalOpen}
            onClose={() => {
              setIsDetailModalOpen(false);
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
      </div>
    </div>
  );
};

export default ReviewQueueListModal;
