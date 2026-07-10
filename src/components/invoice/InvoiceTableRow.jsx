import React from "react";
import { Link } from "react-router-dom";
import { dateFormat } from "../helper";

const statusColorMap = {
  Paid: "bg-green-100 text-green-800",
  Unpaid: "bg-red-100 text-red-800",
  Pending: "bg-yellow-100 text-yellow-800",
};

function InvoiceTableRow({
  invoice,
  onDelete,
  onMarkPaid,
  onView,
}) {
  const statusClasses =
    statusColorMap[invoice.status] || "bg-gray-100 text-gray-800";

  return (
    <tr className="bg-white border-b hover:bg-gray-50">
      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
        <Link to={`/invoice/${invoice.id}`} className="text-indigo-600 hover:underline">
          {invoice.invoice_no || "INV-00"}
        </Link>
      </td>
      <td className="px-6 py-4">{invoice.client.name || "Client Name"}</td>
      <td className="px-6 py-4">{dateFormat(invoice.invoice_date)}</td>
      <td className="px-6 py-4">₹{Number(invoice.total_price).toFixed(2)}</td>
      <td className="px-6 py-4">
        <span
          className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusClasses}`}
        >
          {invoice.status}
        </span>
      </td>
      <td className="px-6 py-4 flex items-center gap-4 text-sm">
        <button
          onClick={() => onView(invoice)}
          className="font-medium text-blue-600 hover:underline"
        >
          View
        </button>
        <Link
          to={`/invoice/edit/${invoice.id}`}
          className="font-medium text-indigo-600 hover:underline"
        >
          Edit
        </Link>
        {invoice.status !== "Paid" && (
          <button
            onClick={() => onMarkPaid(invoice.id)}
            className="font-medium text-green-600 hover:underline"
          >
            Mark Paid
          </button>
        )}
        <button
          onClick={() => onDelete(invoice)}
          className="font-medium text-red-600 hover:underline"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

export default InvoiceTableRow;