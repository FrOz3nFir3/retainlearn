import React, { useState, useRef } from "react";
import { usePostCreateNewCardMutation } from "../../../api/apiSlice";
import {
  PlusIcon,
  ArrowPathIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { DocumentPlusIcon } from "@heroicons/react/24/solid";
import Modal from "../../../components/ui/Modal";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../authentication/state/authSlice";

export function NewCardForm({ category, newCard }) {
  const [isOpen, setIsOpen] = useState(newCard);
  const user = useSelector(selectCurrentUser);
  const [createNewCard, { isLoading, error, isSuccess }] =
    usePostCreateNewCardMutation();

  const topicRef = useRef(null);
  const subTopicRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const mainTopic = topicRef.current.value;
    const subTopic = subTopicRef.current.value;
    createNewCard({ mainTopic, subTopic, category });
  };

  React.useEffect(() => {
    if (!open || !isSuccess) return;
    setIsOpen(false);
  }, [open, isSuccess]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-brand-primary hover:bg-indigo-700 dark:bg-brand-accent dark:hover:bg-amber-400 dark:text-brand-dark text-white font-semibold text-sm rounded-xl transition-colors duration-150"
      >
        <PlusIcon className="h-4 w-4" />
        New Card
      </button>

      <Modal
        avoidBackDropClose={false}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        maxWidth="lg"
      >
        <div className="bg-white dark:bg-[#14112a] p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="w-10 h-10 rounded-xl bg-brand-surface dark:bg-white/8 flex items-center justify-center mb-4">
                <DocumentPlusIcon className="h-5 w-5 text-brand-primary dark:text-brand-accent/80" />
              </div>
              <h3 className="font-heading text-2xl text-gray-900 dark:text-white mb-1">
                New card
              </h3>
              <p className="text-sm text-gray-500 dark:text-white/45">
                Adding to <span className="font-semibold text-gray-700 dark:text-white/70">{category}</span>
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="cursor-pointer p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white/60 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-500/20 rounded-xl mb-6">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">
                {error.data?.error || "Failed to create card. Please try again."}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-2">
                Main topic
              </label>
              <input
                type="text"
                ref={topicRef}
                required
                disabled={isLoading}
                placeholder="What is this card about?"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-accent/20 focus:border-brand-primary dark:focus:border-brand-accent/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-2">
                Sub topic
              </label>
              <input
                type="text"
                ref={subTopicRef}
                required
                disabled={isLoading}
                placeholder="Add more detail..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-accent/20 focus:border-brand-primary dark:focus:border-brand-accent/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="cursor-pointer flex-1 px-4 py-3 text-sm font-medium text-gray-600 dark:text-white/60 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !user}
                className="cursor-pointer flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed dark:bg-brand-accent dark:hover:bg-amber-400 dark:text-brand-dark dark:disabled:bg-white/10 dark:disabled:text-white/25 text-white font-semibold text-sm rounded-xl transition-colors duration-150"
              >
                {isLoading ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <PlusIcon className="h-4 w-4" />
                )}
                {isLoading ? "Creating…" : !user ? "Login to create" : "Create card"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
