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

import { useAuth } from "../../contexts/authContext/useAuth";

const statusColorMap = {
  Paid: "bg-success-muted text-success border-success/30",
  Unpaid: "bg-danger-muted text-danger border-danger/30",
  Pending: "bg-warning-muted text-warning border-warning/30",
};

function InvoiceTableRow({ invoice }) {
  const { currentUser } = useAuth();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const targetUid = currentUser?.uid || currentUser?.id || currentUser?.clerkUser?.id;

  const statusClasses =
    statusColorMap[invoice.status] ||
    "bg-surface text-muted-foreground border-border";

  const onView = () => {
    navigate(`/invoice/view/${invoice.id}`);
  };

  const onEdit = () => {
    navigate(`/invoice/update/${invoice.id}`);
  };

  async function handleDeleteInvoice() {
    try {
      await deleteInvoice(invoice.id, null, targetUid);
      toast.success("Invoice deleted successfully");
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error(error?.message || "Failed to delete invoice");
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
        targetUid,
      );
      toast.success(`Invoice status updated to ${status}`);
    } catch (error) {
      toast.error(error?.message || "Failed to update status");
      console.error("Database update transaction failed:", error);
    }
  };

  return (
    <>
      <tr className="border-b border-border bg-surface-elevated hover:bg-surface transition duration-200">
        {/* Invoice ID */}
        <td className="px-4 py-4 font-semibold text-foreground whitespace-nowrap sm:px-6">
          <Link
            to={`/invoice/view/${invoice.id}`}
            className="text-primary hover:opacity-80 transition-colors font-semibold"
          >
            {invoice.invoiceNumber || invoice.invoice_no || "INV-00"}
          </Link>
        </td>

        {/* Client Name */}
        <td className="hidden sm:table-cell px-6 py-4 text-foreground font-medium">
          {invoice.client?.name || invoice.client?.full_name || "Client Name"}
        </td>

        {/* Date Column */}
        <td className="hidden md:table-cell px-6 py-4 text-muted-foreground">
          <div className="text-sm font-medium text-foreground">
            {dateFormat(invoice.invoiceDate || invoice.invoice_date)?.split(",")[0] || "N/A"}
          </div>
        </td>

        {/* Amount */}
        <td className="px-4 py-4 text-right font-semibold text-foreground tabular-nums whitespace-nowrap sm:px-6">
          ₹
          {Number(invoice.totalAmount ?? invoice.total_price ?? 0).toLocaleString("en-IN", {
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
