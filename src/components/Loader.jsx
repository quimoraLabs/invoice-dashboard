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
        <div className="h-10 w-full rounded-xl bg-muted" />

        {/* Table Rows Skeleton */}
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="flex h-12 w-full items-center justify-between gap-4 rounded-xl bg-surface px-4"
          >
            <div className="h-4 w-1/4 rounded bg-muted" />
            <div className="h-4 w-1/3 rounded bg-muted" />
            <div className="h-4 w-1/6 rounded bg-muted" />
            <div className="h-8 w-8 rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  // 2. Fullscreen / Modal Overlay Loader (Blur background + Spinner)
  if (variant === "overlay") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="flex flex-col items-center rounded-2xl bg-surface-elevated p-6 shadow-2xl border border-border">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
          {text && (
            <p className="mt-3 text-sm font-medium text-foreground">
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
        className={`animate-pulse rounded-2xl border border-border bg-surface-elevated p-5 shadow-sm ${className}`}
      >
        <div className="h-4 w-1/3 rounded bg-muted mb-3" />
        <div className="h-8 w-1/2 rounded bg-muted mb-2" />
        <div className="h-3 w-1/4 rounded bg-muted" />
      </div>
    );
  }

  // 4. Default Centered Spinner (For general components)
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 ${className}`}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-muted border-t-primary" />
      {text && (
        <span className="mt-2 text-xs font-medium text-muted-foreground">
          {text}
        </span>
      )}
    </div>
  );
}
