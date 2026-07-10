import React from "react";
import { FaTimes } from "react-icons/fa";

function InvoiceFilters({
  filter,
  setFilter,
  searchTerm,
  setSearchTerm,
  resetFilters,
}) {
  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Search Bar */}
        <div className="relative md:col-span-1">
          <input
            type="text"
            placeholder="Search by name or invoice #"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-2 md:col-span-2 justify-start md:justify-end">
          {["All", "Paid", "Unpaid", "Pending"].map((status) => (
            <button
              key={status}
              className={`px-4 py-2 text-sm font-medium rounded-full border transition-colors duration-200 ${
                filter === status
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
              onClick={() => setFilter(status)}
            >
              {status}
            </button>
          ))}
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export default InvoiceFilters;