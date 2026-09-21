import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div id="loading-skeleton-container" className="space-y-8 animate-pulse">
      {/* Current Weather Card Skeleton */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 h-64 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="w-48 sm:w-64 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="w-36 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            <div className="w-24 h-14 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>
        </div>
        <div className="w-full h-4 bg-slate-100 dark:bg-slate-800/60 rounded-md mt-6" />
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="w-28 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>
            <div className="w-20 h-7 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="w-36 h-3 bg-slate-100 dark:bg-slate-800 rounded-md" />
          </div>
        ))}
      </div>

      {/* Hourly Skeleton */}
      <div className="space-y-3">
        <div className="w-32 h-5 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="shrink-0 w-28 h-36 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 flex flex-col items-center justify-between"
            >
              <div className="w-10 h-3 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="w-12 h-5 bg-slate-200 dark:bg-slate-800 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
