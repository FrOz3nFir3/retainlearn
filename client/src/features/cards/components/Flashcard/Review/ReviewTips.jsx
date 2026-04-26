import React from "react";
import { BookOpenIcon } from "@heroicons/react/24/outline";

const tips = [
  { label: "Think before flipping", desc: "Try to recall the answer first" },
  { label: "Review regularly", desc: "Spaced repetition improves retention" },
  { label: "Take your time", desc: "Quality over speed for better learning" },
  { label: "Focus on weak areas", desc: "Spend more time on difficult cards" },
  { label: "Make connections", desc: "Link new info to what you already know" },
  { label: "Track progress", desc: "Monitor your learning journey" },
];

const ReviewTips = ({ className = "" }) => {
  return (
    <div
      className={`bg-gray-50 dark:bg-white/4 border border-gray-100 dark:border-white/6 rounded-2xl p-5 ${className}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-brand-surface dark:bg-white/8 rounded-xl">
          <BookOpenIcon className="h-4 w-4 text-brand-primary dark:text-brand-accent/70" />
        </div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-white/70">
          Review best practices
        </h4>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {tips.map((tip) => (
          <div key={tip.label} className="flex items-start gap-2.5">
            <div className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-brand-accent" />
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-white/70">
                {tip.label}
              </p>
              <p className="text-xs text-gray-400 dark:text-white/30">
                {tip.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewTips;
