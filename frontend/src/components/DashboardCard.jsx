import React from 'react';

const DashboardCard = ({ title, value, icon, trendText, trendType = 'neutral', colorClass = 'brand' }) => {
  const colorMaps = {
    brand: 'text-brand-600 bg-brand-50 dark:bg-brand-900/10 dark:text-brand-500 border border-brand-100/30',
    success: 'text-success-600 bg-emerald-50 dark:bg-emerald-900/10 dark:text-success-500 border border-emerald-100/30',
    warning: 'text-warning-600 bg-amber-50 dark:bg-amber-900/10 dark:text-warning-500 border border-amber-100/30',
    danger: 'text-danger-600 bg-red-50 dark:bg-red-900/10 dark:text-danger-500 border border-red-100/30',
  };

  const trendColorClass = {
    up: 'text-success-600 dark:text-success-500',
    down: 'text-danger-600 dark:text-danger-500',
    neutral: 'text-slate-400',
  }[trendType];

  return (
    <div className="card-premium p-6 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {title}
          </span>
          <h3 className="mt-1 font-display text-3xl font-bold text-slate-800 dark:text-white">
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-2xl ${colorMaps[colorClass] || colorMaps.brand}`}>
          {icon}
        </div>
      </div>
      
      {trendText && (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          <span className={`font-semibold ${trendColorClass}`}>
            {trendText}
          </span>
        </div>
      )}
    </div>
  );
};

export default DashboardCard;
