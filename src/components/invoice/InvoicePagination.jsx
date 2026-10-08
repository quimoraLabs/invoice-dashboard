import React from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";

export default function InvoicePagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalItems,
}) {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 px-2 text-sm text-muted-foreground">
      {/* Items count indicator */}
      <div className="text-xs sm:text-sm">
        Showing <span className="font-semibold text-foreground">{startItem}</span> to{" "}
        <span className="font-semibold text-foreground">{endItem}</span> of{" "}
        <span className="font-semibold text-foreground">{totalItems}</span> invoices
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Page Size Selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <span>Per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-border bg-surface-elevated px-2 py-1 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Previous Page"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-surface-elevated text-foreground hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <HiChevronLeft size={16} />
          </button>

          <span className="px-2 text-xs font-semibold text-foreground">
            {currentPage} / {Math.max(1, totalPages)}
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Next Page"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-surface-elevated text-foreground hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <HiChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
