import React from "react";
import Modal from "../../../../components/ui/Modal";
import RichTextEditor from "../../../../components/ui/RichTextEditor";
import {
  CheckIcon,
  XMarkIcon,
  UserCircleIcon,
  ClockIcon,
  ClipboardDocumentCheckIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../authentication/state/authSlice";

const ReviewQueueModal = ({
  isOpen,
  onClose,
  queueItem,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
  error,
}) => {
  const {
    changeType,
    field,
    submittedBy,
    submittedAt,
    newValue,
    oldValue,
    newDisplayText,
    oldDisplayText,
    expiresAt,
  } = queueItem;

  const user = useSelector(selectCurrentUser);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " at " + date.toLocaleTimeString();
  };

  const getChangeTypeIcon = (type) => {
    switch (type) {
      case "edit":
        return <PencilIcon className="h-5 w-5 text-brand-primary dark:text-brand-accent" />;
      case "addition":
        return <PlusIcon className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />;
      case "deletion":
        return <TrashIcon className="h-5 w-5 text-red-500 dark:text-red-400" />;
      default:
        return <PencilIcon className="h-5 w-5 text-gray-500 dark:text-white/40" />;
    }
  };

  const getChangeTypeBg = (type) => {
    switch (type) {
      case "edit":
        return "bg-brand-surface dark:bg-white/8";
      case "addition":
        return "bg-emerald-50 dark:bg-emerald-500/10";
      case "deletion":
        return "bg-red-50 dark:bg-red-500/10";
      default:
        return "bg-gray-100 dark:bg-white/8";
    }
  };

  const getChangeTypeText = (type) => {
    switch (type) {
      case "edit":
        return "Edit Change";
      case "addition":
        return "Addition";
      case "deletion":
        return "Deletion";
      default:
        return "Change";
    }
  };

  const renderValue = (value, displayText, fieldName) => {
    if (displayText) {
      if (fieldName.endsWith(" Order") || fieldName === "Quiz Flashcard Association") {
        return (
          <pre className="text-sm text-gray-800 dark:text-white/80 whitespace-pre-wrap max-h-96 overflow-y-auto">
            {displayText}
          </pre>
        );
      }
    }

    if (typeof value === "string" && value.includes("<") && value.includes(">")) {
      return (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <RichTextEditor initialContent={value} editable={false} />
        </div>
      );
    }

    if (typeof value === "object" && value !== null) {
      if (fieldName.includes("Flashcard") || fieldName.includes("Quiz")) {
        return renderDeletionValue(value, fieldName);
      }
      return (
        <pre className="text-sm text-gray-800 dark:text-white/80 whitespace-pre-wrap max-h-96 overflow-y-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    return (
      <div className="text-sm text-gray-800 dark:text-white/80 whitespace-pre-wrap">
        {String(value)}
      </div>
    );
  };

  const renderGroupedChanges = (individualChanges) => {
    if (!individualChanges || !Array.isArray(individualChanges)) return null;
    return (
      <div className="space-y-4">
        <div className="text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider mb-2">
          Detailed Changes ({individualChanges.length})
        </div>
        <div className="space-y-3">
          {individualChanges.map((change, index) => (
            <div key={index} className="border border-gray-200 dark:border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-white/70">
                  {change.field}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  change.changeType === "edit"
                    ? "bg-brand-surface dark:bg-brand-accent/10 text-brand-primary dark:text-brand-accent"
                    : change.changeType === "addition"
                    ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400"
                }`}>
                  {change.changeType}
                </span>
              </div>

              {change.changeType === "edit" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1.5">Before:</p>
                    <div className="bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 rounded-lg p-3">
                      {renderValue(change.oldValue, change.oldDisplayText, change.field)}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1.5">After:</p>
                    <div className="bg-emerald-50 dark:bg-emerald-500/8 border border-emerald-200 dark:border-emerald-500/20 rounded-lg p-3">
                      {renderValue(change.newValue, change.newDisplayText, change.field)}
                    </div>
                  </div>
                </div>
              )}

              {change.changeType === "addition" && (
                <div>
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1.5">Adding:</p>
                  <div className="bg-emerald-50 dark:bg-emerald-500/8 border border-emerald-200 dark:border-emerald-500/20 rounded-lg p-3">
                    {change.field.includes("New Flashcard") || change.field.includes("New Quiz")
                      ? renderAdditionValue(change.newValue, change.field)
                      : renderValue(change.newValue, change.newDisplayText, change.field)}
                  </div>
                </div>
              )}

              {change.changeType === "deletion" && (
                <div>
                  <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1.5">Removing:</p>
                  <div className="bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 rounded-lg p-3">
                    {change.field.includes("Flashcard") || change.field.includes("Quiz")
                      ? renderDeletionValue(change.oldValue, change.field)
                      : renderValue(change.oldValue, change.oldDisplayText, change.field)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDeletionValue = (value, fieldName) => {
    if (fieldName.includes("Flashcard") && typeof value === "object" && value !== null) {
      return (
        <div className="space-y-3">
          {value.question && (
            <div>
              <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1.5">Question:</p>
              <div className="bg-white/60 dark:bg-white/3 rounded-lg p-3 border border-red-200/50 dark:border-red-500/15">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <RichTextEditor initialContent={value.question} editable={false} />
                </div>
              </div>
            </div>
          )}
          {value.answer && (
            <div>
              <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1.5">Answer:</p>
              <div className="bg-white/60 dark:bg-white/3 rounded-lg p-3 border border-red-200/50 dark:border-red-500/15">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <RichTextEditor initialContent={value.answer} editable={false} />
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (fieldName.includes("Quiz") && typeof value === "object" && value !== null) {
      return (
        <div className="space-y-3">
          {value.quizQuestion && (
            <div>
              <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1.5">Question:</p>
              <div className="bg-white/60 dark:bg-white/3 rounded-lg p-3 border border-red-200/50 dark:border-red-500/15">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <RichTextEditor initialContent={value.quizQuestion} editable={false} />
                </div>
              </div>
            </div>
          )}
          {value.quizAnswer && (
            <div>
              <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1.5">Answer:</p>
              <div className="bg-white/60 dark:bg-white/3 rounded-lg p-3 border border-red-200/50 dark:border-red-500/15">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <RichTextEditor initialContent={value.quizAnswer} editable={false} />
                </div>
              </div>
            </div>
          )}
          {value.options && value.options.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1.5">Options:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {value.options.map((option, index) => (
                  <div key={index} className="bg-white/60 dark:bg-white/3 rounded-lg p-3 border border-red-200/50 dark:border-red-500/15">
                    <span className="text-xs font-medium text-red-500 dark:text-red-400 mb-1 block">Option {index + 2}</span>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <RichTextEditor initialContent={option} editable={false} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {value.minimumOptions && (
            <div>
              <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1.5">Minimum Options:</p>
              <div className="bg-white/60 dark:bg-white/3 rounded-lg p-3 border border-red-200/50 dark:border-red-500/15">
                <p className="text-sm text-gray-700 dark:text-white/70">{value.minimumOptions}</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    return renderValue(value, null, fieldName);
  };

  const renderAdditionValue = (value, fieldName) => {
    if (fieldName.includes("Flashcard") && typeof value === "object" && value !== null) {
      return (
        <div className="space-y-3">
          {value.question && (
            <div>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1.5">Question:</p>
              <div className="bg-white/60 dark:bg-white/3 rounded-lg p-3 border border-emerald-200/50 dark:border-emerald-500/15">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <RichTextEditor initialContent={value.question} editable={false} />
                </div>
              </div>
            </div>
          )}
          {value.answer && (
            <div>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1.5">Answer:</p>
              <div className="bg-white/60 dark:bg-white/3 rounded-lg p-3 border border-emerald-200/50 dark:border-emerald-500/15">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <RichTextEditor initialContent={value.answer} editable={false} />
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (fieldName.includes("Quiz") && typeof value === "object" && value !== null) {
      return (
        <div className="space-y-3">
          {value.quizQuestion && (
            <div>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1.5">Question:</p>
              <div className="bg-white/60 dark:bg-white/3 rounded-lg p-3 border border-emerald-200/50 dark:border-emerald-500/15">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <RichTextEditor initialContent={value.quizQuestion} editable={false} />
                </div>
              </div>
            </div>
          )}
          {value.quizAnswer && (
            <div>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1.5">Answer:</p>
              <div className="bg-white/60 dark:bg-white/3 rounded-lg p-3 border border-emerald-200/50 dark:border-emerald-500/15">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <RichTextEditor initialContent={value.quizAnswer} editable={false} />
                </div>
              </div>
            </div>
          )}
          {value.options && value.options.length > 0 && (
            <div>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1.5">Options:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {value.options.map((option, index) => (
                  <div key={index} className="bg-white/60 dark:bg-white/3 rounded-lg p-3 border border-emerald-200/50 dark:border-emerald-500/15">
                    <span className="text-xs font-medium text-emerald-500 dark:text-emerald-400 mb-1 block">Option {index + 2}</span>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <RichTextEditor initialContent={option} editable={false} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {value.minimumOptions && (
            <div>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1.5">Minimum Options:</p>
              <div className="bg-white/60 dark:bg-white/3 rounded-lg p-3 border border-emerald-200/50 dark:border-emerald-500/15">
                <p className="text-sm text-gray-700 dark:text-white/70">{value.minimumOptions}</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    return renderValue(value, null, fieldName);
  };

  return (
    <Modal
      maxWidth="7xl"
      isOpen={isOpen}
      onClose={onClose}
      title="Review Change"
      className="z-70!"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 ${getChangeTypeBg(changeType)} rounded-xl`}>
              {getChangeTypeIcon(changeType)}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-0.5">
                Review
              </p>
              <h2 className="font-heading text-xl text-gray-900 dark:text-white">
                {getChangeTypeText(changeType)}
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

        {/* Info Banner */}
        <div className="bg-brand-surface dark:bg-white/5 border border-brand-primary/10 dark:border-white/8 rounded-xl p-3.5 flex items-center gap-3">
          <div className={`p-2 ${getChangeTypeBg(changeType)} rounded-lg shrink-0`}>
            {getChangeTypeIcon(changeType)}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-white/70">
              Collaborative {changeType} to {field}
            </p>
            <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">
              This change will{" "}
              {changeType === "deletion"
                ? "remove content"
                : changeType === "addition"
                ? "add new content"
                : "modify existing content"}
            </p>
          </div>
        </div>
      </div>

      {/* Change Details */}
      <div className="bg-white dark:bg-white/3 rounded-2xl border border-gray-200 dark:border-white/8 mb-6">
        <div className="p-5">
          {/* Field and User Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-gray-100 dark:border-white/6">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">{field}</h3>
              <p className="text-xs text-gray-400 dark:text-white/30">Field modification details</p>
            </div>
            <div className="flex flex-col sm:items-end gap-1.5">
              {submittedBy && submittedBy.name && (
                <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-white/50">
                  <UserCircleIcon className="h-3.5 w-3.5 text-brand-primary dark:text-brand-accent" />
                  <span className="font-medium">{submittedBy.name} (@{submittedBy.username})</span>
                </div>
              )}
              {submittedBy && !submittedBy.name && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-white/30 italic">
                  <UserCircleIcon className="h-3.5 w-3.5" />
                  User information loading...
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-white/30">
                <ClockIcon className="h-3.5 w-3.5" />
                Submitted: {formatDate(submittedAt)}
              </div>
              {expiresAt && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-white/30">
                  <ClockIcon className="h-3.5 w-3.5" />
                  Expires: {formatDate(expiresAt)}
                </div>
              )}
            </div>
          </div>

          {/* Content Comparison */}
          <div className="space-y-4">
            {queueItem.metadata && queueItem.metadata.individualChanges ? (
              renderGroupedChanges(queueItem.metadata.individualChanges)
            ) : (
              <>
                {changeType === "edit" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">Current</p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
                        {renderValue(oldValue, oldDisplayText, field)}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Proposed</p>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-500/8 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4">
                        {renderValue(newValue, newDisplayText, field)}
                      </div>
                    </div>
                  </div>
                )}

                {changeType === "addition" && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Content to Add</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-500/8 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4">
                      {renderAdditionValue(newValue, field)}
                    </div>
                  </div>
                )}

                {changeType === "deletion" && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                      <p className="text-sm font-semibold text-red-600 dark:text-red-400">Content to Remove</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
                      {field.includes("Flashcard") || field.includes("Quiz")
                        ? renderDeletionValue(oldValue, field)
                        : renderValue(oldValue, oldDisplayText, field)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 mb-4 flex items-start gap-2.5">
          <ExclamationTriangleIcon className="h-4 w-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="pt-4 mt-4 flex flex-wrap gap-3 items-center justify-between border-t border-gray-100 dark:border-white/6">
        <span className="text-xs text-gray-400 dark:text-white/30">
          Accept or reject this collaborative change
        </span>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={onClose}
            disabled={isAccepting || isRejecting}
            className="cursor-pointer px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-white/60 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 transition-colors duration-150"
          >
            Cancel
          </button>
          <button
            onClick={onReject}
            disabled={isAccepting || isRejecting || !user}
            className="cursor-pointer flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {isRejecting ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <XMarkIcon className="h-4 w-4" />
            )}
            {isRejecting ? "Rejecting..." : "Reject"}
          </button>
          <button
            onClick={onAccept}
            disabled={isAccepting || isRejecting || !user}
            className="cursor-pointer flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {isAccepting ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <CheckIcon className="h-4 w-4" />
            )}
            {isAccepting ? "Accepting..." : "Accept"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ReviewQueueModal;
