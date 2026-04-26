import { useState } from "react";
import CardLogModal from "./CardLogModal";
import LogItem from "./LogItem";
import { ClockIcon } from "@heroicons/react/24/outline";
import { DocumentTextIcon } from "@heroicons/react/24/solid";

const CardLogs = ({ logs, cardId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sortedLogs = logs
    .slice()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const recentLogs = sortedLogs.slice(0, 5);

  return (
    <div className="bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100 dark:border-white/6">
        <div className="w-6 h-6 rounded-md bg-brand-surface dark:bg-white/8 flex items-center justify-center shrink-0">
          <ClockIcon className="h-3.5 w-3.5 text-brand-primary dark:text-brand-accent/80" />
        </div>
        <div>
          <h3 className="font-heading text-lg text-gray-900 dark:text-white leading-none">Activity</h3>
          <p className="text-xs text-gray-400 dark:text-white/30">Recent changes</p>
        </div>
      </div>

      {recentLogs.length > 0 ? (
        <div className="space-y-3">
          {recentLogs.map((log, index) => (
            <div key={log._id} className="relative">
              {index < recentLogs.length - 1 && (
                <div className="absolute left-4 top-9 w-px h-3 bg-gray-200 dark:bg-white/10" />
              )}
              <LogItem log={log} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-white/6 rounded-xl mb-3">
            <DocumentTextIcon className="h-5 w-5 text-gray-400 dark:text-white/30" />
          </div>
          <p className="text-sm text-gray-500 dark:text-white/40 font-medium">No activity yet</p>
          <p className="text-xs text-gray-400 dark:text-white/25 mt-1">Changes will appear here</p>
        </div>
      )}

      {logs.length >= 3 && (
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/6">
          <button
            onClick={() => setIsModalOpen(!isModalOpen)}
            className="cursor-pointer w-full text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30 hover:text-brand-primary dark:hover:text-brand-accent transition-colors duration-150 py-1"
          >
            View all logs
          </button>
        </div>
      )}

      <CardLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cardId={cardId}
      />
    </div>
  );
};

export default CardLogs;
