import React, { useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import Modal from "../../../../components/ui/Modal";
import DraggableItem from "./DraggableItem";
import { usePatchUpdateCardMutation } from "../../../../api/apiSlice";
import {
  AdjustmentsHorizontalIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../authentication/state/authSlice";
import toast from "react-hot-toast";

const ReorderModal = ({ isOpen, onClose, cardId, contentType, items }) => {
  const [orderedItems, setOrderedItems] = useState(items || []);
  const [updateCard, { isLoading, error }] = usePatchUpdateCardMutation();
  const user = useSelector(selectCurrentUser);
  const errorRef = React.useRef(null);

  React.useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error]);

  React.useEffect(() => {
    if (isOpen && items) {
      setOrderedItems([...items]);
    }
  }, [isOpen, items]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const itemIds = useMemo(
    () => orderedItems.map((item) => item._id),
    [orderedItems]
  );

  const hasOrderChanged = useMemo(() => {
    if (!items || orderedItems.length !== items.length) return false;
    return !orderedItems.every((item, index) => item._id === items[index]._id);
  }, [orderedItems, items]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setOrderedItems((items) => {
        const oldIndex = items.findIndex((item) => item._id === active.id);
        const newIndex = items.findIndex((item) => item._id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleMoveToTop = (itemId) => {
    setOrderedItems((items) => {
      const itemIndex = items.findIndex((item) => item._id === itemId);
      if (itemIndex > 0) {
        const item = items[itemIndex];
        const newItems = [...items];
        newItems.splice(itemIndex, 1);
        newItems.unshift(item);
        return newItems;
      }
      return items;
    });
  };

  const handleMoveToBottom = (itemId) => {
    setOrderedItems((items) => {
      const itemIndex = items.findIndex((item) => item._id === itemId);
      if (itemIndex < items.length - 1) {
        const item = items[itemIndex];
        const newItems = [...items];
        newItems.splice(itemIndex, 1);
        newItems.push(item);
        return newItems;
      }
      return items;
    });
  };

  const handleMoveUp = (itemId) => {
    setOrderedItems((items) => {
      const itemIndex = items.findIndex((item) => item._id === itemId);
      if (itemIndex > 0) {
        return arrayMove(items, itemIndex, itemIndex - 1);
      }
      return items;
    });
  };

  const handleMoveDown = (itemId) => {
    setOrderedItems((items) => {
      const itemIndex = items.findIndex((item) => item._id === itemId);
      if (itemIndex < items.length - 1) {
        return arrayMove(items, itemIndex, itemIndex + 1);
      }
      return items;
    });
  };

  const handleMoveToPosition = (itemId, position) => {
    const targetIndex = Math.max(
      0,
      Math.min(position - 1, orderedItems.length - 1)
    );
    setOrderedItems((items) => {
      const currentIndex = items.findIndex((item) => item._id === itemId);
      if (currentIndex !== targetIndex) {
        return arrayMove(items, currentIndex, targetIndex);
      }
      return items;
    });
  };

  const handleSave = () => {
    if (!cardId || orderedItems.length === 0 || !hasOrderChanged) return;
    const itemIds = orderedItems.map((item) => item._id);
    const updateData = {
      _id: cardId,
      ...(contentType === "flashcards"
        ? { reorderFlashcards: itemIds }
        : { reorderQuizzes: itemIds }),
    };
    updateCard(updateData).then((res) => {
      if (res.data) {
        toast.success(res.data.message);
        onClose();
      }
    });
  };

  const isFlashcards = contentType === "flashcards";
  const title = isFlashcards ? "Reorder Flashcards" : "Reorder Quizzes";
  const description = `Drag and drop or use the menu to reorder your ${
    isFlashcards ? "flashcards" : "quizzes"
  }.`;

  return (
    <Modal className={"p-0!"} isOpen={isOpen} onClose={onClose} maxWidth="7xl">
      <div className="bg-white dark:bg-[#14112a] rounded-2xl overflow-hidden h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex px-6 py-5 items-center justify-between border-b border-gray-100 dark:border-white/6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-surface dark:bg-white/8 rounded-xl">
              <AdjustmentsHorizontalIcon className="h-6 w-6 text-brand-primary dark:text-brand-accent/70" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-0.5">
                Organize
              </p>
              <h2 className="font-heading text-xl text-gray-900 dark:text-white leading-tight">
                {title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/8 transition-colors duration-150"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-white/40" />
          </button>
        </div>

        <div ref={errorRef}>
          {error && (
            <div className="mx-6 mt-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-2.5">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">
                Reordering failed: {error.data?.error || "Unknown error"}
              </p>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 flex flex-col">
          {orderedItems.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-surface dark:bg-white/8 rounded-2xl mb-4">
                  <AdjustmentsHorizontalIcon className="h-6 w-6 text-brand-primary dark:text-brand-accent/70" />
                </div>
                <p className="text-sm text-gray-500 dark:text-white/40">
                  No {isFlashcards ? "flashcards" : "quizzes"} to reorder.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 px-6 py-4">
              <p className="text-xs text-gray-400 dark:text-white/30 mb-4">{description}</p>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[
                  restrictToWindowEdges,
                  restrictToVerticalAxis,
                  restrictToParentElement,
                ]}
              >
                <SortableContext
                  items={itemIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="h-full overflow-y-auto overscroll-contain space-y-2">
                    {orderedItems.map((item, index) => (
                      <DraggableItem
                        key={item._id}
                        id={item._id}
                        index={index}
                        content={item}
                        contentType={contentType}
                        totalItems={orderedItems.length}
                        onMoveToTop={() => handleMoveToTop(item._id)}
                        onMoveToBottom={() => handleMoveToBottom(item._id)}
                        onMoveToPosition={(position) =>
                          handleMoveToPosition(item._id, position)
                        }
                        onMoveUp={() => handleMoveUp(item._id)}
                        onMoveDown={() => handleMoveDown(item._id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-white/3 border-t border-gray-100 dark:border-white/6 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-gray-500 dark:text-white/40">
              {hasOrderChanged ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  Order changed{!user && " — log in to save"}
                </span>
              ) : (
                "No changes made"
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="cursor-pointer px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-white/60 bg-white dark:bg-transparent border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-150 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={
                  isLoading ||
                  orderedItems.length === 0 ||
                  !hasOrderChanged ||
                  !user
                }
                className="cursor-pointer flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white dark:text-brand-dark bg-brand-primary hover:bg-indigo-700 dark:bg-brand-accent dark:hover:bg-amber-400 rounded-xl transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckIcon className="h-4 w-4" />
                )}
                {isLoading ? "Saving..." : "Save Order"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ReorderModal;
