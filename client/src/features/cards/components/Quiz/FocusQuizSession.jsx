import React from "react";
import {
  ArrowsRightLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";
import FocusQuizHeader from "./FocusQuizHeader";
import QuizQuestion from "./QuizQuestion";
import QuizOptions from "./QuizOptions";
import RandomFact from "./RandomFact";
import FunFactToggle from "./FunFactToggle";
import FocusQuizCompletion from "./FocusQuizCompletion";
import FocusQuizGallery from "./FocusQuizGallery";

const FocusQuizSession = ({ focusQuizzes, session }) => {
  const {
    currentQuestionIndex,
    currentQuestion,
    selectedAnswer,
    score,
    shuffledOptions,
    sessionQuizzes,
    showCompletion,
    completedQuizzes,
    randomFact,
    factLoading,
    showFacts,
    handleAnswerSelect,
    handleRandomFactToggle,
    handleQuizSelect,
    handleNext,
    handlePrev,
    restartFocusQuiz,
    isFirstQuestion,
    isLastQuestion,
  } = session;

  const progressPercentage =
    sessionQuizzes.length > 0
      ? ((currentQuestionIndex + 1) / sessionQuizzes.length) * 100
      : 0;

  if (showCompletion) {
    return (
      <div className="relative z-10 p-6 sm:p-8">
        <FocusQuizCompletion
          score={score}
          totalQuestions={sessionQuizzes.length}
          completedQuizzesCount={completedQuizzes.size}
          totalFocusQuizzes={focusQuizzes.length}
          restartFocusQuiz={restartFocusQuiz}
        />
      </div>
    );
  }

  return (
    <div className="relative z-10 p-6 sm:p-8">
      <FocusQuizHeader
        current={currentQuestionIndex + 1}
        total={sessionQuizzes.length}
        focusQuizzesCount={focusQuizzes.length}
        score={score}
      />

      {/* Focus Mode Indicator */}
      {currentQuestionIndex === 0 && !selectedAnswer && (
        <div className="mb-6 inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 rounded-xl px-4 py-2.5 border border-amber-200 dark:border-amber-500/20">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <strong>Focus Mode:</strong> Retake quizzes you got wrong previously.
          </p>
        </div>
      )}

      <QuizQuestion
        questionText={currentQuestion.quizQuestion}
        current={currentQuestionIndex + 1}
        isFocusMode={true}
      />

      <QuizOptions
        options={shuffledOptions}
        answer={currentQuestion.quizAnswer}
        selectedAnswer={selectedAnswer}
        onSelect={handleAnswerSelect}
        isFocusMode={true}
      />

      {selectedAnswer && showFacts && (
        <div className="mt-6">
          <RandomFact
            fact={randomFact}
            loading={factLoading}
            shouldAutoScroll={selectedAnswer?.isCorrect}
          />
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/6">
        <FunFactToggle showFacts={showFacts} onToggle={handleRandomFactToggle} />
      </div>

      {/* Navigation and Gallery */}
      {sessionQuizzes.length > 1 && (
        <>
          {/* Progress Bar */}
          <div className="mt-6 mb-6">
            <div className="w-full bg-gray-100 dark:bg-white/8 rounded-full h-1.5">
              <div
                className="bg-brand-accent h-1.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between mt-3">
              <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-400 dark:text-white/30">
                <ArrowsRightLeftIcon className="h-3.5 w-3.5" />
                Arrow keys to navigate
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handlePrev}
                  disabled={isFirstQuestion}
                  className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-3.5 w-3.5" />
                  Prev
                </button>

                <div className="px-2.5 py-1 bg-brand-surface dark:bg-brand-accent/10 text-brand-primary dark:text-brand-accent rounded-md text-xs font-semibold border border-brand-primary/15 dark:border-brand-accent/15">
                  {currentQuestionIndex + 1} / {sessionQuizzes.length}
                </div>

                <button
                  onClick={handleNext}
                  disabled={isLastQuestion}
                  className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          <FocusQuizGallery
            quizzes={focusQuizzes}
            currentQuestion={currentQuestion}
            handleQuizSelect={handleQuizSelect}
            currentQuestionIndex={currentQuestionIndex}
            selectedAnswer={selectedAnswer}
          />
        </>
      )}
    </div>
  );
};

export default FocusQuizSession;
