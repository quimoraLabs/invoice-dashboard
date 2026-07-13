import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
// Firebase actions
import {
  deleteInvoice,
  updateInvoiceStatusAndDueDate,
} from "../../firebase/invoice";
// React Icons
import {
  HiEllipsisVertical,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineCheckCircle,
  HiOutlineTrash,
} from "react-icons/hi2";
import ConfirmDeleteModal from "../modals/ConfirmDeleteModal";

export default function InvoiceRowActionsMenu({ invoice }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // BUG FIXED: State variable & setter naming correctly configured
  const menuRef = useRef(null);

  // Closes the menu dynamically when clicking outside of the active area
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handles the update transaction locally inside the component
  async function handleMarkAsPaid() {
    try {
      await updateInvoiceStatusAndDueDate(invoice.id);
      toast.success("Invoice status updated to Paid");
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to update status");
      console.error("Database update transaction failed:", error);
    }
  }

  // Handles the delete transaction safely
  async function handleDeleteInvoice() {
    try {
      await deleteInvoice(invoice.id);
      toast.success("Invoice deleted successfully");
      setIsDeleteModalOpen(false); // BUG FIXED: Called correct state setter function
    } catch (error) {
      toast.error("Failed to delete invoice");
      console.error("Error executing dynamic backend deletion:", error);
    }
  }

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger button display layout */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700 cursor-pointer"
      >
        <HiEllipsisVertical className="h-5 w-5" />
      </button>

      {/* Action overlay dropdown configuration */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 z-40 rounded-xl border border-slate-100 bg-white p-1 shadow-lg ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-100">
          {/* View Link: Dynamic routing with ID */}
          <Link
            to={`/invoice/view/${invoice.id}`}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition"
          >
            <HiOutlineEye className="h-4 w-4" />
            <span>View Details</span>
          </Link>

          {/* Edit Link: Dynamic routing with ID */}
          <Link
            to={`/invoice/update/${invoice.id}`}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition"
          >
            <HiOutlinePencil className="h-4 w-4" />
            <span>Edit Invoice</span>
          </Link>

          {/* Conditional implementation for Mark Paid */}
          {invoice.status !== "Paid" && (
            <button
              onClick={handleMarkAsPaid}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition cursor-pointer"
            >
              <HiOutlineCheckCircle className="h-4 w-4" />
              <span>Mark as Paid</span>
            </button>
          )}

          <div className="my-1 border-t border-slate-100"></div>

          {/* Delete Action Trigger */}
          <button
            onClick={() => {
              setIsDeleteModalOpen(true); // BUG FIXED: Trigger correct function
              setIsOpen(false); // Menu ko close kar diya taaki dono ek sath open na rahein
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          >
            <HiOutlineTrash className="h-4 w-4" />
            <span>Delete Invoice</span>
          </button>
        </div>
      )}

      {/* BUG FIXED: Modal code isolated outside the dropdown state scope */}
      {isDeleteModalOpen && (
        <ConfirmDeleteModal
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteInvoice}
          type="invoice"
        />
      )}
    </div>
  );
}
