import { useParams, useNavigate, Link } from "react-router-dom";
import { dateFormat } from "../../components/helper";
import {
  HiOutlineArrowLeft,
  HiOutlinePrinter,
  HiOutlinePencil,
  HiOutlineCheckCircle,
  HiOutlineTrash,
} from "react-icons/hi2";
import {
  updateInvoiceStatusAndDueDate,
  deleteInvoice,
} from "../../firebase/invoice";
import { useEffect, useState, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import toast from "react-hot-toast";
import ConfirmDeleteModal from "../../components/modals/ConfirmDeleteModal";

import { useAuth } from "../../contexts/authContext/useAuth";

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams();
  const { currentUser } = useAuth();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const navigate = useNavigate();

  const isDeletingRef = useRef(false);
  const targetUid = currentUser?.uid || currentUser?.id || currentUser?.clerkUser?.id;

  useEffect(() => {
    if (!invoiceId) return;

    setLoading(true);
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
    Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Unpaid: "bg-rose-50 text-rose-700 border-rose-200",
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
  };

  if (loading || isDeleting) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">
            {isDeleting ? "Deleting invoice..." : "Loading invoice details..."}
          </p>
        </div>
      </div>
    );
  }

  if (!invoice && !isDeletingRef.current) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-slate-600 font-bold text-lg">
          Invoice not found or deleted
        </div>
        <button
          onClick={() => navigate("/invoice", { replace: true })}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition shadow-sm"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  const totalAmount = invoice?.total_price || 0;
  const subtotal = totalAmount / 1.18;
  const taxAmount = totalAmount - subtotal;

  // Handles the update transaction locally inside the component
  async function handleMarkAsPaid() {
    try {
      await updateInvoiceStatusAndDueDate(invoiceId, "Paid", "", null, targetUid);
      toast.success("Invoice status updated to Paid");
    } catch (error) {
      toast.error(error?.message || "Failed to update status");
      console.error("Database update transaction failed:", error);
    }
  }

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



  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. Control Toolbar — Completely invisible during native printing */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-[22px] border border-slate-200 shadow-sm print:hidden">
        <button
          onClick={() => navigate("/invoice")}
          title="Back to invoices"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Delete Action */}
          <button
            onClick={() => setShowDeleteModal(true)}
            title="Delete Invoice"
            className="p-2.5 text-rose-600 bg-white border border-slate-200 rounded-xl hover:bg-rose-50 hover:border-rose-200 transition shadow-sm"
          >
            <HiOutlineTrash className="w-5 h-5" />
          </button>

          {/* Print Action */}
          <button
            onClick={() => window.print()}
            title="Print Invoice"
            className="p-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm"
          >
            <HiOutlinePrinter className="w-5 h-5" />
          </button>

          {/* Edit Routing */}
          <Link
            to={`/invoice/update/${invoiceId}`}
            title="edit invoice"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm"
          >
            <HiOutlinePencil className="w-4 h-4" />
          </Link>

          {invoice?.status !== "Paid" && (
            <button
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition shadow-sm"
              title="Paid you bill"
              onClick={handleMarkAsPaid}
            >
              <HiOutlineCheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <ConfirmDeleteModal
          onClose={() => setShowDeleteModal(false)}
          type="invoice"
          onConfirm={handleDeleteInvoice}
        />
      )}


      {/* 2. Main Printable Invoice Canvas */}
      <div className="bg-white rounded-[22px] border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Top Header Details Area */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              Tax Invoice
            </div>
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-2xl font-black text-slate-900">
                {invoice?.invoice_no}
              </h1>
              <span className="text-xl font-bold text-slate-400">/</span>
              <div className="text-xl font-extrabold text-indigo-600 tabular-nums">
                ₹
                {Number(totalAmount).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md border shadow-sm ${statusColors[invoice?.status] || "bg-slate-100"}`}
            >
              {invoice?.status}
            </span>
            {invoice?.payment_type && (
              <span className="ml-2 text-xs text-slate-400 font-medium">
                via {invoice.payment_type}
              </span>
            )}
          </div>
          <div className="sm:text-right text-xs sm:text-sm text-slate-500 space-y-1 w-full sm:w-auto">
            <div>
              <span className="font-semibold text-slate-700">Issue Date:</span>{" "}
              {dateFormat(invoice?.invoice_date)
                ? dateFormat(invoice.invoice_date).split(",")[0]
                : invoice?.invoice_date || "N/A"}
            </div>
            {invoice?.status === "Paid" && invoice?.paid_date ? (
              <div>
                <span className="font-semibold text-emerald-700">Paid Date:</span>{" "}
                {dateFormat(invoice.paid_date)
                  ? dateFormat(invoice.paid_date).split(",")[0]
                  : invoice.paid_date}
              </div>
            ) : (
              <div>
                <span className="font-semibold text-amber-700">
                  {invoice?.status === "Unpaid" ? "Due Date:" : "Expected Date:"}
                </span>{" "}
                {dateFormat(invoice?.due_date)
                  ? dateFormat(invoice.due_date).split(",")[0]
                  : invoice?.due_date ||
                    (dateFormat(invoice?.invoice_date)
                      ? dateFormat(invoice.invoice_date).split(",")[0]
                      : "N/A")}
              </div>
            )}
          </div>
        </div>

        {/* Billed Stack Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm border-b border-slate-50 pb-8">
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
              Billed From (Sender)
            </h3>
            <div className="font-extrabold text-slate-800 text-base">
              Invomora Solutions Private Limited
            </div>
            <p className="text-slate-500 leading-relaxed max-w-md">
              123 Innovation Hub, Electronic City, Phase 1, Bengaluru, KA,
              560100
            </p>
            <div className="text-slate-400 text-xs pt-1">
              billing@invomora.com • +91 80 4433 2211
            </div>
          </div>
          <div className="space-y-2 md:text-right md:justify-items-end">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
              Billed To (Client)
            </h3>
            <div className="font-extrabold text-slate-800 text-base capitalize">
              {invoice?.client?.name || invoice?.client?.full_name || "N/A"}
            </div>
            {invoice?.client?.address && (
              <p className="text-slate-500 leading-relaxed max-w-md md:ml-auto">
                {invoice.client.address}
              </p>
            )}
            <div className="text-slate-400 text-xs pt-1">
              {invoice?.client?.email}{" "}
              {invoice?.client?.email &&
                (invoice?.client?.phone || invoice?.client?.phone_number) &&
                "•"}{" "}
              {invoice?.client?.phone || invoice?.client?.phone_number}
            </div>
          </div>
        </div>

        {/* Line Items Table View */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50/70 border-b border-slate-100 font-bold">
              <tr>
                <th scope="col" className="px-4 py-3.5">
                  Item Description
                </th>
                <th scope="col" className="px-4 py-3.5 text-center w-20">
                  Qty
                </th>
                <th scope="col" className="px-4 py-3.5 text-right w-32">
                  Rate
                </th>
                <th scope="col" className="px-4 py-3.5 text-right w-32">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {invoice?.items?.map((item, index) => {
                const itemRate = Number(item.price || 0).toFixed(2);
                const itemQuantity = Number(item.quantity || 1);
                const itemTotal = Number(itemRate * itemQuantity).toFixed(2);

                return (
                  <tr
                    key={item.id || index}
                    className="text-slate-700 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {item.title}
                    </td>
                    <td className="px-4 py-4 text-center tabular-nums">
                      {itemQuantity}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums">
                      ₹
                      {itemRate.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-slate-900 tabular-nums">
                      ₹
                      {itemTotal.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Breakdown Summary */}
        <div className="space-y-6 pt-4">
          <div className="flex justify-end">
            <div className="w-full sm:w-72 space-y-3 text-sm text-slate-500 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold tabular-nums text-slate-800">
                  ₹{Number(subtotal).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax (GST 18%)</span>
                <span className="font-semibold tabular-nums text-slate-800">
                  ₹{Number(taxAmount).toFixed(2)}
                </span>
              </div>
              <div className="border-t border-slate-200/60 my-1"></div>
              <div className="flex justify-between text-base font-black text-slate-900">
                <span>Total Amount</span>
                <span className="tabular-nums text-indigo-600">
                  ₹{Number(totalAmount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes & Clauses — Fully Branded for Your Business */}
          <div className="border-t border-slate-100 pt-6 space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Notes & Clauses:
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Thank you for your business. Please process the payment within the
              due date.
            </p>
            <p className="text-xs text-slate-400 italic">
              * This is a computer-generated invoice from Invomora and does not
              require a physical signature.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
