import React from "react";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/solid";
import HtmlRenderer from "../../../../../../components/ui/HtmlRenderer";

const FlashcardFront = ({
  isReviewCard,
  currentIndex,
  totalCards,
  isQuestionEmpty,
  questionContent,
  viewOnly,
  isFlipped,
}) => {
  return (
    <div
      className={`absolute w-full h-full max-h-134 ${
        isReviewCard
          ? "bg-brand-dark border-2 border-brand-primary/30"
          : "bg-brand-primary border-2 border-brand-primary/30"
      } rounded-3xl shadow-xl text-white flex flex-col`}
      style={{
        backfaceVisibility: "hidden",
        pointerEvents: isFlipped ? "none" : "auto",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="p-2 bg-white/15 rounded-xl shrink-0">
            <QuestionMarkCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <span className="text-white/80 text-sm font-medium truncate">
            {isReviewCard ? `Question ${currentIndex + 1}` : "Question"}
          </span>
        </div>
        {isReviewCard ? (
          <div className="text-white/80 text-xs font-semibold bg-white/15 px-2.5 py-1 rounded-full shrink-0">
            Review
          </div>
        ) : (
          typeof currentIndex !== "undefined" && (
            <div className="text-white/80 text-xs font-semibold bg-white/15 px-2.5 py-1 rounded-full shrink-0">
              {currentIndex + 1} / {totalCards}
            </div>
          )
        )}
      </div>

      {/* Content */}
      <div className="flex-1 max-h-96 flex items-center justify-center px-4">
        {isQuestionEmpty ? (
          <div className="text-center text-white/50 italic">
            <p className="text-lg font-semibold">Front Side Preview</p>
            <p className="text-sm">Content will appear here as you type.</p>
          </div>
        ) : (
          <HtmlRenderer
            className="max-w-full text-sm! sm:text-lg! leading-relaxed"
            htmlContent={questionContent}
          />
        )}
      </div>

      {/* Footer */}
      {!viewOnly && (
        <div className="shrink-0 mt-auto pb-4 text-center">
          <div className="inline-block text-white/70 text-xs sm:text-sm bg-white/10 px-4 py-1.5 rounded-full border border-white/15">
            Click to reveal answer
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardFront;
