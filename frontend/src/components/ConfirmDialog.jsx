import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmDialog = ({ 
  isOpen, 
  title = "Are you sure?", 
  message = "This action cannot be undone.", 
  confirmText = "Confirm", 
  cancelText = "Cancel", 
  onConfirm, 
  onCancel,
  danger = true
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div 
        className="w-full max-w-md rounded-2xl bg-white dark:bg-darkbg-800 p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${danger ? 'bg-danger-50 dark:bg-danger-900/10 text-danger-500' : 'bg-brand-50 dark:bg-brand-900/10 text-brand-500'}`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              {title}
            </h3>
          </div>
          <button 
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-darkbg-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <p className="mt-3.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {message}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-darkbg-700 transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-lg transition-all ${
              danger 
                ? 'bg-danger-500 hover:bg-danger-600 shadow-danger-500/15' 
                : 'bg-brand-500 hover:bg-brand-600 shadow-brand-500/15'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
