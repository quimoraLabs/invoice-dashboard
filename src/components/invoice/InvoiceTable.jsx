import React from "react";
import InvoiceTableRow from "./InvoiceTableRow";

function InvoiceTable({ invoices, onDelete, onMarkPaid, onView }) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No invoices found.</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3">
              Invoice #
            </th>
            <th scope="col" className="px-6 py-3">
              Client
            </th>
            <th scope="col" className="px-6 py-3">
              Date
            </th>
            <th scope="col" className="px-6 py-3">
              Amount
            </th>
            <th scope="col" className="px-6 py-3">
              Status
            </th>
            <th scope="col" className="px-6 py-3">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <InvoiceTableRow
              key={invoice.id}
              invoice={invoice}
              onDelete={onDelete}
              onMarkPaid={onMarkPaid}
              onView={onView}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InvoiceTable;