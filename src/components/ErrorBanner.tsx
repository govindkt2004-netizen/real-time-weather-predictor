import React from 'react';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry, onDismiss }) => {
  if (!message) return null;

  return (
    <div
      id="error-banner"
      role="alert"
      className="my-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 flex items-start justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold">Weather Service Notification</p>
          <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-300 mt-0.5">{message}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-rose-100 dark:bg-rose-900/80 hover:bg-rose-200 dark:hover:bg-rose-800 text-rose-800 dark:text-rose-100 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="p-1 rounded-md text-rose-500 hover:text-rose-700 dark:hover:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
