import React from "react";
import InvoiceTableRow from "./InvoiceTableRow";
import { Link } from "react-router-dom";
import { HiPlus, HiChevronUp, HiChevronDown, HiOutlineDocumentSearch } from "react-icons/hi";

function InvoiceTable({
  invoices = [],
  sortBy,
  onSortToggle,
  hasActiveFilters,
  onClearFilters,
}) {
  // Empty State Variant 1: No filters active & total user invoices is 0
  if (invoices.length === 0 && !hasActiveFilters) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-4 rounded-[22px] border border-border bg-surface-elevated shadow-sm space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-muted text-primary">
          <HiOutlineDocumentSearch size={28} />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">No invoices created yet</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Get started by creating your first business invoice with automatic GST calculations.
          </p>
        </div>
        <Link
          to="/invoice/create"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover transition"
        >
          <HiPlus size={16} /> Create your first invoice
        </Link>
      </div>
    );
  }

  // Empty State Variant 2: Filters active but yielded 0 results
  if (invoices.length === 0 && hasActiveFilters) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-4 rounded-[22px] border border-border bg-surface-elevated shadow-sm space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <HiOutlineDocumentSearch size={24} />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">No matching invoices</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            None of your invoices match the currently selected filters or search terms.
          </p>
        </div>
        <button
          type="button"
          onClick={onClearFilters}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface-elevated transition cursor-pointer"
        >
          Reset and clear all filters
        </button>
      </div>
    );
  }

  // Helper to render sort arrow in headers
  const renderSortIndicator = (field) => {
    if (sortBy === `${field}-asc`) {
      return <HiChevronUp size={14} className="text-primary inline ml-1" />;
    }
    if (sortBy === `${field}-desc` || (field === "date" && sortBy === "newest") || (field === "name" && sortBy === "name-asc")) {
      return <HiChevronDown size={14} className="text-primary inline ml-1" />;
    }
    return null;
  };

  return (
    <div className="rounded-[22px] border border-border bg-surface-elevated shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-muted-foreground">
          <thead className="text-xs text-muted-foreground uppercase bg-surface border-b border-border font-semibold tracking-wider">
            <tr>
              <th scope="col" className="px-4 py-3 sm:px-6">
                Invoices
              </th>
              {/* Client header sortable */}
              <th
                scope="col"
                onClick={() => onSortToggle?.("name")}
                className="hidden sm:table-cell px-6 py-3 cursor-pointer hover:text-foreground transition select-none"
              >
                Client {renderSortIndicator("name")}
              </th>
              {/* Date header sortable */}
              <th
                scope="col"
                onClick={() => onSortToggle?.("date")}
                className="hidden md:table-cell px-6 py-3 cursor-pointer hover:text-foreground transition select-none"
              >
                Date {renderSortIndicator("date")}
              </th>
              {/* Amount header sortable */}
              <th
                scope="col"
                onClick={() => onSortToggle?.("amount")}
                className="px-4 py-3 text-right sm:px-6 cursor-pointer hover:text-foreground transition select-none"
              >
                Amount {renderSortIndicator("amount")}
              </th>
              <th scope="col" className="px-4 py-3 text-center sm:px-6">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-right sm:px-6">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map((invoice) => (
              <InvoiceTableRow key={invoice.id} invoice={invoice} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InvoiceTable;