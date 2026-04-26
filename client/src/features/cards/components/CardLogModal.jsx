import React, { useEffect } from "react";
import LogItem from "./LogItem";
import CardLogSkeleton from "../../../components/ui/skeletons/CardLogSkeleton";
import {
  ClockIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import useCardLogs from "../../../hooks/useCardLogs";

const CardLogModal = ({ isOpen, onClose, cardId }) => {
  const {
    logs,
    isFetching,
    isError,
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    lastLogElementRef,
  } = useCardLogs(cardId, isOpen);
  const logContentRef = React.useRef(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!logContentRef.current) return;
    logContentRef.current.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchQuery("");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex justify-end z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#14112a] w-full max-w-lg h-full shadow-2xl border-l border-gray-200 dark:border-white/8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-100 dark:border-white/6">
          <div className="flex justify-between items-center p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-surface dark:bg-white/8 rounded-xl">
                <ClockIcon className="h-5 w-5 text-brand-primary dark:text-brand-accent/70" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-0.5">
                  History
                </p>
                <h2 className="font-heading text-lg text-gray-900 dark:text-white">
                  Activity Timeline
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/8 transition-colors duration-150"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-white/40" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-5 pb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 dark:text-white/30" />
              </div>
              <input
                type="text"
                placeholder="Search activity logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-accent/20 transition-all duration-150"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="cursor-pointer absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-white/60"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          ref={logContentRef}
          className="p-4 space-y-3 overflow-y-auto h-[calc(100%-180px)]"
        >
          {searchQuery && isFetching ? (
            <CardLogSkeleton />
          ) : (
            <>
              {logs.length > 0 &&
                logs.map((log, index) => {
                  if (logs.length === index + 1) {
                    return (
                      <div ref={lastLogElementRef} key={index}>
                        <LogItem log={log} />
                      </div>
                    );
                  }
                  return (
                    <div key={index}>
                      <LogItem log={log} />
                    </div>
                  );
                })}
            </>
          )}

          {isFetching && (
            <>
              <CardLogSkeleton />
              <CardLogSkeleton />
              <CardLogSkeleton />
              <CardLogSkeleton />
            </>
          )}

          {isError && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-2xl mb-3">
                <XMarkIcon className="h-6 w-6 text-red-500 dark:text-red-400" />
              </div>
              <p className="text-sm font-medium text-red-500 dark:text-red-400">
                Failed to load logs
              </p>
            </div>
          )}

          {!isFetching && !isError && logs.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-surface dark:bg-white/8 rounded-2xl mb-3">
                {debouncedSearchQuery ? (
                  <MagnifyingGlassIcon className="h-5 w-5 text-brand-primary dark:text-brand-accent/70" />
                ) : (
                  <DocumentTextIcon className="h-5 w-5 text-brand-primary dark:text-brand-accent/70" />
                )}
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-white/70 mb-1">
                {debouncedSearchQuery ? "No Matching Logs" : "No Activity Logs"}
              </p>
              <p className="text-xs text-gray-400 dark:text-white/30 max-w-xs mx-auto">
                {debouncedSearchQuery
                  ? `No logs match "${debouncedSearchQuery}".`
                  : "This card hasn't been modified yet."}
              </p>
              {debouncedSearchQuery && (
                <button
                  onClick={clearSearch}
                  className="cursor-pointer mt-3 px-4 py-2 text-sm font-medium text-white dark:text-brand-dark bg-brand-primary hover:bg-indigo-700 dark:bg-brand-accent dark:hover:bg-amber-400 rounded-xl transition-colors duration-150"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardLogModal;
