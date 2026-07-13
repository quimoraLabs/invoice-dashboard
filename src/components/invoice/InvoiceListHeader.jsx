import React from "react";
import { HiPlus } from "react-icons/hi";
import { Link } from "react-router-dom";

function InvoiceListHeader() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          Invoice Ledger
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Audit billing items, track due dates, issue drafts, and collect
          payments.
        </p>
      </div>
      <Link
        to="/invoice/create"
        className="inline-flex items-center justify-center rounded-xl bg-indigo-600 p-3 text-white shadow-md shadow-indigo-100 dark:shadow-none transition-all hover:bg-indigo-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <HiPlus/>
      </Link>
    </div>
  );
}

export default InvoiceListHeader;
