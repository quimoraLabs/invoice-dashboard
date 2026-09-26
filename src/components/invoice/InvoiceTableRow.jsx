import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { dateFormat } from "../helper";
import RowActionsMenu from "../ActionMenu";
import {
  deleteInvoice,
  updateInvoiceStatusAndDueDate,
} from "../../firebase/invoice";
import toast from "react-hot-toast";
import ConfirmDeleteModal from "../modals/ConfirmDeleteModal";
import UpdateStatusModal from "../invoice/UpdateStatusModal"; // Headless UI Modal

const statusColorMap = {
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Unpaid: "bg-rose-50 text-rose-700 border-rose-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
};

function InvoiceTableRow({ invoice }) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const statusClasses =
    statusColorMap[invoice.status] ||
    "bg-gray-50 text-gray-700 border-gray-200";

  const onView = () => {
    navigate(`/invoice/view/${invoice.id}`);
  };

  const onEdit = () => {
    navigate(`/invoice/update/${invoice.id}`);
  };

  async function handleDeleteInvoice() {
    try {
      await deleteInvoice(invoice.id);
      toast.success("Invoice deleted successfully");
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error("Failed to delete invoice");
      console.error("Error executing dynamic backend deletion:", error);
    }
  }

  // Handler to update status with selected method from modal
  const handleUpdateStatus = async ({ status, paymentMethod }) => {
    try {
      await updateInvoiceStatusAndDueDate(
        invoice.id,
        status,
        paymentMethod,
        setLoading,
      );
      toast.success(`Invoice status updated to ${status}`);
    } catch (error) {
      toast.error("Failed to update status");
      console.error("Database update transaction failed:", error);
    }
  };

  return (
    <>
      <tr className="border-b border-slate-100 bg-white hover:bg-slate-50 transition duration-200">
        {/* Invoice ID */}
        <td className="px-4 py-4 font-semibold text-slate-900 whitespace-nowrap sm:px-6">
          <Link
            to={`/invoice/view/${invoice.id}`}
            className="text-indigo-600 hover:text-indigo-800 transition-colors font-semibold"
          >
            {invoice.invoice_no || "INV-00"}
          </Link>
        </td>

        {/* Client Name */}
        <td className="hidden sm:table-cell px-6 py-4 text-slate-900 font-medium">
          {invoice.client?.full_name || invoice.client?.name || "Client Name"}
        </td>

        {/* Date Column */}
        <td className="hidden md:table-cell px-6 py-4 text-slate-600">
          <div className="text-sm font-medium text-slate-800">
            {dateFormat(invoice.invoice_date)?.split(",")[0] || "N/A"}
          </div>
        </td>

        {/* Amount */}
        <td className="px-4 py-4 text-right font-semibold text-slate-900 tabular-nums whitespace-nowrap sm:px-6">
          ₹
          {Number(invoice.total_price).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </td>

        {/* Status Badge (Click opens the Update Status Modal) */}
        <td className="px-4 py-4 text-center sm:px-6">
          <button
            type="button"
            onClick={() => setIsStatusModalOpen(true)}
            disabled={loading}
            className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md border shadow-sm transition-transform active:scale-95 cursor-pointer hover:opacity-80 ${statusClasses}`}
          >
            {loading ? "Updating..." : invoice.status}
          </button>
        </td>

        {/* Actions */}
        <td className="px-4 py-4 whitespace-nowrap text-right sm:px-6">
          <RowActionsMenu
            data={invoice}
            onView={onView}
            onDelete={() => setIsDeleteModalOpen(true)}
            onEdit={onEdit}
          />
        </td>
      </tr>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <ConfirmDeleteModal
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteInvoice}
          type="invoice"
        />
      )}

      {/* Update Status Headless UI Modal */}
      {isStatusModalOpen && (
        <UpdateStatusModal
          isOpen={isStatusModalOpen}
          setIsOpen={setIsStatusModalOpen}
          invoice={invoice}
          onSave={handleUpdateStatus}
        />
      )}
    </>
  );
}

export default InvoiceTableRow;
