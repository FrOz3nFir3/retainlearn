import React, { useState, useMemo } from "react";
import {
  useGetDetailedReportQuery,
  useGetIndividualCardQuery,
} from "../../../api/apiSlice";
import { XMarkIcon, ChartBarIcon } from "@heroicons/react/24/solid";
import Modal from "../../../components/ui/Modal";
import DetailedReportModalSkeleton from "../../../components/ui/skeletons/DetailedReportModalSkeleton";
import ReportHeader from "./DetailedReport/ReportHeader";
import ReportNavigation from "./DetailedReport/ReportNavigation";
import ReportStats from "./DetailedReport/ReportStats";
import ReportContent from "./DetailedReport/ReportContent";

function DetailedReportModal({ cardId, isOpen, onClose }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState("");

  // Fetch report data (attempts + basic card info)
  const {
    data: reportData,
    isLoading: isLoadingReport,
    isError: isErrorReport,
  } = useGetDetailedReportQuery(cardId, { skip: !isOpen });

  // Fetch quiz data separately (for proper cache invalidation)
  const {
    data: quizData,
    isLoading: isLoadingQuiz,
    isError: isErrorQuiz,
  } = useGetIndividualCardQuery(
    { id: cardId, view: "quiz" },
    { skip: !isOpen }
  );

  const cardData = reportData?.cardData;
  const isLoading = isLoadingReport || isLoadingQuiz;
  const isError = isErrorReport || isErrorQuiz;

  const mergedReport = useMemo(() => {
    if (!quizData?.quizzes) return [];

    // Create a map of attempts by quizId for quick lookup
    const attemptsMap = new Map();
    if (reportData?.attempts) {
      reportData.attempts.forEach((attempt) => {
        attemptsMap.set(attempt.quizId, attempt);
      });
    }

    // Map ALL quizzes, with attempts data if available, otherwise defaults
    return quizData.quizzes.map((quiz) => {
      const attempt = attemptsMap.get(quiz._id);

      if (attempt) {
        // Quiz has been attempted - use actual data
        return {
          ...attempt,
          question: quiz.quizQuestion,
          answer: quiz.quizAnswer,
          options: [...quiz.options, { value: quiz.quizAnswer }] || [],
        };
      } else {
        // Quiz not attempted - use default values
        return {
          quizId: quiz._id,
          question: quiz.quizQuestion,
          answer: quiz.quizAnswer,
          options: [...quiz.options, { value: quiz.quizAnswer }] || [],
          // Default stats
          totalAttempts: 0,
          timesCorrect: 0,
          answerAttempts: 0,
          correctAttempts: 0,
          incorrectAttempts: 0,
          accuracy: 0,
          lastAttemptedAt: null,
          userAnswers: [],
        };
      }
    });
  }, [reportData, quizData]);

  const currentQuestion = mergedReport[currentQuestionIndex];

  const shuffledOptions = useMemo(() => {
    if (!currentQuestion) return [];
    const options = [
      currentQuestion.answer,
      ...currentQuestion.options
        .map((opt) => opt.value)
        .filter((opt) => opt !== currentQuestion.answer),
    ];
    return options.sort(() => Math.random() - 0.5);
  }, [currentQuestion]);

  const handleNext = () => {
    if (currentQuestionIndex < mergedReport.length - 1) {
      setSlideDirection("left");
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => {
          if (prev >= mergedReport.length - 1) return prev;
          return prev + 1;
        });
        setSlideDirection("in-right");
      }, 150);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setSlideDirection("right");
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => {
          if (prev <= 0) return prev;
          return prev - 1;
        });
        setSlideDirection("in-left");
      }, 150);
    }
  };

  const handleQuestionSelect = (index) => {
    if (index === currentQuestionIndex) return;

    setSlideDirection(index > currentQuestionIndex ? "left" : "right");
    setTimeout(() => {
      setCurrentQuestionIndex(index);
      setSlideDirection(index > currentQuestionIndex ? "in-right" : "in-left");
    }, 150);
  };

  const getSlideClass = () => {
    switch (slideDirection) {
      case "left":
        return "transform -translate-x-full transition-transform duration-300 ease-in-out";
      case "right":
        return "transform translate-x-full transition-transform duration-300 ease-in-out";
      case "in-right":
        return "transform translate-x-0 transition-transform duration-300 ease-in-out";
      case "in-left":
        return "transform translate-x-0 transition-transform duration-300 ease-in-out";
      default:
        return "";
    }
  };

  return (
    <Modal
      className="w-full! sm:max-w-7xl! bg-gray-50 dark:bg-[#14112a] max-w-7xl px-0!"
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="relative">
        {isLoading ? (
          <div className="p-3 sm:p-6">
            <DetailedReportModalSkeleton />
          </div>
        ) : (
          <>
            <ReportHeader cardData={cardData} onClose={onClose} />
            <div className="relative z-10 flex flex-col">
              {isError && (
                <div className="flex items-center justify-center py-8 sm:py-16 px-3 sm:px-6">
                  <div className="text-center">
                    <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-500/10 rounded-2xl inline-block mb-4">
                      <XMarkIcon className="h-8 w-8 sm:h-12 sm:w-12 text-red-600 dark:text-red-400" />
                    </div>
                    <p className="text-lg sm:text-xl font-semibold text-red-600 dark:text-red-400">
                      Error fetching report data
                    </p>
                  </div>
                </div>
              )}

              {!isError && mergedReport.length === 0 && (
                <div className="flex items-center justify-center py-8 sm:py-16 px-3 sm:px-6">
                  <div className="text-center">
                    <div className="p-3 sm:p-4 bg-brand-surface dark:bg-white/8 rounded-2xl inline-block mb-4 sm:mb-6">
                      <ChartBarIcon className="h-8 w-8 sm:h-12 sm:w-12 text-brand-primary dark:text-brand-accent/70" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-heading text-gray-900 dark:text-white mb-2">
                      No Report Data Available
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                      Complete some quizzes to see detailed performance
                      analytics
                    </p>
                  </div>
                </div>
              )}

              {!isError && mergedReport.length > 0 && (
                <>
                  <ReportNavigation
                    onPrev={handlePrev}
                    onNext={handleNext}
                    onQuestionSelect={handleQuestionSelect}
                    currentIndex={currentQuestionIndex}
                    totalQuestions={mergedReport.length}
                    report={mergedReport}
                  />
                  <ReportStats currentQuestion={currentQuestion} />
                  <ReportContent
                    currentQuestion={currentQuestion}
                    shuffledOptions={shuffledOptions}
                    slideClassName={getSlideClass()}
                    currentIndex={currentQuestionIndex}
                  />
                </>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export default DetailedReportModal;
