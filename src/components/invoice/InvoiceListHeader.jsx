import React from "react";
import { Link } from "react-router-dom";

function InvoiceListHeader() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Invoices</h1>
      <Link
        to="/invoice/create"
        className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-md shadow-md hover:scale-105 transition-transform duration-200 ease-in-out"
      >
        + New Invoice
      </Link>
    </div>
  );
}

export default InvoiceListHeader;