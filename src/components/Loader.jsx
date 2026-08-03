import React from "react";

/**
 * Universal Global Loader Component
 * @param {string} variant - 'spinner' | 'table' | 'card' | 'overlay'
 * @param {number} rows - Table skeleton rows count (default: 5)
 * @param {string} text - Optional text under spinner (e.g., "Loading data...")
 */
export default function Loader({
  variant = "spinner",
  rows = 5,
  text = "Loading...",
  className = "",
}) {
  // 1. Table Skeleton Loader (Best for Data Tables!)
  if (variant === "table") {
    return (
      <div className={`w-full animate-pulse space-y-3 p-4 ${className}`}>
        {/* Table Header Skeleton */}
        <div className="h-10 w-full rounded-xl bg-slate-200 dark:bg-slate-700/60" />

        {/* Table Rows Skeleton */}
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="flex h-12 w-full items-center justify-between gap-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 px-4"
          >
            <div className="h-4 w-1/4 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-1/6 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>
    );
  }

  // 2. Fullscreen / Modal Overlay Loader (Blur background + Spinner)
  if (variant === "overlay") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm">
        <div className="flex flex-col items-center rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-2xl border border-slate-100 dark:border-slate-700">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-500" />
          {text && (
            <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  // 3. Card Skeleton (For Stats Cards / Charts)
  if (variant === "card") {
    return (
      <div
        className={`animate-pulse rounded-2xl border border-slate-100 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-5 shadow-sm ${className}`}
      >
        <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-700 mb-3" />
        <div className="h-8 w-1/2 rounded bg-slate-200 dark:bg-slate-700 mb-2" />
        <div className="h-3 w-1/4 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  // 4. Default Centered Spinner (For general components)
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 ${className}`}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-500" />
      {text && (
        <span className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          {text}
        </span>
      )}
    </div>
  );
}
