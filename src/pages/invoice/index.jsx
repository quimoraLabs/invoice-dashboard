import React, { useState, useEffect, useMemo } from "react";
import ConfirmDeleteModal from "../../components/modals/ConfirmDeleteModal";
import {
  deleteInvoice,
  listenToInvoices,
} from "../../firebase/invoice";
import toast from "react-hot-toast";
import InvoiceListHeader from "../../components/invoice/InvoiceListHeader";
import InvoiceFilters from "../../components/invoice/InvoiceFilters";
import InvoiceTable from "../../components/invoice/InvoiceTable";

function Invoice() {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [deleteToggle, setDeleteToggle] = useState(false);
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Establishes a real-time reactive pipeline with the Firebase database listener
  useEffect(() => {
    const unsubscribe = listenToInvoices(setInvoices);
    return () => unsubscribe();
  }, []);



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

  // Performs async structural deletion matching specific localized record indices
  async function handleDeleteInvoice() {
    if (!selectedInvoice) return;
    try {
      await deleteInvoice(selectedInvoice.id);
      toast.success("Invoice deleted successfully");
      setDeleteToggle(false);
      setSelectedInvoice(null);
    } catch (error) {
      toast.error("Failed to delete invoice");
      console.error("Error executing dynamic backend deletion:", error);
    }
  }


  // Resets modal configurations cleanly
  function handleCloseModal() {
    setDeleteToggle(false);
    setSelectedInvoice(null);
  }

  // Flushes state metrics returning filter workflows to raw baselines
  function resetFilters() {
    setFilter("All");
    setSearchTerm("");
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
      <InvoiceTable
        invoices={filteredInvoices}
      />

      {/* Conditional structural render for the localized global modal triggers */}
      {deleteToggle && (
        <ConfirmDeleteModal
          onClose={handleCloseModal}
          onConfirm={handleDeleteInvoice}
          type="invoice"
        />
      )}
    </div>
  );
}

export default Invoice;