import React from "react";
import { Link } from "react-router-dom";
import { dateFormat } from "../helper";
import InvoiceRowActionsMenu from "./InvoiceTableRowActionsMenu";

// Restored the accurate status color mapping configuration
const statusColorMap = {
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Unpaid: "bg-rose-50 text-rose-700 border-rose-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
};

function InvoiceTableRow({ invoice }) {
  const statusClasses =
    statusColorMap[invoice.status] || "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <tr className="border-b border-slate-100 bg-white hover:bg-slate-50 transition duration-200">
      {/* Invoice ID */}
      <td className="px-4 py-4 font-semibold text-slate-900 whitespace-nowrap sm:px-6">
        <Link to={`/invoice/${invoice.id}`} className="text-indigo-600 hover:text-indigo-800 transition-colors">
          {invoice.invoice_no || "INV-00"}
        </Link>
      </td>

      {/* Client Name (Responsive: hidden on mobile) */}
      <td className="hidden sm:table-cell px-6 py-4 text-slate-900 font-medium">
        {invoice.client?.name || "Client Name"}
      </td>

      {/* Date Column (Responsive: hidden on mobile/tablet, only date part before comma displayed) */}
      <td className="hidden md:table-cell px-6 py-4 text-slate-600">
        <div className="text-sm font-medium text-slate-800">
          {dateFormat(invoice.invoice_date)?.split(",")[0] || "N/A"}
        </div>
      </td>

      {/* Amount (Right Aligned - Keep visible on mobile) */}
      <td className="px-4 py-4 text-right font-semibold text-slate-900 tabular-nums whitespace-nowrap sm:px-6">
        ₹{Number(invoice.total_price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>

      {/* Status Badge (Centered - Keep visible on mobile) */}
      <td className="px-4 py-4 text-center sm:px-6">
        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md border shadow-sm ${statusClasses}`}>
          {invoice.status}
        </span>
      </td>

      {/* Actions (Dropdown Menu - Keep visible on mobile) */}
      <td className="px-4 py-4 whitespace-nowrap text-right sm:px-6">
        <InvoiceRowActionsMenu 
          invoice={invoice} 
        />
      </td>
    </tr>
  );
}

export default InvoiceTableRow;