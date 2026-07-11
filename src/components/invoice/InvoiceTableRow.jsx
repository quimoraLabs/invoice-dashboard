import React from "react";
import { Link } from "react-router-dom";
import { dateFormat } from "../helper";
import { 
  HiOutlineTrash, 
  HiOutlinePencil, 
  HiOutlineEye, 
  HiOutlineCheckCircle 
} from "react-icons/hi2";

const statusColorMap = {
  Paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Unpaid: "bg-rose-50 text-rose-700 border border-rose-200",
  Pending: "bg-amber-50 text-amber-700 border border-amber-200",
};

function InvoiceTableRow({ invoice, onDelete, onMarkPaid, onView }) {
  const statusClasses =
    statusColorMap[invoice.status] || "bg-gray-50 text-gray-700 border border-gray-200";

  return (
    <tr className="bg-white border-b border-gray-100 hover:bg-slate-50/80 transition-colors duration-200">
      {/* Invoice ID */}
      <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
        <Link to={`/invoice/${invoice.id}`} className="text-indigo-600 hover:text-indigo-800 transition-colors">
          {invoice.invoice_no || "INV-00"}
        </Link>
      </td>

      {/* Client Name */}
      <td className="px-6 py-4 text-slate-600 font-medium">{invoice.client?.name || "Client Name"}</td>

      {/* Date */}
      <td className="px-6 py-4 text-slate-500 text-sm">{dateFormat(invoice.invoice_date)}</td>

      {/* Amount */}
      <td className="px-6 py-4 font-semibold text-slate-800">
        ₹{Number(invoice.total_price).toFixed(2)}
      </td>

      {/* Status Badge */}
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md shadow-sm ${statusClasses}`}>
          {invoice.status}
        </span>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          {/* View Button */}
          <button
            onClick={() => onView(invoice)}
            title="View Invoice"
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
          >
            <HiOutlineEye className="w-5 h-5" />
          </button>

          {/* Edit Button */}
          <Link
            to={`/invoice/edit/${invoice.id}`}
            title="Edit Invoice"
            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
          >
            <HiOutlinePencil className="w-5 h-5" />
          </Link>

          {/* Mark Paid Button (Conditional) */}
          {invoice.status !== "Paid" && (
            <button
              onClick={() => onMarkPaid(invoice.id)}
              title="Mark as Paid"
              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
            >
              <HiOutlineCheckCircle className="w-5 h-5" />
            </button>
          )}

          {/* Delete Button */}
          <button
            onClick={() => onDelete(invoice)}
            title="Delete Invoice"
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
          >
            <HiOutlineTrash className="w-5 h-5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default InvoiceTableRow;