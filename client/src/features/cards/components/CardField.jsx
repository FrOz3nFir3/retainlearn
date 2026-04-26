import React, { useState, useEffect } from "react";
import { usePatchUpdateCardMutation } from "../../../api/apiSlice";
import {
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { selectCurrentUser } from "../../authentication/state/authSlice";
import { useSelector } from "react-redux";
const RichTextEditor = React.lazy(() =>
  import("../../../components/ui/RichTextEditor")
);
const HtmlRenderer = React.lazy(() =>
  import("../../../components/ui/HtmlRenderer")
);
export function CardField({
  _id,
  text,
  value,
  cardId,
  quizId,
  optionId,
  flashcardData,
}) {
  const user = useSelector(selectCurrentUser);
  const errorRef = React.useRef(null);
  const [updateCard, { isLoading, error }] = usePatchUpdateCardMutation();
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error]);

  const handleValueChange = (newContent) => {
    setInputValue(newContent);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const updateDetails = { _id, [text]: inputValue, cardId, quizId, optionId };

    updateCard(updateDetails).then((response) => {
      if (response.data) {
        setIsEditing(false);
        toast.success(response.data.message);
      }
    });
  };

  const handleCancel = () => {
    setInputValue(value);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const isUnchanged = inputValue === value;
  const isRichTextField = text === "description";

  return (
    <div className="card-field group relative">
      {/* Field label is now handled by parent FieldCard component */}
      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div ref={errorRef}>
            {error && (
              <div className="mb-3 rounded-xl bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/20">
                Update failed: {error.data?.error || "Unknown error"}
              </div>
            )}
          </div>

          {isRichTextField ? (
            <RichTextEditor
              initialContent={inputValue}
              onChange={handleValueChange}
              editable={!isLoading}
            />
          ) : text === "minimumOptions" ? (
            <input
              type={"number"}
              value={inputValue}
              onChange={(e) => handleValueChange(e.target.value)}
              className="bg-white dark:bg-white/5 dark:text-white block w-full rounded-xl border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-accent/20 sm:text-sm p-2 h-10 wrap-break-word"
              min={2}
              max={4}
              required
              disabled={isLoading}
            />
          ) : (
            <textarea
              onChange={(e) => {
                handleValueChange(e.target.value);
              }}
              defaultValue={inputValue}
              disabled={isLoading}
              className="disabled:cursor-not-allowed disabled:opacity-40 p-2 resize-none min-h-30 bg-white dark:bg-white/5 dark:text-white block w-full rounded-xl border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-accent/20 sm:text-sm wrap-break-word"
            ></textarea>
          )}

          <div className="text-xs text-gray-500 dark:text-white/40 text-right">
            {!user && "Login in to edit"}
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="cursor-pointer inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUnchanged || isLoading || !user}
              className="cursor-pointer inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-brand-primary dark:bg-brand-accent text-white dark:text-brand-dark hover:bg-indigo-700 dark:hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <CheckIcon className="h-4 w-4" />
              )}
              Save
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-start gap-2 group">
          <div className="flex-1 min-w-0">
            {isRichTextField && value.trim() ? (
              <div className="bg-gray-50 dark:bg-white/4 rounded-xl p-3 border border-gray-200 dark:border-white/8">
                <div className="prose prose-sm dark:prose-invert max-w-none max-h-96 overflow-y-auto">
                  <HtmlRenderer htmlContent={value} />
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-white/4 rounded-xl px-3 py-2.5 border border-gray-200 dark:border-white/8 w-full max-w-full">
                <p className="text-gray-900 dark:text-white/90 break-word max-h-96 overflow-y-auto text-sm leading-relaxed">
                  {value || (
                    <span className="text-gray-400 dark:text-white/30 italic">No value set</span>
                  )}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleEditClick}
            title="Edit"
            className="shrink-0 cursor-pointer text-gray-400 dark:text-white/30 hover:text-brand-primary dark:hover:text-brand-accent p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors duration-150"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
