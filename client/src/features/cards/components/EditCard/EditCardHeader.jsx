import { useState } from "react";
import { NewFlashcardModal } from "./NewFlashCardModal";
import AddQuizModal from "./AddQuizModal";
import PermissionManagementModal from "./PermissionManagementModal";
import { UserGroupIcon } from "@heroicons/react/24/outline";

const VIEW_META = {
  flashcards: { modeLabel: "Create mode", heading: "Edit Flashcards" },
  quizzes:    { modeLabel: "Create mode", heading: "Edit Quizzes" },
  "review-queue": { modeLabel: "Collaboration", heading: "Review Queue" },
};

const EditCardHeader = ({ flashcardId, view }) => {
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const { modeLabel, heading } = VIEW_META[view] ?? VIEW_META.flashcards;

  return (
    <div className="flex gap-3 flex-wrap justify-between items-center mb-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-0.5">
          {modeLabel}
        </p>
        <h2 className="font-heading text-2xl text-gray-900 dark:text-white">
          {heading}
        </h2>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setIsPermissionModalOpen(true)}
          className="cursor-pointer shrink-0 inline-flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-white/70 hover:border-brand-primary/30 dark:hover:border-brand-accent/30 hover:text-brand-primary dark:hover:text-brand-accent transition-colors duration-150"
        >
          <UserGroupIcon className="h-4 w-4" />
          Manage Reviewers
        </button>

        {view === "flashcards" && (
          <NewFlashcardModal flashcardId={flashcardId} />
        )}

        {view === "quizzes" && <AddQuizModal cardId={flashcardId} />}
      </div>

      <PermissionManagementModal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
      />
    </div>
  );
};

export default EditCardHeader;
