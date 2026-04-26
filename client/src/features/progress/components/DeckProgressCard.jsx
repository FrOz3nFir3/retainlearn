import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PlayIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  FireIcon,
} from "@heroicons/react/24/outline";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import ProgressBar from "../../../components/ui/ProgressBar";
import StatBadge from "../../../components/ui/StatBadge";
import DeleteConfirmationModal from "../../../components/ui/DeleteConfirmationModal";
import { usePatchUpdateUserQuizProgressMutation } from "../../../api/apiSlice";
import { PlayCircleIcon, ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";

const DeckProgressCard = ({ card, onViewReport }) => {
  const navigate = useNavigate();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [patchUpdateUserQuizProgress, { isLoading: isResetting }] =
    usePatchUpdateUserQuizProgressMutation();

  const progress = {
    card_id: card._id,
    "times-started": card.timesStarted,
    "times-finished": card.timesFinished,
    "total-correct": card.totalCorrect,
    "total-incorrect": card.totalIncorrect,
  };

  const cardDetails = {
    _id: card._id,
    "main-topic": card["main-topic"],
    "sub-topic": card["sub-topic"],
    category: card.category,
  };

  const strugglingQuizCount = card.strugglingQuizCount ?? 0;

  if (!cardDetails) return null;

  const correct = progress["total-correct"] || 0;
  const incorrect = progress["total-incorrect"] || 0;
  const total = correct + incorrect;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const timesStarted = progress["times-started"] || 0;
  const timesFinished = progress["times-finished"] || 0;
  const completion = timesStarted > 0 ? Math.round((timesFinished / timesStarted) * 100) : 0;

  const notStarted = timesStarted === 0;

  const getPerformanceBadge = () => {
    if (notStarted) return null;
    if (accuracy >= 90) return { label: "Excellent", classes: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20" };
    if (accuracy >= 75) return { label: "Good", classes: "bg-brand-surface dark:bg-brand-primary/10 text-brand-primary dark:text-brand-accent border-brand-primary/20 dark:border-brand-accent/20" };
    if (accuracy >= 60) return { label: "Fair", classes: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20" };
    return { label: "Needs work", classes: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20" };
  };

  const badge = getPerformanceBadge();

  return (
    <div className="group relative bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:border-gray-300 dark:hover:border-white/15 hover:shadow-sm">
      {/* Amber bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left z-10" />

      {/* Body */}
      <div className="p-6 grow">
        {/* Category + badge row */}
        <div className="flex items-start justify-between mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent">
            {cardDetails.category}
          </p>
          {badge && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${badge.classes}`}>
              {badge.label}
            </span>
          )}
        </div>

        {/* Topics */}
        <div className="mb-5">
          <h3 className="font-heading text-lg text-gray-900 dark:text-white leading-snug line-clamp-2 mb-1 group-hover:text-brand-primary dark:group-hover:text-brand-accent transition-colors duration-200">
            {cardDetails["main-topic"]}
          </h3>
          {cardDetails["sub-topic"] && (
            <p className="text-sm text-gray-500 dark:text-white/45 line-clamp-2 leading-relaxed">
              {cardDetails["sub-topic"]}
            </p>
          )}
        </div>

        {/* Progress bars */}
        <ProgressBar label="Accuracy" value={accuracy} color="bg-brand-accent" />
        <ProgressBar label="Completion" value={completion} color="bg-brand-primary" />

        {/* Stat badges */}
        <div className="mt-5 grid grid-cols-4 gap-2">
          <StatBadge label="Started" value={timesStarted} icon={PlayCircleIcon} />
          <StatBadge label="Finished" value={timesFinished} icon={ClipboardDocumentCheckIcon} />
          <StatBadge label="Correct" value={correct} icon={CheckCircleIcon} />
          <StatBadge label="Wrong" value={incorrect} icon={XCircleIcon} />
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-6 py-4 border-t border-gray-100 dark:border-white/6 space-y-2">
        <Link
          to={`/card/${progress.card_id}/quiz`}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-primary hover:bg-indigo-700 dark:bg-brand-accent dark:hover:bg-amber-400 dark:text-brand-dark text-white font-semibold text-sm rounded-xl transition-colors duration-150"
        >
          <PlayIcon className="w-4 h-4" />
          {notStarted ? "Start quiz" : "Reattempt quiz"}
          <ArrowRightIcon className="w-4 h-4" />
        </Link>

        {strugglingQuizCount > 0 && (
          <button
            onClick={(e) => { e.preventDefault(); navigate(`/card/${progress.card_id}/focus-quiz`); }}
            className="cursor-pointer w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 font-semibold text-sm rounded-xl transition-colors duration-150"
          >
            <FireIcon className="h-4 w-4" />
            Focus quiz
            <span className="ml-auto bg-amber-200 dark:bg-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold px-2 py-0.5 rounded-full">
              {strugglingQuizCount}
            </span>
          </button>
        )}

        <div className="flex gap-2">
          <button
            disabled={notStarted}
            onClick={() => onViewReport(progress)}
            className="cursor-pointer flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-white/50 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150"
          >
            <ChartBarIcon className="w-3.5 h-3.5" />
            Report
          </button>
          <button
            disabled={notStarted || isResetting}
            onClick={() => setIsResetModalOpen(true)}
            className="cursor-pointer flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" />
            {isResetting ? "Resetting…" : "Reset"}
          </button>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={async () => {
          await patchUpdateUserQuizProgress({ card_id: progress.card_id, resetProgress: true });
        }}
        title="Reset quiz progress"
        description="This will permanently erase all your quiz stats for this deck. Are you sure?"
      />
    </div>
  );
};

export default DeckProgressCard;
