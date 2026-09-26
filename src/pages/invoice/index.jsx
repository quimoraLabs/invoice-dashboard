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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser?.uid) return;
    setLoading(true);
    const unsubscribe = listenToInvoices((data) => {
      setInvoices(data);
      setLoading(false);
    }, currentUser.uid);
    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Filters computed dynamically leveraging memoized dependencies for high-velocity rendering
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const statusMatch =
        filter === "All" ||
        invoice.status?.toLowerCase() === filter.toLowerCase();
      const searchMatch =
        !searchTerm ||
        invoice.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase());

      return statusMatch && searchMatch;
    });
  }, [invoices, filter, searchTerm]);

  // Flushes state metrics returning filter workflows to raw baselines
  function resetFilters() {
    setFilter("All");
    setSearchTerm("");
  }

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="p-4 sm:p-6 md:p-10 space-y-6 mx-auto max-w-7xl">
      {/* Structural dashboard layout container blocks */}
      <InvoiceListHeader />

      <InvoiceFilters
        filter={filter}
        setFilter={setFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        resetFilters={resetFilters}
      />

      {/* Render core table array structure */}
      <InvoiceTable invoices={filteredInvoices} />
    </div>
  );
}

export default Invoice;