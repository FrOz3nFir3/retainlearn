import React from "react";
import { SparklesIcon } from "@heroicons/react/24/solid";

const SkeletonLoader = () => (
  <div className="animate-pulse space-y-2.5">
    <div className="h-3.5 bg-amber-200 dark:bg-amber-500/20 rounded-full w-3/4"></div>
    <div className="h-3.5 bg-amber-200 dark:bg-amber-500/20 rounded-full w-1/2"></div>
    <div className="h-3.5 bg-amber-200 dark:bg-amber-500/20 rounded-full w-2/3"></div>
  </div>
);

const RandomFact = ({ fact, loading, shouldAutoScroll = false }) => {
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    if (loading || !fact || !shouldAutoScroll) return;
    if (containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [fact, loading, shouldAutoScroll]);

  if (!fact && !loading) return null;

  return (
    <div
      ref={containerRef}
      className="rounded-2xl bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/20 p-5"
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div className="p-1.5 bg-amber-100 dark:bg-amber-500/15 rounded-lg shrink-0">
          <SparklesIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Did you know?
          </h4>
          <p className="text-xs text-amber-600/70 dark:text-amber-400/60">
            Fun fact while you study
          </p>
        </div>
      </div>

      <div className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
        {loading ? <SkeletonLoader /> : fact}
      </div>
    </div>
  );
};

export default RandomFact;
