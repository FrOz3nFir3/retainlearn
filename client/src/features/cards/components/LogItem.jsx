import React, { useState, lazy, Suspense } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import CardLogSkeleton from "../../../components/ui/skeletons/CardLogSkeleton";
import { Link } from "react-router-dom";

const LogItemChange = lazy(() => import("./LogItemChange"));

const LogItem = ({ log }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { summary, user, timestamp, changes } = log;

  const hasChanges = changes && changes.length > 0;
  const date = new Date(timestamp);

  return (
    <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/8 hover:border-gray-300 dark:hover:border-white/12 transition-colors duration-150">
      <div
        className={`flex items-start gap-3 p-4 ${hasChanges ? "cursor-pointer" : ""}`}
        onClick={() => hasChanges && setIsOpen(!isOpen)}
      >
        {/* Timeline dot */}
        <div className="shrink-0 w-2.5 h-2.5 bg-brand-accent rounded-full mt-2" />

        <div className="flex-grow min-w-0">
          <p className="font-medium text-sm text-gray-800 dark:text-white/80 mb-2 wrap-break-word line-clamp-3">
            {summary}
          </p>

          {/* User Information */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-xs text-gray-500 dark:text-white/40">
              {user?.username ? (
                <Link
                  to={`/profile/${user.username}`}
                  className="text-brand-primary dark:text-brand-accent hover:underline"
                >
                  @{user.username}
                </Link>
              ) : (
                "Deleted Account"
              )}
            </span>
          </div>

          {/* Date and Time */}
          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-white/30">
            <span>{date.toLocaleDateString()}</span>
            <span>
              {date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        {hasChanges && (
          <ChevronDownIcon
            className={`h-4 w-4 text-gray-400 dark:text-white/30 shrink-0 mt-1 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        )}
      </div>

      {isOpen && hasChanges && (
        <div className="border-t border-gray-100 dark:border-white/6 p-4 bg-gray-50 dark:bg-white/3">
          <h4 className="font-semibold text-xs text-gray-500 dark:text-white/40 mb-3 uppercase tracking-wider">
            Change Details
          </h4>

          <Suspense fallback={<CardLogSkeleton />}>
            <ul className="space-y-2">
              {changes.map((change, index) => (
                <LogItemChange key={index} change={change} />
              ))}
            </ul>
          </Suspense>
        </div>
      )}
    </div>
  );
};

export default LogItem;
