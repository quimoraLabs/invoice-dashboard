import React, { useState, useEffect, useMemo } from "react";
import ConfirmDeleteModal from "../../components/modals/ConfirmDeleteModal";
import {
  deleteInvoice,
  listenToInvoices,
  updateInvoiceStatusAndDueDate,
} from "../../firebase/invoice";
// import { dateFormat } from "../../components/helper";
import { PDFViewer } from "@react-pdf/renderer";
import toast from "react-hot-toast";
// import InvoicePDF from "../../components/invoice/InvoiceView";
import InvoiceListHeader from "../../components/invoice/InvoiceListHeader";
import InvoiceFilters from "../../components/invoice/InvoiceFilters";
import InvoiceTable from "../../components/invoice/InvoiceTable";

function InVoice() {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [deleteToggle, setDeleteToggle] = useState(false);
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [pdfOpen, setPdfOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = listenToInvoices(setInvoices);
    return () => unsubscribe();
  }, []);

  function deleteToggleHandler(invoice) {
    setSelectedInvoice(invoice);
    setDeleteToggle(true);
  }

  function pdfToggleHandler(invoice) {
    setSelectedInvoice(invoice);
    setPdfOpen(true);
  }

  function closePdfViewer() {
    setPdfOpen(false);
    setSelectedInvoice(null);
  }

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const statusMatch =
        filter === "All" ||
        invoice.status?.toLowerCase() === filter.toLowerCase();
      const searchMatch =
        !searchTerm ||
        invoice.client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase());

      return statusMatch && searchMatch;
    });
  }, [invoices, filter, searchTerm]);

  async function handleDeleteInvoice() {
    if (!selectedInvoice) return;
    try {
      await deleteInvoice(selectedInvoice.id);
      toast.success("Invoice deleted successfully");
      console.log("Deleting invoice:", selectedInvoice);
      setDeleteToggle(false);
      setSelectedInvoice(null);
    } catch (error) {
      toast.error("Failed to delete invoice");
      console.error("Error deleting invoice:", error);
    }
  }

  async function handleUpdateInvoice(id) {
    if (!id) return;
    try {
      await updateInvoiceStatusAndDueDate(id);
      toast.success("Invoice status updated to Paid");
      console.log("Updating invoice:", selectedInvoice);
    } catch (error) {
      toast.error("Failed to update invoice");
      console.error("Error updating invoice:", error);
    }
  }

  function handleCloseModal() {
    setDeleteToggle(false);
    setSelectedInvoice(null);
  }

  function resetFilters() {
    setFilter("All");
    setSearchTerm("");
  }

  return (
    <div className="p-4 sm:p-6 md:p-10">
      <InvoiceListHeader />

      <InvoiceFilters
        filter={filter}
        setFilter={setFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        resetFilters={resetFilters}
      />

      <InvoiceTable
        invoices={filteredInvoices}
        onView={pdfToggleHandler}
        onMarkPaid={handleUpdateInvoice}
        onDelete={deleteToggleHandler}
      />

      {deleteToggle && (
        <ConfirmDeleteModal
          onClose={handleCloseModal}
          onConfirm={handleDeleteInvoice}
          type="invoice"
        />
      )}

      {pdfOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-[95%] h-[90%] max-w-6xl relative">
            {/* Close Button */}
            <button
              onClick={closePdfViewer}
              className="absolute top-2 right-2 z-10 bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 transition-colors"
              aria-label="Close PDF viewer"
            >
              ✕
            </button>
            {/* PDF Viewer */}
            <PDFViewer
              style={{ width: "100%", height: "100%", borderRadius: "8px" }}
              showToolbar={true}
            >
              {/* <InvoicePDF data={selectedInvoice} /> */}
            </PDFViewer>
          </div>
        </div>
      )}
    </div>
  );
}

export default InVoice;
