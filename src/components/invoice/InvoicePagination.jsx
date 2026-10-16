import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CustomDropdown from "../CustomDropdown";

const pageSizeOptions = [
  { value: 10, label: "10" },
  { value: 25, label: "25" },
  { value: 50, label: "50" },
];

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
          <CustomDropdown
            value={pageSize}
            onChange={(val) => onPageSizeChange(Number(val))}
            options={pageSizeOptions}
            buttonClassName="!py-1 !px-2.5 !rounded-lg text-xs"
          />
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Previous Page"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-surface-elevated text-foreground hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft size={16} />
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
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
