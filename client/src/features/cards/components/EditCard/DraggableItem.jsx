import { useState, useRef, useEffect, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getTextFromHtml } from "../../../../utils/dom";
import {
  Bars3Icon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";

const DraggableItem = ({
  id,
  index,
  content,
  contentType,
  totalItems,
  onMoveToTop,
  onMoveToBottom,
  onMoveToPosition,
  onMoveUp,
  onMoveDown,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [targetPosition, setTargetPosition] = useState("");
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    setTimeout(() => {
      menuRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
    const handleClickOutside = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const displayText = useMemo(() => {
    if (contentType === "flashcards") return getTextFromHtml(content.question || "");
    return getTextFromHtml(content.quizQuestion || "");
  }, [content, contentType]);

  const handlePositionSubmit = (e) => {
    e.preventDefault();
    const position = parseInt(targetPosition, 10);
    if (!isNaN(position) && position >= 1 && position <= totalItems) {
      onMoveToPosition(position);
      setTargetPosition("");
      setShowMenu(false);
    }
  };

  const handleMenuAction = (action) => {
    action();
    setShowMenu(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white dark:bg-[#14112a] rounded-xl transition-all duration-200 ${
        isDragging
          ? "opacity-60 scale-[1.01] shadow-lg border-2 border-brand-primary dark:border-brand-accent z-50 cursor-grabbing"
          : "border border-gray-200 dark:border-white/8 hover:border-gray-300 dark:hover:border-white/15 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="shrink-0 p-2 sm:p-1 -ml-1 sm:ml-0 text-gray-300 dark:text-white/20 hover:text-gray-500 dark:hover:text-white/50 cursor-grab active:cursor-grabbing transition-colors duration-150 touch-none"
          title="Drag to reorder"
        >
          <Bars3Icon className="h-5 w-5" />
        </div>

        {/* Index badge + content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="shrink-0 text-xs font-semibold text-gray-500 dark:text-white/40 bg-gray-100 dark:bg-white/6 border border-gray-200 dark:border-white/8 px-2 py-0.5 rounded-lg">
              #{index + 1}
            </span>
            <p className="text-sm text-gray-700 dark:text-white/70 line-clamp-3 leading-relaxed">
              {displayText || "No content available"}
            </p>
          </div>
        </div>

        {/* Action menu */}
        <div className="relative shrink-0">
          <button
            ref={buttonRef}
            onClick={() => setShowMenu(!showMenu)}
            className="cursor-pointer p-2 text-gray-400 dark:text-white/25 hover:text-gray-700 dark:hover:text-white/70 hover:bg-gray-100 dark:hover:bg-white/6 rounded-lg transition-colors duration-150"
            title="More actions"
          >
            <EllipsisHorizontalIcon className="h-5 w-5" />
          </button>

          {showMenu && (
            <div
              ref={menuRef}
              className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-xl shadow-lg z-50"
            >
              <div className="py-1">
                {index > 0 && (
                  <button
                    onClick={() => handleMenuAction(onMoveUp)}
                    className="cursor-pointer w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2 transition-colors duration-150"
                  >
                    <ChevronUpIcon className="h-4 w-4" />
                    Move Up
                  </button>
                )}
                {index < totalItems - 1 && (
                  <button
                    onClick={() => handleMenuAction(onMoveDown)}
                    className="cursor-pointer w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2 transition-colors duration-150"
                  >
                    <ChevronDownIcon className="h-4 w-4" />
                    Move Down
                  </button>
                )}

                {(index > 0 || index < totalItems - 1) && (
                  <div className="border-t border-gray-100 dark:border-white/6 my-1" />
                )}

                {index > 0 && (
                  <button
                    onClick={() => handleMenuAction(onMoveToTop)}
                    className="cursor-pointer w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2 transition-colors duration-150"
                  >
                    <ArrowUpIcon className="h-4 w-4" />
                    Move to Top
                  </button>
                )}
                {index < totalItems - 1 && (
                  <button
                    onClick={() => handleMenuAction(onMoveToBottom)}
                    className="cursor-pointer w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2 transition-colors duration-150"
                  >
                    <ArrowDownIcon className="h-4 w-4" />
                    Move to Bottom
                  </button>
                )}

                <div className="border-t border-gray-100 dark:border-white/6 my-1" />

                {/* Jump to position */}
                <div className="px-3 py-2">
                  <form onSubmit={handlePositionSubmit} className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max={totalItems}
                      placeholder="Position"
                      value={targetPosition}
                      onChange={(e) => setTargetPosition(e.target.value)}
                      className="flex-1 h-8 text-xs px-2 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-accent/20"
                    />
                    <button
                      type="submit"
                      disabled={!targetPosition || parseInt(targetPosition) === index + 1}
                      className="cursor-pointer h-8 px-3 text-xs font-semibold bg-brand-primary dark:bg-brand-accent text-white dark:text-brand-dark rounded-lg hover:bg-indigo-700 dark:hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                    >
                      Go
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dragging overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-brand-primary/5 dark:bg-brand-accent/5 rounded-xl pointer-events-none" />
      )}
    </div>
  );
};

export default DraggableItem;
