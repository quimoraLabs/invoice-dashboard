import React, { useState, useEffect, useMemo } from "react";
import { listenToInvoices } from "../../firebase/invoice";
import { useAuth } from "../../contexts/authContext/useAuth";
import InvoiceListHeader from "../../components/invoice/InvoiceListHeader";
import InvoiceFilters from "../../components/invoice/InvoiceFilters";
import InvoiceTable from "../../components/invoice/InvoiceTable";
import Loader from "../../components/Loader";

function Invoice() {
  const { currentUser } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(false);

  const targetUid = currentUser?.uid || currentUser?.id || currentUser?.clerkUser?.id;

  useEffect(() => {
    if (!targetUid) return;
    setLoading(true);
    const unsubscribe = listenToInvoices((data) => {
      setInvoices(data);
      setLoading(false);
    }, targetUid);
    return () => unsubscribe();
  }, [targetUid]);

  // Filters and sorting computed dynamically
  const filteredInvoices = useMemo(() => {
    let result = invoices.filter((invoice) => {
      const statusMatch =
        filter === "All" ||
        invoice.status?.toLowerCase() === filter.toLowerCase();
      const searchMatch =
        !searchTerm ||
        invoice.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase());

      return statusMatch && searchMatch;
    });

    return result.sort((a, b) => {
      if (sortBy === "newest") {
        const dateA = new Date(a.invoice_date || a.created_at || 0).getTime();
        const dateB = new Date(b.invoice_date || b.created_at || 0).getTime();
        return dateB - dateA;
      }
      if (sortBy === "oldest") {
        const dateA = new Date(a.invoice_date || a.created_at || 0).getTime();
        const dateB = new Date(b.invoice_date || b.created_at || 0).getTime();
        return dateA - dateB;
      }
      if (sortBy === "amount-desc") {
        return (Number(b.total_price) || 0) - (Number(a.total_price) || 0);
      }
      if (sortBy === "amount-asc") {
        return (Number(a.total_price) || 0) - (Number(b.total_price) || 0);
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
  }, [invoices, filter, searchTerm, sortBy]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-10 space-y-6 mx-auto max-w-7xl">
      {/* Structural dashboard layout container blocks */}
      <InvoiceListHeader />

      <InvoiceFilters
        filter={filter}
        setFilter={setFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {/* Render core table array structure */}
      <InvoiceTable invoices={filteredInvoices} />
    </div>
  );
}

export default Invoice;