import React, { useState, useRef, useEffect, useMemo } from "react";
import { usePatchUpdateCardMutation } from "../../../../api/apiSlice";
import { useSelector } from "react-redux";
import {
  ArrowPathIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  QuestionMarkCircleIcon,
  LightBulbIcon,
  EyeIcon,
  BookOpenIcon,
} from "@heroicons/react/24/solid";
import Modal from "../../../../components/ui/Modal";
import RichTextEditor from "../../../../components/ui/RichTextEditor";
import Flashcard from "../Flashcard/Review/Flashcard";
import FlashcardTips from "./FlashcardTips";
import { selectCurrentUser } from "../../../authentication/state/authSlice";
import toast from "react-hot-toast";

const EditFlashcardModal = ({ isOpen, onClose, flashcard, cardId }) => {
  const user = useSelector(selectCurrentUser);
  const [updateCard, { isLoading, error }] = usePatchUpdateCardMutation();
  const errorRef = useRef(null);

  const originalState = useMemo(
    () => ({
      question: flashcard.question,
      answer: flashcard.answer,
    }),
    []
  );

  const [question, setQuestion] = useState(originalState.question);
  const [answer, setAnswer] = useState(originalState.answer);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isChanged, setIsChanged] = useState(false);

  const questionEditorRef = useRef(null);
  const answerEditorRef = useRef(null);

  useEffect(() => {
    const currentState = { question, answer };
    setIsChanged(
      JSON.stringify(originalState) !== JSON.stringify(currentState)
    );
  }, [question, answer, originalState]);

  useEffect(() => {
    setQuestion(flashcard.question);
    setAnswer(flashcard.answer);
  }, []);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isChanged) return;

    const payload = {
      _id: cardId,
      cardId: flashcard._id,
    };

    if (originalState.question !== question) {
      payload.question = question;
    }
    if (originalState.answer !== answer) {
      payload.answer = answer;
    }

    updateCard(payload).then((response) => {
      if (response.data) {
        toast.success(response.data.message);
        onClose();
      }
    });
  };

  const handleClose = () => {
    setQuestion(originalState.question);
    setAnswer(originalState.answer);
    setIsFlipped(false);
    onClose();
  };

  const previewData = { question, answer };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="7xl">
      <div className="bg-white dark:bg-[#14112a] rounded-2xl overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-surface dark:bg-white/8 rounded-xl">
                <BookOpenIcon className="h-6 w-6 text-brand-primary dark:text-brand-accent/70" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-0.5">
                  Edit card
                </p>
                <h3 className="font-heading text-2xl text-gray-900 dark:text-white leading-tight">
                  Edit Flashcard
                </h3>
                {isChanged && (
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-500/20">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                      Unsaved changes
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="cursor-pointer p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/8 transition-colors duration-150"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-white/40" />
            </button>
          </div>

          {/* Error Message */}
          <div ref={errorRef}>
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">
                    {error.data?.error || "Something went wrong. Please try again."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Question Section */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-1.5 bg-brand-surface dark:bg-white/8 rounded-lg">
                  <QuestionMarkCircleIcon className="h-4 w-4 text-brand-primary dark:text-brand-accent/70" />
                </div>
                <div>
                  <label
                    onClick={() => questionEditorRef.current?.focus()}
                    className="text-sm font-semibold text-gray-800 dark:text-white/80 cursor-pointer"
                  >
                    Front Side
                  </label>
                  <span className="text-xs text-gray-400 dark:text-white/30 ml-1.5">question</span>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                <RichTextEditor
                  ref={questionEditorRef}
                  initialContent={question}
                  onChange={(newContent) => {
                    setQuestion(newContent);
                    setIsFlipped(false);
                  }}
                  editable={!isLoading}
                  className="mt-0!"
                />
              </div>
            </div>

            {/* Answer Section */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-1.5 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                  <LightBulbIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <label
                    onClick={() => answerEditorRef.current?.focus()}
                    className="text-sm font-semibold text-gray-800 dark:text-white/80 cursor-pointer"
                  >
                    Back Side
                  </label>
                  <span className="text-xs text-gray-400 dark:text-white/30 ml-1.5">answer</span>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                <RichTextEditor
                  ref={answerEditorRef}
                  initialContent={answer}
                  onChange={(newContent) => {
                    setAnswer(newContent);
                    setIsFlipped(true);
                  }}
                  editable={!isLoading}
                  className="mt-0!"
                />
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="mt-8">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-1.5 bg-brand-surface dark:bg-white/8 rounded-lg">
                <EyeIcon className="h-4 w-4 text-brand-primary dark:text-brand-accent/70" />
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-800 dark:text-white/80">Live Preview</span>
                <span className="text-xs text-gray-400 dark:text-white/30 ml-1.5">click to flip</span>
              </div>
            </div>

            <Flashcard
              currentFlashcard={previewData}
              isFlipped={isFlipped}
              setIsFlipped={setIsFlipped}
            />
            <div className="mt-4">
              <FlashcardTips />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-4 flex-wrap items-center justify-between mt-8 pt-6 border-t border-gray-100 dark:border-white/6">
            <div className="text-sm text-gray-500 dark:text-white/40">
              {question && answer && user ? (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircleIcon className="h-4 w-4" />
                  Ready to update
                </span>
              ) : !user ? (
                "Log in to update"
              ) : (
                "Fill in both sides to continue"
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="cursor-pointer px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-white/60 bg-white dark:bg-transparent border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-150 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !question || !answer || !user || !isChanged}
                className="cursor-pointer flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white dark:text-brand-dark bg-brand-primary hover:bg-indigo-700 dark:bg-brand-accent dark:hover:bg-amber-400 rounded-xl transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <BookOpenIcon className="h-4 w-4" />
                    Update Flashcard
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default EditFlashcardModal;
