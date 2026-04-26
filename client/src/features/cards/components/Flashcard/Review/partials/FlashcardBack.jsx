import React from "react";
import { LightBulbIcon } from "@heroicons/react/24/solid";
import HtmlRenderer from "../../../../../../components/ui/HtmlRenderer";

const FlashcardBack = ({
  isReviewCard,
  currentIndex,
  totalCards,
  isAnswerEmpty,
  answerContent,
  viewOnly,
  showFeedbackIndicator,
  isFlipped,
}) => {
  return (
    <div
      className="absolute w-full h-full bg-brand-accent rounded-3xl shadow-xl border-2 border-brand-accent/30 flex flex-col"
      style={{
        backfaceVisibility: "hidden",
        transform: "rotateY(180deg)",
        pointerEvents: isFlipped ? "auto" : "none",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-brand-dark/15 rounded-xl">
            <LightBulbIcon className="h-4 w-4 sm:h-5 sm:w-5 text-brand-dark" />
          </div>
          <span className="text-brand-dark/80 text-sm font-medium">Answer</span>
        </div>

        {isReviewCard ? (
          <div className="text-brand-dark/70 text-xs font-semibold bg-brand-dark/10 px-2.5 py-1 rounded-full">
            Review
          </div>
        ) : (
          typeof currentIndex !== "undefined" && (
            <div className="text-brand-dark/70 text-xs font-semibold bg-brand-dark/10 px-2.5 py-1 rounded-full shrink-0">
              {currentIndex + 1} / {totalCards}
            </div>
          )
        )}
      </div>

      {/* Content */}
      <div className="flex-1 max-h-96 flex items-center justify-center px-4 text-brand-dark">
        {isAnswerEmpty ? (
          <div className="text-center text-brand-dark/50 italic">
            <p className="text-lg font-semibold">Back Side Preview</p>
            <p className="text-sm">Content will appear here as you type.</p>
          </div>
        ) : (
          <HtmlRenderer
            className="max-w-full !text-sm sm:!text-base leading-relaxed"
            htmlContent={answerContent}
          />
        )}
      </div>

      {/* Footer */}
      {!viewOnly && (
        <div className="shrink-0 mt-auto pt-2 pb-4 text-center">
          <div className="inline-block text-brand-dark/70 text-xs sm:text-sm bg-brand-dark/10 px-4 py-1.5 rounded-full border border-brand-dark/15">
            Click to see question
          </div>
          {showFeedbackIndicator && (
            <div className="mt-3">
              <div className="flex items-center justify-center gap-1 text-brand-dark/60 text-xs">
                <span>↓</span>
                <span>Rate your knowledge below</span>
                <span>↓</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FlashcardBack;
