import React from "react";
import {
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  ClockIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import { getTextFromHtml } from "../../../../utils/dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../authentication/state/authSlice";

const ReviewQueueItem = React.forwardRef(
  (
    { queueItem, onAccept, onReject, onViewDetails, isAccepting, isRejecting },
    ref
  ) => {
    const {
      _id,
      changeType,
      field,
      submittedBy,
      submittedAt,
      newValue,
      oldValue,
      newDisplayText,
      oldDisplayText,
    } = queueItem;
    const user = useSelector(selectCurrentUser);

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);
      if (diffInHours < 1) {
        return `${Math.floor((now - date) / (1000 * 60))}m ago`;
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
      } else {
        return `${Math.floor(diffInHours / 24)}d ago`;
      }
    };

    const getChangeTypeIcon = (type) => {
      switch (type) {
        case "edit": return <PencilIcon className="h-3.5 w-3.5" />;
        case "addition": return <PlusIcon className="h-3.5 w-3.5" />;
        case "deletion": return <TrashIcon className="h-3.5 w-3.5" />;
        default: return <PencilIcon className="h-3.5 w-3.5" />;
      }
    };

    const getChangeTypeBadge = (type) => {
      switch (type) {
        case "edit": return "bg-brand-surface dark:bg-white/8 text-brand-primary dark:text-brand-accent/70";
        case "addition": return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
        case "deletion": return "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400";
        default: return "bg-gray-100 dark:bg-white/8 text-gray-600 dark:text-white/40";
      }
    };

    const getAccentClass = (type) => {
      switch (type) {
        case "edit": return "bg-brand-primary";
        case "addition": return "bg-emerald-500";
        case "deletion": return "bg-red-500";
        default: return "bg-gray-300 dark:bg-white/20";
      }
    };

    const getPreviewText = (value, displayText) => {
      if (displayText) return displayText;
      if (typeof value === "object" && value !== null) {
        if (value.question) {
          const stripped = getTextFromHtml(value.question);
          return stripped.length > 250 ? stripped.substring(0, 250) + "..." : stripped;
        }
        if (value.quizQuestion) {
          const stripped = getTextFromHtml(value.quizQuestion);
          return stripped.length > 250 ? stripped.substring(0, 250) + "..." : stripped;
        }
        if (field.includes("New Flashcard")) return "New flashcard with question and answer";
        if (field.includes("New Quiz")) {
          const optionCount = value.options ? value.options.length : 0;
          return `New quiz with question, answer${optionCount > 0 ? `, and ${optionCount} options` : ""}`;
        }
        if (field.includes("Flashcard") && changeType === "deletion") return "Deleting flashcard with question and answer";
        if (field.includes("Quiz") && changeType === "deletion") {
          const optionCount = value.options ? value.options.length : 0;
          return `Deleting quiz with question, answer${optionCount > 0 ? `, and ${optionCount} options` : ""}`;
        }
        return changeType === "deletion" ? "Deleting content" : "New content";
      }
      if (typeof value === "string") {
        const stripped = getTextFromHtml(value);
        return stripped.length > 250 ? stripped.substring(0, 250) + "..." : stripped;
      }
      return JSON.stringify(value);
    };

    return (
      <div
        ref={ref}
        className="relative bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl overflow-hidden"
      >
        {/* Top accent line */}
        <div className={`absolute inset-x-0 top-0 h-0.5 ${getAccentClass(changeType)}`} />

        <div className="p-5 sm:p-6 pt-6">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${getChangeTypeBadge(changeType)}`}>
              {getChangeTypeIcon(changeType)}
              <span className="capitalize">{changeType}</span>
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate mb-1">{field}</h3>
              <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-white/30">
                <span className="font-medium text-gray-600 dark:text-white/50">
                  {submittedBy?.name || "Unknown User"}
                </span>
                <span className="flex items-center gap-1">
                  <ClockIcon className="h-3 w-3" />
                  {formatDate(submittedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Content Preview */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-white/4 border border-gray-100 dark:border-white/6 rounded-xl">
            <p className="text-xs text-gray-500 dark:text-white/40 line-clamp-3 leading-relaxed">
              {changeType === "addition" && newValue && getPreviewText(newValue, newDisplayText)}
              {(changeType === "deletion" || changeType === "edit") && oldValue && getPreviewText(oldValue, oldDisplayText)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={onViewDetails}
              className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 text-xs font-semibold rounded-xl hover:border-brand-primary/30 dark:hover:border-brand-accent/30 hover:text-brand-primary dark:hover:text-brand-accent transition-colors duration-150"
            >
              <EyeIcon className="h-4 w-4" />
              View Details
            </button>

            <div className="flex gap-2 sm:flex-1">
              <button
                onClick={onReject}
                disabled={isRejecting || isAccepting || !user}
                className="cursor-pointer flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-xs font-semibold rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
              >
                {isRejecting ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <XMarkIcon className="h-4 w-4" />}
                {isRejecting ? "Rejecting…" : "Reject"}
              </button>

              <button
                onClick={onAccept}
                disabled={isAccepting || isRejecting || !user}
                className="cursor-pointer flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
              >
                {isAccepting ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-4 w-4" />}
                {isAccepting ? "Accepting…" : "Accept"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ReviewQueueItem.displayName = "ReviewQueueItem";

export default ReviewQueueItem;
