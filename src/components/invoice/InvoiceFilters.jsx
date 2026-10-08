import React from "react";
import { HiSearch, HiX, HiFilter } from "react-icons/hi";
import CustomDropdown from "../CustomDropdown";

function InvoiceFilters({
  filter,
  setFilter,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  customerFilter,
  setCustomerFilter,
  customersList = [],
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  onResetFilters,
  hasActiveFilters,
}) {
  const statusOptions = [
    { value: "All", label: "All Statuses" },
    { value: "Paid", label: "Paid" },
    { value: "Unpaid", label: "Unpaid" },
    { value: "Pending", label: "Pending" },
  ];

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "amount-desc", label: "Amount: High to Low" },
    { value: "amount-asc", label: "Amount: Low to High" },
    { value: "name-asc", label: "Client: A to Z" },
    { value: "name-desc", label: "Client: Z to A" },
  ];

  const customerOptions = [
    { value: "All", label: "All Customers" },
    ...customersList.map((c) => ({
      value: c.id,
      label: c.name,
    })),
  ];

  // Quick preset handlers
  const handleQuickPreset = (preset) => {
    const today = new Date();
    const endStr = today.toISOString().split("T")[0];

    if (preset === "7days") {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      setDateFrom(past.toISOString().split("T")[0]);
      setDateTo(endStr);
    } else if (preset === "30days") {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      setDateFrom(past.toISOString().split("T")[0]);
      setDateTo(endStr);
    } else if (preset === "all") {
      setDateFrom("");
      setDateTo("");
    }
  };

  return (
    <div className="space-y-3 mb-6">
      {/* Top Row: Search Input + Status + Customer + Sort */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <HiSearch
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by invoice #, client name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface-elevated py-2.5 pl-11 pr-10 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors cursor-pointer"
            >
              <HiX size={16} />
            </button>
          )}
        </div>

        {/* Dropdowns Group */}
        <div className="flex items-center gap-2 flex-wrap">
          <CustomDropdown
            value={filter}
            onChange={setFilter}
            options={statusOptions}
          />

          <CustomDropdown
            value={customerFilter}
            onChange={setCustomerFilter}
            options={customerOptions}
          />

          <CustomDropdown
            labelPrefix="Sort"
            value={sortBy}
            onChange={setSortBy}
            options={sortOptions}
            align="right"
          />
        </div>
      </div>

      {/* Bottom Row: Date Range + Presets + Clear All Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border bg-surface-elevated/50 p-2.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-foreground flex items-center gap-1">
            <HiFilter size={14} className="text-primary" /> Date Range:
          </span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
            title="From Date"
          />
          <span>to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
            title="To Date"
          />

          {/* Quick Presets */}
          <div className="flex items-center gap-1 pl-1">
            <button
              type="button"
              onClick={() => handleQuickPreset("7days")}
              className="rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] font-medium hover:bg-surface-elevated transition cursor-pointer"
            >
              Last 7d
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset("30days")}
              className="rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] font-medium hover:bg-surface-elevated transition cursor-pointer"
            >
              Last 30d
            </button>
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1 text-danger font-semibold hover:underline self-end sm:self-auto cursor-pointer"
          >
            <HiX size={14} /> Clear all filters
          </button>
        )}
      </div>
    </div>
  );
}

export default InvoiceFilters;