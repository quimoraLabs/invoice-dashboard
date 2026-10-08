import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { listenToInvoices } from "../../firebase/invoice";
import { useAuth } from "../../contexts/authContext/useAuth";
import { useDebounce } from "../../hooks/useDebounce";
import InvoiceListHeader from "../../components/invoice/InvoiceListHeader";
import InvoiceFilters from "../../components/invoice/InvoiceFilters";
import InvoiceTable from "../../components/invoice/InvoiceTable";
import InvoicePagination from "../../components/invoice/InvoicePagination";
import Loader from "../../components/Loader";

function Invoice() {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [invoices, setInvoices] = useState([]);
  const targetUid = currentUser?.uid || currentUser?.id || currentUser?.clerkUser?.id;
  const [dataLoaded, setDataLoaded] = useState(false);

  // Sync state with URL params
  const filter = searchParams.get("status") || "All";
  const customerFilter = searchParams.get("customer") || "All";
  const sortBy = searchParams.get("sort") || "newest";
  const dateFrom = searchParams.get("from") || "";
  const dateTo = searchParams.get("to") || "";
  const initialSearch = searchParams.get("search") || "";
  const currentPage = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("size")) || 10;

  // Search input local state & debounced hook
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Real-time listener for user invoices
  useEffect(() => {
    if (!targetUid) return;
    const unsubscribe = listenToInvoices((data) => {
      setInvoices(data);
      setDataLoaded(true);
    }, targetUid);
    return () => unsubscribe();
  }, [targetUid]);

  const loading = Boolean(targetUid && !dataLoaded);

  // Helper to update search params while resetting page to 1
  const updateFilters = useCallback(
    (updates, resetPage = true) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, value]) => {
          if (!value || value === "All" || (key === "sort" && value === "newest")) {
            next.delete(key);
          } else {
            next.set(key, String(value));
          }
        });
        if (resetPage) {
          next.delete("page");
        }
        return next;
      });
    },
    [setSearchParams]
  );

  // Sync debounced search to URL params
  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (debouncedSearch) {
        next.set("search", debouncedSearch);
      } else {
        next.delete("search");
      }
      next.delete("page"); // reset page on new search
      return next;
    });
  }, [debouncedSearch, setSearchParams]);

  // Distinct Customers List derived from invoices
  const distinctCustomers = useMemo(() => {
    const map = new Map();
    invoices.forEach((inv) => {
      const client = inv.client;
      if (client?.id && !map.has(client.id)) {
        map.set(client.id, {
          id: client.id,
          name: client.name || client.full_name || "Unknown Client",
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [invoices]);

  // Check if any non-default filters are applied
  const hasActiveFilters = Boolean(
    filter !== "All" ||
    customerFilter !== "All" ||
    dateFrom ||
    dateTo ||
    searchTerm.trim()
  );

  // Reset all filters handler
  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  // Sort toggle handler for table columns
  const handleSortToggle = useCallback(
    (field) => {
      let nextSort = "newest";
      if (field === "date") {
        nextSort = sortBy === "newest" ? "oldest" : "newest";
      } else if (field === "amount") {
        nextSort = sortBy === "amount-desc" ? "amount-asc" : "amount-desc";
      } else if (field === "name") {
        nextSort = sortBy === "name-asc" ? "name-desc" : "name-asc";
      }
      updateFilters({ sort: nextSort }, true);
    },
    [sortBy, updateFilters]
  );

  // Filtered & Sorted Invoices
  const filteredAndSortedInvoices = useMemo(() => {
    const filtered = invoices.filter((invoice) => {
      // 1. Status Filter
      if (filter !== "All" && invoice.status?.toLowerCase() !== filter.toLowerCase()) {
        return false;
      }

      // 2. Customer Filter
      if (customerFilter !== "All" && invoice.client?.id !== customerFilter) {
        return false;
      }

      // 3. Date Range Filter
      const invDateVal = invoice.invoiceDate || invoice.invoice_date || invoice.createdAt || invoice.created_at;
      if (invDateVal) {
        const invDate = new Date(invDateVal.toDate ? invDateVal.toDate() : invDateVal);
        if (dateFrom) {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          if (invDate < from) return false;
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (invDate > to) return false;
        }
      }

      // 4. Debounced Search (matches invoice number, client name, client email)
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const numMatch =
          invoice.invoiceNumber?.toLowerCase().includes(q) ||
          invoice.invoice_no?.toLowerCase().includes(q);
        const nameMatch = (invoice.client?.name || invoice.client?.full_name)?.toLowerCase().includes(q);
        const emailMatch = invoice.client?.email?.toLowerCase().includes(q);
        if (!numMatch && !nameMatch && !emailMatch) {
          return false;
        }
      }

      return true;
    });

    // Sort order
    return filtered.sort((a, b) => {
      if (sortBy === "newest") {
        const dateA = new Date(a.invoiceDate || a.invoice_date || a.createdAt || 0).getTime();
        const dateB = new Date(b.invoiceDate || b.invoice_date || b.createdAt || 0).getTime();
        return dateB - dateA;
      }
      if (sortBy === "oldest") {
        const dateA = new Date(a.invoiceDate || a.invoice_date || a.createdAt || 0).getTime();
        const dateB = new Date(b.invoiceDate || b.invoice_date || b.createdAt || 0).getTime();
        return dateA - dateB;
      }
      if (sortBy === "amount-desc") {
        return (Number(b.totalAmount ?? b.total_price) || 0) - (Number(a.totalAmount ?? a.total_price) || 0);
      }
      if (sortBy === "amount-asc") {
        return (Number(a.totalAmount ?? a.total_price) || 0) - (Number(b.totalAmount ?? b.total_price) || 0);
      }
      if (sortBy === "name-asc") {
        const nameA = a.client?.name || a.client?.full_name || "";
        const nameB = b.client?.name || b.client?.full_name || "";
        return nameA.localeCompare(nameB);
      }
      if (sortBy === "name-desc") {
        const nameA = a.client?.name || a.client?.full_name || "";
        const nameB = b.client?.name || b.client?.full_name || "";
        return nameB.localeCompare(nameA);
      }
      return 0;
    });
  }, [invoices, filter, customerFilter, dateFrom, dateTo, debouncedSearch, sortBy]);

  // Paginated Slices
  const totalItems = filteredAndSortedInvoices.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  // Safe current page bounds
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedInvoices = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredAndSortedInvoices.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedInvoices, safeCurrentPage, pageSize]);

  const handlePageChange = (newPage) => {
    updateFilters({ page: newPage }, false);
  };

  const handlePageSizeChange = (newSize) => {
    updateFilters({ size: newSize, page: 1 }, false);
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-10 space-y-6 mx-auto max-w-7xl">
      {/* Structural dashboard layout container blocks */}
      <InvoiceListHeader />

      <InvoiceFilters
        filter={filter}
        setFilter={(val) => updateFilters({ status: val })}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={(val) => updateFilters({ sort: val })}
        customerFilter={customerFilter}
        setCustomerFilter={(val) => updateFilters({ customer: val })}
        customersList={distinctCustomers}
        dateFrom={dateFrom}
        setDateFrom={(val) => updateFilters({ from: val })}
        dateTo={dateTo}
        setDateTo={(val) => updateFilters({ to: val })}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Render core table array structure */}
      <InvoiceTable
        invoices={paginatedInvoices}
        sortBy={sortBy}
        onSortToggle={handleSortToggle}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleResetFilters}
      />

      {/* Pagination Bar */}
      <InvoicePagination
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        totalItems={totalItems}
      />
    </div>
  );
}

export default Invoice;