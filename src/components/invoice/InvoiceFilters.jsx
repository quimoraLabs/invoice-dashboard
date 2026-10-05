import React, { useState } from "react";
import { HiSearch, HiX } from "react-icons/hi";
import CustomDropdown from "../CustomDropdown";

function InvoiceFilters({
  filter,
  setFilter,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
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

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Search Input */}
      <div className="relative flex-1">
        <HiSearch
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={18}
        />
        <input
          type="text"
          placeholder="Search invoices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-2xl border border-border bg-surface-elevated py-2.5 pl-11 pr-10 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
          >
            <HiX size={16} />
          </button>
        )}
      </div>

      {/* Interactive Dropdowns Group */}
      <div className="flex items-center gap-3 flex-wrap">
        <CustomDropdown
          value={filter}
          onChange={setFilter}
          options={statusOptions}
        />

        <CustomDropdown
          labelPrefix="Sort:"
          value={sortBy}
          onChange={setSortBy}
          options={sortOptions}
          align="right"
        />
      </div>
    </div>
  );
}

export default InvoiceFilters;