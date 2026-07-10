import React from 'react';

const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'table':
        return (
          <div className="w-full space-y-4 animate-pulse">
            <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-full" />
            <div className="h-8 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-full" />
            <div className="h-8 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-full" />
            <div className="h-8 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-full" />
            <div className="h-8 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-full" />
          </div>
        );
      case 'list':
        return (
          <div className="space-y-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/4" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800/65 rounded-md w-3/4" />
              </div>
            </div>
            <div className="h-px bg-slate-100 dark:bg-slate-800" />
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800/65 rounded-md w-1/2" />
              </div>
            </div>
          </div>
        );
      case 'chart':
        return (
          <div className="h-64 bg-slate-100 dark:bg-slate-800/40 rounded-2xl flex items-end justify-between p-6 gap-3 animate-pulse">
            <div className="h-[20%] bg-slate-200 dark:bg-slate-800 rounded-md w-12" />
            <div className="h-[60%] bg-slate-200 dark:bg-slate-800 rounded-md w-12" />
            <div className="h-[40%] bg-slate-200 dark:bg-slate-800 rounded-md w-12" />
            <div className="h-[80%] bg-slate-200 dark:bg-slate-800 rounded-md w-12" />
            <div className="h-[50%] bg-slate-200 dark:bg-slate-800 rounded-md w-12" />
            <div className="h-[90%] bg-slate-200 dark:bg-slate-800 rounded-md w-12" />
          </div>
        );
      default: // card
        return (
          <div className="card-premium p-6 space-y-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                <div className="h-6 bg-slate-350 dark:bg-slate-800 bg-slate-200 rounded w-1/2" />
              </div>
              <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
            <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-3/4" />
          </div>
        );
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <React.Fragment key={idx}>{renderSkeleton()}</React.Fragment>
      ))}
    </>
  );
};

export default SkeletonLoader;
