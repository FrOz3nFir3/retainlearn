import React, { useState, useRef, useMemo, useEffect } from "react";
import Modal from "../../../../components/ui/Modal";
import {
  useGetIndividualCardQuery,
  usePatchUpdateCardMutation,
} from "../../../../api/apiSlice";
import RichTextEditor from "../../../../components/ui/RichTextEditor";
import {
  ArrowPathIcon,
  PlusIcon,
  TrashIcon,
  HashtagIcon,
  FunnelIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import {
  AcademicCapIcon,
  QuestionMarkCircleIcon,
  LightBulbIcon,
  ListBulletIcon,
} from "@heroicons/react/24/solid";
import SearchableDropdown from "../../components/ui/SearchableDropdown";
import HtmlRenderer from "../../../../components/ui/HtmlRenderer";
import QuizTips from "./QuizTips";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../authentication/state/authSlice";
import toast from "react-hot-toast";

let tempIdCounter = 0;

const AddQuizModal = ({ cardId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizAnswer, setQuizAnswer] = useState("");
  const [selectedFlashcardId, setSelectedFlashcardId] = useState(null);
  const [options, setOptions] = useState([]);
  const [minimumOptions, setMinimumOptions] = useState(2);
  const [shouldFetchFlashcards, setShouldFetchFlashcards] = useState(false);
  const user = useSelector(selectCurrentUser);

  const { data: reviewTextData, isLoading: isLoadingFlashcards } =
    useGetIndividualCardQuery(
      {
        id: cardId,
        view: "review_text",
      },
      { skip: !shouldFetchFlashcards }
    );
  const [updateCard, { error, isLoading }] = usePatchUpdateCardMutation();
  const questionEditorRef = useRef(null);
  const answerEditorRef = useRef(null);
  const errorRef = useRef(null);

  const flashcardOptions = useMemo(
    () =>
      reviewTextData?.review?.map((flashcard, index) => {
        const plainText = flashcard.question;
        return {
          value: flashcard._id,
          label: `Flashcard ${index + 1}`,
          description: plainText,
        };
      }),
    [reviewTextData?.review]
  );

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error]);

  const handleOptionChange = (value, tempId) => {
    setOptions(
      options.map((opt) => (opt.tempId === tempId ? { ...opt, value } : opt))
    );
  };

  const handleAddOption = () => {
    const newOptions = [
      ...options,
      { value: "", tempId: `temp_${tempIdCounter++}` },
    ];
    setOptions(newOptions);
    setMinimumOptions(() => {
      let newLength = newOptions.length + 1;
      if (newLength > 2) {
        return newLength;
      } else {
        return 2;
      }
    });
  };

  const handleRemoveOption = (tempId) => {
    const newOptions = options.filter((opt) => opt.tempId !== tempId);
    setOptions(newOptions);
    setMinimumOptions(() => {
      let newLength = newOptions.length + 1;
      if (newLength > 2) {
        return newLength;
      } else {
        return 2;
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updateDetails = {
      _id: cardId,
      cardId: selectedFlashcardId,
      quizQuestion,
      quizAnswer,
      options: options.map((opt) => opt.value).filter((val) => val.trim()),
      minimumOptions,
    };
    updateCard(updateDetails).then((response) => {
      if (response.data) {
        toast.success(response.data.message);
        setIsOpen(false);
        setQuizQuestion("");
        setQuizAnswer("");
        setSelectedFlashcardId(null);
        setOptions([]);
        setMinimumOptions(2);
      }
    });
  };

  const onClose = () => {
    setIsOpen(false);
    setQuizQuestion("");
    setQuizAnswer("");
    setSelectedFlashcardId(null);
    setOptions([]);
    setMinimumOptions(2);
  };

  const isInputEmpty = !quizQuestion || !quizAnswer;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group shrink-0 cursor-pointer inline-flex items-center gap-2.5 rounded-xl bg-brand-primary hover:bg-indigo-700 dark:bg-brand-accent dark:hover:bg-amber-400 px-5 py-2.5 text-sm font-semibold text-white dark:text-brand-dark transition-colors duration-150"
      >
        <PlusIcon className="h-4 w-4" />
        Create Quiz
      </button>

      <Modal isOpen={isOpen} onClose={onClose} maxWidth="7xl">
        <div className="bg-white dark:bg-[#14112a] rounded-2xl overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-surface dark:bg-white/8 rounded-xl">
                  <AcademicCapIcon className="h-6 w-6 text-brand-primary dark:text-brand-accent/70" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-0.5">
                    New quiz
                  </p>
                  <h3 className="font-heading text-2xl text-gray-900 dark:text-white leading-tight">
                    Create Quiz
                  </h3>
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

            {/* Error Message */}
            <div ref={errorRef}>
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">
                      {error.data?.error || "An error occurred. Please try again."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Core Content */}
            <div className="space-y-6">
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
                        Quiz Question
                      </label>
                      <p className="text-xs text-gray-400 dark:text-white/30">
                        Make it clear and specific
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                    <RichTextEditor
                      ref={questionEditorRef}
                      initialContent={quizQuestion}
                      onChange={setQuizQuestion}
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
                        Correct Answer
                      </label>
                      <p className="text-xs text-gray-400 dark:text-white/30">
                        The right answer to your question
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                    <RichTextEditor
                      ref={answerEditorRef}
                      initialContent={quizAnswer}
                      onChange={setQuizAnswer}
                      editable={!isLoading}
                      className="mt-0!"
                    />
                  </div>
                </div>
              </div>

              {/* Settings Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Flashcard Association */}
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="p-1.5 bg-brand-surface dark:bg-white/8 rounded-lg">
                      <FunnelIcon className="h-4 w-4 text-brand-primary dark:text-brand-accent/70" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-800 dark:text-white/80">
                        Link to Flashcard
                      </label>
                      <p className="text-xs text-gray-400 dark:text-white/30">
                        Optional — connect to a specific flashcard
                      </p>
                    </div>
                  </div>
                  <SearchableDropdown
                    options={flashcardOptions}
                    value={selectedFlashcardId}
                    onChange={setSelectedFlashcardId}
                    placeholder="Search for a flashcard..."
                    isLoading={isLoadingFlashcards}
                    onOpen={() => setShouldFetchFlashcards(true)}
                  />
                </div>

                {/* Minimum Options */}
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="p-1.5 bg-brand-surface dark:bg-white/8 rounded-lg">
                      <HashtagIcon className="h-4 w-4 text-brand-primary dark:text-brand-accent/70" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-800 dark:text-white/80">
                        Min. Options
                      </label>
                      <p className="text-xs text-gray-400 dark:text-white/30">
                        Required answer choices
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/3">
                    <input
                      type="number"
                      id="minimumOptions"
                      value={minimumOptions}
                      onChange={(e) =>
                        setMinimumOptions(Number(e.target.value))
                      }
                      className="w-full px-4 py-2.5 text-sm border-0 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-0"
                      min={2}
                      max={10}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Options Section */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-brand-surface dark:bg-white/8 rounded-lg">
                  <ListBulletIcon className="h-4 w-4 text-brand-primary dark:text-brand-accent/70" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-800 dark:text-white/80">
                    Answer Options
                  </span>
                  <span className="text-xs text-gray-400 dark:text-white/30 ml-1.5">
                    additional wrong choices
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {/* Correct Answer Display */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                      Correct Answer
                    </span>
                    <span className="text-xs text-gray-400 dark:text-white/30">
                      automatically included
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/8 border border-emerald-200 dark:border-emerald-500/20">
                    <div className="text-sm text-emerald-800 dark:text-emerald-300">
                      <HtmlRenderer htmlContent={quizAnswer} />
                    </div>
                  </div>
                </div>

                {/* Additional Options */}
                {options.map((option, index) => (
                  <div key={option.tempId} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500 dark:text-white/40">
                        Option {index + 2}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(option.tempId)}
                        disabled={isLoading}
                        className="cursor-pointer p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/15 border border-red-200 dark:border-red-500/20 disabled:opacity-50 transition-colors duration-150"
                      >
                        <TrashIcon className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                      </button>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                      <RichTextEditor
                        initialContent={option.value}
                        onChange={(value) =>
                          handleOptionChange(value, option.tempId)
                        }
                        editable={!isLoading}
                      />
                    </div>
                  </div>
                ))}

                {/* Add Option Button */}
                <button
                  type="button"
                  onClick={handleAddOption}
                  disabled={isLoading || !user}
                  className="cursor-pointer disabled:cursor-not-allowed w-full flex items-center justify-center gap-2.5 p-3.5 rounded-xl border border-dashed border-gray-300 dark:border-white/15 hover:border-brand-primary/40 dark:hover:border-brand-accent/30 hover:bg-gray-50 dark:hover:bg-white/3 text-gray-500 dark:text-white/40 hover:text-brand-primary dark:hover:text-brand-accent transition-all duration-150 disabled:opacity-40 text-sm font-medium"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Another Option
                </button>
              </div>
            </div>

            {/* Quiz Tips */}
            <QuizTips />

            {/* Footer Actions */}
            <div className="flex flex-wrap gap-4 items-center justify-between mt-8 pt-6 border-t border-gray-100 dark:border-white/6">
              <div className="text-sm text-gray-500 dark:text-white/40">
                {quizQuestion && quizAnswer && user ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircleIcon className="h-4 w-4" />
                    Ready to create quiz
                  </span>
                ) : !user ? (
                  "Log in to create"
                ) : (
                  "Fill in question and answer to continue"
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="cursor-pointer px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-white/60 bg-white dark:bg-transparent border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-150 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInputEmpty || isLoading || !user}
                  className="cursor-pointer flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white dark:text-brand-dark bg-brand-primary hover:bg-indigo-700 dark:bg-brand-accent dark:hover:bg-amber-400 rounded-xl transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-4 w-4" />
                      Create Quiz
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
};

export default AddQuizModal;
