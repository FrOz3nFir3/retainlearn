import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useParams, useSearchParams } from "react-router-dom";
import { selectCurrentCard } from "../../state/cardSlice";
import { useGetIndividualCardQuery } from "../../../../api/apiSlice";
import EditCardHeader from "./EditCardHeader";
import QuizManagementView from "./QuizManagementView";
import FlashcardManagementView from "./FlashcardManagementView";
import ReviewQueueView from "./ReviewQueueView";
import ViewSwitcher from "./ViewSwitcher";
import { useEditCardManager } from "../../hooks/useEditCardManager";
import EditCardPageSkeleton from "../../../../components/ui/skeletons/EditCardPageSkeleton";

const EditCardView = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const card = useSelector(selectCurrentCard);
  const { _id, review = [], quizzes = [], reviewQueue = [] } = card || {};

  // Get current view to determine which data to fetch
  const currentView = searchParams.get("view") || "flashcards";

  // Always fetch overview data (with skipLogs for edit views)
  const {
    data: overviewData,
    isLoading: isOverviewLoading,
    error: overviewError,
  } = useGetIndividualCardQuery({
    id: params.id,
    view: "overview",
  });

  // Fetch view-specific data based on current view
  const getViewType = () => {
    if (currentView === "flashcards") return "review";
    if (currentView === "quizzes") return "quiz";
    if (currentView === "review-queue") return "review-queue";
    return "review";
  };

  const {
    data: viewData,
    isLoading: isViewLoading,
    error: viewError,
    isFetching: isViewFetching,
  } = useGetIndividualCardQuery({
    id: params.id,
    view: getViewType(),
  });

  // Merge overview and view-specific data
  const mergedCard = useMemo(() => {
    if (!overviewData) return card;

    const merged = { ...overviewData };

    // Merge view-specific data
    if (viewData) {
      if (currentView === "flashcards" && viewData.review) {
        merged.review = viewData.review;
      } else if (currentView === "quizzes" && viewData.quizzes) {
        merged.quizzes = viewData.quizzes;
      } else if (currentView === "review-queue" && viewData.reviewQueue) {
        merged.reviewQueue = viewData.reviewQueue;
      }
    }

    return merged;
  }, [overviewData, viewData, currentView, card]);

  const {
    view,
    setSearchParams,
    searchTerm,
    currentIndex,
    animationDirection,
    filteredFlashcards,
    filteredQuizzes,
    currentItem,
    originalFlashcardIndex,
    handleSearchChange,
    handleReset,
    handlePrev,
    handleNext,
    handleJump,
    handleIndexChange,
  } = useEditCardManager(mergedCard || card);

  const reviewMap = useMemo(() => {
    const map = new Map();
    const reviewArray = mergedCard?.review || review || [];
    reviewArray.forEach((item, index) => {
      map.set(item._id, index);
    });
    return map;
  }, [mergedCard, review]);

  const quizMap = useMemo(() => {
    const map = new Map();
    const quizzesArray = mergedCard?.quizzes || quizzes || [];
    quizzesArray.forEach((item, index) => {
      map.set(item._id, index);
    });
    return map;
  }, [mergedCard, quizzes]);

  // Show loading state
  if (isOverviewLoading || isViewLoading) {
    return <EditCardPageSkeleton />;
  }

  // Show error state
  if (overviewError || viewError) {
    return (
      <div className="bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl p-8 text-center">
        <p className="font-heading text-xl text-gray-900 dark:text-white mb-2">Failed to load card data</p>
        <p className="text-sm text-gray-500 dark:text-white/40">There was an error loading the card data. Please try refreshing the page.</p>
      </div>
    );
  }

  if (!mergedCard && !card) {
    return <EditCardPageSkeleton />;
  }

  const displayCard = mergedCard || card;

  const displayReview = displayCard?.review || review || [];
  const displayQuizzes = displayCard?.quizzes || quizzes || [];
  const displayReviewQueue = displayCard?.reviewQueue || reviewQueue || [];

  return (
    <div className="bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl p-6">
      <EditCardHeader
        flashcardId={displayCard?._id || _id}
        view={view}
        setSearchParams={setSearchParams}
      />
      <ViewSwitcher
        view={view}
        setSearchParams={setSearchParams}
        totalFlashcards={displayCard?.reviewLength ?? displayReview.length}
        totalQuizzes={displayCard?.quizzesLength ?? displayQuizzes.length}
        totalReviewQueue={
          displayCard?.reviewQueueLength ?? displayReviewQueue.length
        }
      />

      {view === "flashcards" ? (
        <FlashcardManagementView
          review={displayReview}
          searchTerm={searchTerm}
          handleSearchChange={handleSearchChange}
          handleReset={handleReset}
          handlePrev={handlePrev}
          handleNext={handleNext}
          handleJump={handleJump}
          currentIndex={currentIndex}
          totalCount={filteredFlashcards.length}
          currentFlashcard={currentItem}
          cardId={displayCard?._id || _id}
          animationDirection={animationDirection}
          originalFlashcardIndex={originalFlashcardIndex}
          filteredFlashcards={filteredFlashcards}
          handleIndexChange={handleIndexChange}
          reviewMap={reviewMap}
        />
      ) : view === "quizzes" ? (
        <QuizManagementView
          quizzes={displayQuizzes}
          cardId={displayCard?._id || _id}
          searchTerm={searchTerm}
          handleSearchChange={handleSearchChange}
          handleReset={handleReset}
          currentIndex={currentIndex}
          handleIndexChange={handleIndexChange}
          initialFilteredQuizzes={filteredQuizzes}
          handleNext={handleNext}
          handlePrev={handlePrev}
          review={displayReview}
          quizMap={quizMap}
        />
      ) : view === "review-queue" ? (
        <ReviewQueueView
          cardId={displayCard?._id || _id}
          reviewQueue={displayReviewQueue}
          reviewQueueLength={displayCard?.reviewQueueLength}
        />
      ) : null}
    </div>
  );
};

export default EditCardView;
