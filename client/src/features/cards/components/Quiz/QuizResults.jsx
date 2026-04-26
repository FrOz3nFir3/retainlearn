import React, { useState, lazy } from "react";
import {
  ArrowPathIcon,
  ChartBarIcon,
  TrophyIcon,
  FireIcon,
} from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectCurrentUser } from "../../../authentication/state/authSlice";

const DetailedReportModal = lazy(() =>
  import("../../../progress/components/DetailedReportModal")
);

const StatCard = ({ label, value, colorClass }) => (
  <div className="bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl p-5 text-center">
    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-2">
      {label}
    </p>
    <p className={`font-heading text-3xl font-bold ${colorClass}`}>{value}</p>
  </div>
);

const QuizResults = ({ score, totalQuestions, onRestart, cardId }) => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
  const incorrect = totalQuestions - score;
  const hasStrugglingQuestions = incorrect > 0;

  const handleFocusQuiz = () => {
    navigate(`/card/${cardId}/focus-quiz`);
  };

  const getPerformanceMessage = () => {
    if (percentage === 100) return "Flawless!";
    if (percentage >= 80) return "Excellent work!";
    if (percentage >= 60) return "Good job!";
    if (percentage >= 40) return "Keep practising.";
    return "Keep going.";
  };

  return (
    <div className="bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl p-8 sm:p-12 text-center">
      {/* Trophy */}
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-brand-surface dark:bg-white/8 rounded-2xl">
          <TrophyIcon className="h-10 w-10 text-brand-accent" />
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-2">
          Quiz complete
        </p>
        <h2 className="font-heading text-3xl sm:text-4xl text-gray-900 dark:text-white mb-2">
          {getPerformanceMessage()}
        </h2>
        <p className="text-sm text-gray-500 dark:text-white/40">
          You've completed the quiz successfully.
        </p>
      </div>

      {/* Score Circle */}
      <div className="mb-10 flex justify-center">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              className="text-gray-100 dark:text-white/8"
              strokeWidth="7"
              stroke="currentColor"
              fill="transparent"
              r="42"
              cx="50"
              cy="50"
            />
            <circle
              className="text-brand-primary"
              strokeWidth="7"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - percentage / 100)}`}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="42"
              cx="50"
              cy="50"
              style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-heading text-4xl font-bold text-brand-primary dark:text-brand-accent">
              {Math.round(percentage)}%
            </span>
            <span className="text-xs text-gray-400 dark:text-white/30 font-medium">
              Final Score
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard label="Total" value={totalQuestions} colorClass="text-gray-900 dark:text-white" />
        <StatCard label="Correct" value={score} colorClass="text-emerald-500" />
        <StatCard label="Incorrect" value={incorrect} colorClass="text-red-500" />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <button
          onClick={onRestart}
          className="cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary hover:bg-indigo-700 dark:bg-brand-accent dark:hover:bg-amber-400 text-white dark:text-brand-dark text-sm font-semibold rounded-xl transition-colors duration-150"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Take Quiz Again
        </button>

        {user && hasStrugglingQuestions && (
          <button
            onClick={handleFocusQuiz}
            className="cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm font-semibold rounded-xl hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors duration-150"
          >
            <FireIcon className="h-4 w-4" />
            Focus on Difficult
          </button>
        )}

        {user && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 text-sm font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-white/8 transition-colors duration-150"
          >
            <ChartBarIcon className="h-4 w-4" />
            View Report
          </button>
        )}
      </div>

      {isModalOpen && (
        <DetailedReportModal
          isOpen={isModalOpen}
          cardId={cardId}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default QuizResults;
