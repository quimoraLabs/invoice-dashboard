import React from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import CustomerActionsMenu from "../ActionMenu";

export default function CustomerTable({
  customers,
  totalPages,
  currentPage,
  setCurrentPage,
  startIdx,
  itemsPerPage,
  totalCount,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 sm:px-6">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 sm:px-6">
                Email
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold text-slate-700 md:table-cell md:px-6">
                Phone
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 sm:px-6">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {customers.length > 0 ? (
              customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition"
                >
                  <td className="px-4 py-4 text-sm text-slate-900 font-medium sm:px-6">
                    <div className="flex items-center gap-3">
                      {customer.profile ? (
                        <img
                          src={customer.profile}
                          alt={customer.full_name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                          {(customer.full_name || "C").charAt(0).toUpperCase()}
                        </div>
                      )}
                      {customer.full_name}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600 sm:px-6">
                    {customer.email || "—"}
                  </td>
                  <td className="hidden px-4 py-4 text-sm text-slate-600 md:table-cell md:px-6">
                    {customer.phone_number || "—"}
                  </td>
                  <td className="px-4 py-4 text-right sm:px-6 relative">
                    <CustomerActionsMenu
                      data={customer}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onView={onView}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="px-4 py-8 text-center text-sm text-slate-500 sm:px-6"
                >
                  No customers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-4 sm:px-6">
          <p className="text-sm text-slate-600">
            Showing {startIdx + 1} to{" "}
            {Math.min(startIdx + itemsPerPage, totalCount)} of {totalCount}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition disabled:opacity-50 hover:bg-slate-50"
            >
              <HiChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                      page === currentPage
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition disabled:opacity-50 hover:bg-slate-50"
            >
              <HiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
