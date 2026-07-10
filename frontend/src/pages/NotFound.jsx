import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-darkbg-900 flex flex-col justify-center items-center p-4">
      <div className="text-center space-y-6 max-w-md">
        
        {/* Visual icon marker */}
        <div className="inline-flex p-5 bg-danger-50 dark:bg-danger-900/10 text-danger-500 rounded-3xl border border-danger-100/30 animate-pulse">
          <AlertCircle className="h-12 w-12" />
        </div>
        
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-slate-900 dark:text-white">
          404 - Page Not Found
        </h1>
        
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          The civic lane you are looking for does not exist or has been moved. Check the URL spelling or return to the dashboard.
        </p>

        <div className="pt-4">
          <Link 
            to="/dashboard-redirect" 
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/15 hover:shadow-brand-500/25 transition-all"
          >
            <ArrowLeft className="h-4.5 w-4.5" /> Return to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
};

export default NotFound;
