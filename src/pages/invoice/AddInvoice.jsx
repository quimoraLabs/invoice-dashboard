import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FileSpreadsheet, Camera } from "lucide-react";
import InvoiceForm from "../../components/invoice/InvoiceForm";
import BulkInvoiceImportModal from "../../components/invoice/BulkInvoiceImportModal";
import CameraReceiptScannerModal from "../../components/invoice/CameraReceiptScannerModal";
import { listenToCustomers } from "../../firebase/customer";
import { listenToProducts } from "../../firebase/product";
import { createInvoiceWithNumber } from "../../firebase/invoice";
import { formatCurrentDate } from "../../components/helper";
import { useAuth } from "../../contexts/authContext/useAuth";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import toast from "react-hot-toast";

export default function AddInvoice() {
  const { currentUser } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [allCustomers, setAllCustomers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const targetUid = currentUser?.uid || currentUser?.id || currentUser?.clerkUser?.id;
  const workspaceId = activeWorkspace?.id;

  const targetScope = useMemo(() => ({
    workspaceId,
    userId: targetUid,
  }), [workspaceId, targetUid]);

  useEffect(() => {
    if (!targetUid && !workspaceId) return;
    const unsubCust = listenToCustomers(setAllCustomers, targetScope);
    const unsubProd = listenToProducts(setAllProducts, targetScope);
    return () => {
      unsubCust();
      unsubProd();
    };
  }, [targetScope, targetUid, workspaceId]);

  const emptyInvoiceState = {
    invoiceNumber: "INV-00",
    client: { name: "", email: "", phone: "", id: "" },
    invoiceDate: formatCurrentDate(),
    taxRate: 18,
    items: [{ id: "", title: "", quantity: 1, price: 0 }],
    status: "Pending",
    paymentType: "",
  };

  const [currentInvoiceData, setCurrentInvoiceData] = useState(() => {
    const scanned = location.state?.scannedInvoice;
    if (scanned) {
      return {
        invoiceNumber: "INV-00",
        client: {
          name: scanned.clientName || "",
          email: scanned.clientEmail || "",
          phone: scanned.clientPhone || "",
          id: scanned.clientId || "",
        },
        invoiceDate: scanned.invoiceDate || formatCurrentDate(),
        taxRate: scanned.taxRate || 18,
        items: scanned.items?.length > 0
          ? scanned.items
          : [{ id: "", title: "", quantity: 1, price: 0 }],
        status: "Pending",
        paymentType: scanned.paymentType || "",
      };
    }
    return emptyInvoiceState;
  });

  const handleApplyScannedReceipt = (extracted) => {
    setCurrentInvoiceData({
      invoiceNumber: "INV-00",
      client: {
        name: extracted.clientName || "",
        email: extracted.clientEmail || "",
        phone: extracted.clientPhone || "",
        id: extracted.clientId || "",
      },
      invoiceDate: extracted.invoiceDate || formatCurrentDate(),
      taxRate: extracted.taxRate || 18,
      items: extracted.items?.length > 0
        ? extracted.items
        : [{ id: "", title: "", quantity: 1, price: 0 }],
      status: "Pending",
      paymentType: extracted.paymentType || "",
    });
  };

  const handleCreateSubmit = async (finalInvoice) => {
    if (!targetUid && !workspaceId) {
      toast.error("Authentication required to create invoice.");
      return;
    }
    setSubmitting(true);
    try {
      if (targetUid) finalInvoice.userId = targetUid;
      if (workspaceId) finalInvoice.workspaceId = workspaceId;
      const created = await createInvoiceWithNumber(targetScope, finalInvoice, setSubmitting);
      toast.success(`Invoice #${created.invoiceNumber} successfully created!`);
      setTimeout(() => {
        navigate(-1);
      }, 800);
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error(error?.message || "Creation failed!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Create New Invoice
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Issue a single invoice, snap a photo of a receipt, or upload in bulk.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsCameraModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground active:scale-95 shadow-xs"
          >
            <Camera size={16} />
            Scan Receipt (Camera/AI)
          </button>
          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs sm:text-sm font-medium text-foreground transition hover:border-primary hover:text-primary active:scale-95 shadow-sm"
          >
            <FileSpreadsheet size={16} />
            Bulk Invoices (Excel)
          </button>
        </div>
      </div>

      <InvoiceForm
        initialData={currentInvoiceData}
        onSubmit={handleCreateSubmit}
        allCustomers={allCustomers}
        allProducts={allProducts}
        isEditMode={false}
        submitting={submitting}
      />

      <CameraReceiptScannerModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onApply={handleApplyScannedReceipt}
        allCustomers={allCustomers}
        allProducts={allProducts}
      />

      <BulkInvoiceImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        allCustomers={allCustomers}
        allProducts={allProducts}
        scope={targetScope}
        onSuccess={() => {
          setIsBulkModalOpen(false);
          navigate("/invoice");
        }}
      />
    </div>
  );
}
