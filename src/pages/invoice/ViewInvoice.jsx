import { useParams, useNavigate, Link } from "react-router-dom";
import { dateFormat, formatCurrentDate } from "../../components/helper";
import {
  HiOutlineArrowLeft,
  HiOutlinePrinter,
  HiOutlinePencil,
  HiOutlineCheckCircle,
  HiOutlineTrash,
  HiOutlineDocumentDuplicate,
  HiOutlineArrowDownTray,
} from "react-icons/hi2";
import {
  updateInvoiceStatusAndDueDate,
  deleteInvoice,
  createInvoiceWithNumber,
} from "../../firebase/invoice";
import { getBusinessProfile } from "../../firebase/profile";
import { useEffect, useState, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import toast from "react-hot-toast";
import ConfirmDeleteModal from "../../components/modals/ConfirmDeleteModal";
import PaymentMethodModal from "../../components/modals/PaymentMethodModal";
import ConfirmDuplicateModal from "../../components/modals/ConfirmDuplicateModal";
import { PDFDownloadLink } from "@react-pdf/renderer";
import InvoicePDF from "../../components/InvoiceView";

import { useAuth } from "../../contexts/authContext/useAuth";

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams();
  const { currentUser } = useAuth();

  const [invoice, setInvoice] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const navigate = useNavigate();

  const isDeletingRef = useRef(false);
  const targetUid = currentUser?.uid || currentUser?.id || currentUser?.clerkUser?.id;

  useEffect(() => {
    if (!invoiceId) return;

    // Load business profile for the user
    if (targetUid) {
      getBusinessProfile(targetUid)
        .then((profile) => setCompanyProfile(profile))
        .catch((err) => console.error("Could not fetch business profile for PDF:", err));
    }

    const docRef = doc(db, "invoices", invoiceId);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (targetUid && data.userId && data.userId !== targetUid) {
            toast.error("Unauthorized: You do not have permission to view this invoice.");
            navigate("/invoice", { replace: true });
            return;
          }
          setInvoice({ id: docSnap.id, ...data });
        } else {
          setInvoice(null);
          if (!isDeletingRef.current) {
            toast.error("Invoice no longer exists or was cleared.");
            navigate("/invoice", { replace: true });
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to invoice detail:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [invoiceId, navigate, targetUid]);

  const statusColors = {
    Paid: "bg-success-muted text-success border-success/30",
    Unpaid: "bg-danger-muted text-danger border-danger/30",
    Pending: "bg-warning-muted text-warning border-warning/30",
    Draft: "bg-muted text-muted-foreground border-border",
  };

  // 1. Mark As Paid Action (with mandatory payment method modal)
  async function handleConfirmPayment(paymentMethod) {
    try {
      await updateInvoiceStatusAndDueDate(invoiceId, "Paid", paymentMethod, null, targetUid);
      toast.success(`Invoice marked as Paid via ${paymentMethod}!`);
    } catch (error) {
      toast.error(error?.message || "Failed to update status");
      console.error("Database update transaction failed:", error);
    }
  }

  // 2. Duplicate Action
  async function handleConfirmDuplicate() {
    if (!invoice || !targetUid || isDuplicating) return;

    setIsDuplicating(true);
    try {
      // Deep clone items & client details while resetting invoice numbers & dates
      const duplicatePayload = {
        client: invoice.client ? { ...invoice.client } : {},
        items: Array.isArray(invoice.items) ? invoice.items.map((it) => ({ ...it })) : [],
        taxRate: invoice.taxRate ?? 18,
        notes: invoice.notes || "",
        status: "Draft",
        invoiceDate: formatCurrentDate(), // Reset to today per GST 90-day compliance
        dueDate: null,
        paidDate: null,
        paymentType: null,
      };

      const created = await createInvoiceWithNumber(targetUid, duplicatePayload);
      toast.success(`Cloned as new invoice #${created.invoiceNumber}!`);
      setShowDuplicateModal(false);
      navigate(`/invoice/view/${created.id}`);
    } catch (error) {
      console.error("Duplicate invoice error:", error);
      toast.error(error?.message || "Failed to duplicate invoice.");
    } finally {
      setIsDuplicating(false);
    }
  }

  // 3. Delete Action with safe navigation
  async function handleDeleteInvoice() {
    try {
      isDeletingRef.current = true;
      setIsDeleting(true);
      setShowDeleteModal(false);
      navigate("/invoice", { replace: true });
      await deleteInvoice(invoiceId, null, targetUid);
      toast.success("Invoice deleted successfully!");
    } catch (error) {
      isDeletingRef.current = false;
      setIsDeleting(false);
      toast.error(error?.message || "Failed to delete invoice");
      console.error("Error deleting invoice:", error);
    }
  }

  if (loading || isDeleting) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">
            {isDeleting ? "Deleting invoice..." : "Loading invoice details..."}
          </p>
        </div>
      </div>
    );
  }

  if (!invoice && !isDeleting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 space-y-4">
        <div className="text-foreground font-bold text-lg">
          Invoice not found or deleted
        </div>
        <button
          onClick={() => navigate("/invoice", { replace: true })}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary-hover transition shadow-sm cursor-pointer"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  const invoiceNumberStr = invoice?.invoiceNumber || invoice?.invoice_no || "INV-000";
  const sanitizedClient = (invoice?.client?.name || "Client").replace(/[^a-zA-Z0-9]/g, "_");
  const pdfFileName = `${invoiceNumberStr}_${sanitizedClient}.pdf`;

  const totalAmount = invoice?.totalAmount ?? invoice?.total_price ?? 0;
  const subtotal = invoice?.subTotal ?? totalAmount / 1.18;
  const totalTax = invoice?.totalTax ?? (totalAmount - subtotal);

  return (
    <div className="min-h-screen bg-background max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. Control Toolbar */}
      <div className="flex items-center justify-between gap-4 bg-surface-elevated p-4 rounded-[22px] border border-border shadow-sm print:hidden">
        <button
          onClick={() => navigate("/invoice")}
          title="Back to invoices"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition cursor-pointer"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {/* Delete Action */}
          <button
            onClick={() => setShowDeleteModal(true)}
            title="Delete Invoice"
            className="p-2.5 text-danger bg-surface border border-border rounded-xl hover:bg-danger-muted transition shadow-sm cursor-pointer"
          >
            <HiOutlineTrash className="w-5 h-5" />
          </button>

          {/* Duplicate Action */}
          <button
            onClick={() => setShowDuplicateModal(true)}
            title="Duplicate Invoice"
            disabled={isDuplicating}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-foreground bg-surface border border-border rounded-xl hover:bg-surface-elevated transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            <HiOutlineDocumentDuplicate className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">Duplicate</span>
          </button>

          {/* Download PDF Action via React-PDF */}
          <PDFDownloadLink
            document={<InvoicePDF data={invoice} companyProfile={companyProfile} />}
            fileName={pdfFileName}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-foreground bg-surface border border-border rounded-xl hover:bg-surface-elevated transition shadow-sm cursor-pointer"
            title="Download PDF"
          >
            {({ loading: pdfLoading }) => (
              <>
                <HiOutlineArrowDownTray className="w-4 h-4 text-primary" />
                <span className="hidden sm:inline">{pdfLoading ? "Preparing..." : "PDF"}</span>
              </>
            )}
          </PDFDownloadLink>

          {/* Print Action */}
          <button
            onClick={() => window.print()}
            title="Print Invoice"
            className="p-2.5 text-muted-foreground bg-surface border border-border rounded-xl hover:bg-surface-elevated hover:text-foreground transition shadow-sm cursor-pointer"
          >
            <HiOutlinePrinter className="w-5 h-5" />
          </button>

          {/* Edit Routing */}
          <Link
            to={`/invoice/update/${invoiceId}`}
            title="Edit invoice"
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-foreground bg-surface border border-border rounded-xl hover:bg-surface-elevated transition shadow-sm"
          >
            <HiOutlinePencil className="w-4 h-4" />
            <span className="hidden sm:inline">Edit</span>
          </Link>

          {/* Mark as Paid Action */}
          {invoice?.status !== "Paid" && (
            <button
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-success rounded-xl hover:opacity-90 transition shadow-sm cursor-pointer"
              title="Mark as Paid"
              onClick={() => setShowPaymentModal(true)}
            >
              <HiOutlineCheckCircle className="w-4 h-4" />
              <span>Mark Paid</span>
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ConfirmDeleteModal
          onClose={() => setShowDeleteModal(false)}
          type="invoice"
          onConfirm={handleDeleteInvoice}
        />
      )}

      {/* Payment Method Selector Modal */}
      <PaymentMethodModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handleConfirmPayment}
        invoiceNumber={invoiceNumberStr}
      />

      {/* Duplicate Confirmation Modal */}
      <ConfirmDuplicateModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        onConfirm={handleConfirmDuplicate}
        invoiceNumber={invoiceNumberStr}
        isDuplicating={isDuplicating}
      />

      {/* 2. Main Printable Invoice Canvas */}
      <div className="bg-surface-elevated rounded-[22px] border border-border shadow-sm p-6 sm:p-10 space-y-8 print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
        {/* Top Header Details Area */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-border pb-6">
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-primary uppercase tracking-widest">
              Tax Invoice
            </div>
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-2xl font-black text-foreground">
                {invoiceNumberStr}
              </h1>
              <span className="text-xl font-bold text-muted-foreground">/</span>
              <div className="text-xl font-extrabold text-primary tabular-nums">
                ₹
                {Number(totalAmount).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md border shadow-sm ${statusColors[invoice?.status] || "bg-muted text-muted-foreground border-border"}`}
            >
              {invoice?.status}
            </span>
            {(invoice?.paymentType || invoice?.payment_type) && (
              <span className="ml-2 text-xs text-muted-foreground font-medium">
                via {invoice.paymentType || invoice.payment_type}
              </span>
            )}
          </div>
          <div className="sm:text-right text-xs sm:text-sm text-muted-foreground space-y-1 w-full sm:w-auto">
            <div>
              <span className="font-semibold text-foreground">Issue Date:</span>{" "}
              {dateFormat(invoice?.invoiceDate || invoice?.invoice_date)
                ? dateFormat(invoice.invoiceDate || invoice.invoice_date).split(",")[0]
                : "N/A"}
            </div>
            {invoice?.dueDate && (
              <div>
                <span className="font-semibold text-foreground">Due Date:</span>{" "}
                {dateFormat(invoice.dueDate).split(",")[0]}
              </div>
            )}
            {invoice?.paidDate && (
              <div>
                <span className="font-semibold text-foreground">Paid Date:</span>{" "}
                {dateFormat(invoice.paidDate).split(",")[0]}
              </div>
            )}
          </div>
        </div>

        {/* Customer & Merchant Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface p-6 rounded-2xl border border-border">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Billed To
            </h3>
            <p className="text-base font-bold text-foreground">
              {invoice?.client?.name || invoice?.client?.full_name || "Customer Name"}
            </p>
            {invoice?.client?.email && (
              <p className="text-xs text-muted-foreground mt-0.5">{invoice.client.email}</p>
            )}
            {invoice?.client?.phone && (
              <p className="text-xs text-muted-foreground mt-0.5">{invoice.client.phone}</p>
            )}
            {invoice?.client?.address && (
              <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">
                {invoice.client.address}
              </p>
            )}
          </div>

          <div className="md:text-right">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Invoice Status Details
            </h3>
            <div className="text-xs space-y-1 text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Payment Status:</span>{" "}
                {invoice?.status}
              </p>
              {invoice?.paymentType && (
                <p>
                  <span className="font-semibold text-foreground">Payment Mode:</span>{" "}
                  {invoice.paymentType}
                </p>
              )}
              <p>
                <span className="font-semibold text-foreground">Applicable GST:</span>{" "}
                {invoice?.taxRate ?? 18}%
              </p>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface text-muted-foreground font-semibold uppercase tracking-wider border-b border-border">
              <tr>
                <th className="p-3 sm:px-4">#</th>
                <th className="p-3 sm:px-4">Description</th>
                <th className="p-3 sm:px-4 text-center">Qty</th>
                <th className="p-3 sm:px-4 text-right">Price</th>
                <th className="p-3 sm:px-4 text-right">Tax (18%)</th>
                <th className="p-3 sm:px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoice?.items?.map((item, idx) => {
                const itemPrice = Number(item.price) || 0;
                const itemQty = Number(item.quantity) || 1;
                const itemSub = item.subTotal ?? (itemPrice * itemQty);
                const itemTax = item.taxAmount ?? ((itemSub * 18) / 100);
                const itemTot = item.total ?? (itemSub + itemTax);

                return (
                  <tr key={idx} className="hover:bg-surface/50">
                    <td className="p-3 sm:px-4 text-muted-foreground">{idx + 1}</td>
                    <td className="p-3 sm:px-4 font-medium text-foreground">
                      {item.title || "Item"}
                    </td>
                    <td className="p-3 sm:px-4 text-center">{itemQty}</td>
                    <td className="p-3 sm:px-4 text-right tabular-nums">
                      ₹{itemPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 sm:px-4 text-right tabular-nums text-muted-foreground">
                      ₹{Number(itemTax).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 sm:px-4 text-right font-semibold text-foreground tabular-nums">
                      ₹{Number(itemTot).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Calculation Summary Footer */}
        <div className="flex justify-end">
          <div className="w-full sm:w-80 space-y-2 text-xs">
            <div className="flex justify-between py-1 text-muted-foreground">
              <span>Subtotal:</span>
              <span className="font-semibold text-foreground tabular-nums">
                ₹{Number(subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between py-1 text-muted-foreground">
              <span>Total Tax (GST):</span>
              <span className="font-semibold text-foreground tabular-nums">
                ₹{Number(totalTax).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between py-2 border-t border-border text-sm font-bold text-foreground">
              <span>Grand Total:</span>
              <span className="text-primary tabular-nums">
                ₹{Number(totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Notes (if any) */}
        {invoice?.notes && (
          <div className="border-t border-border pt-4 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Notes:</span> {invoice.notes}
          </div>
        )}
      </div>
    </div>
  );
}
