import React, { useState, useEffect } from "react";
import { deleteCustomer, listenToCustomers } from "../../firebase/customer";
import ConfirmDeleteModal from "../../components/modals/ConfirmDeleteModal";
import CustomerModal from "../../components/modals/CustomerForm";
import toast from "react-hot-toast";
import {
  HiChevronLeft,
  HiChevronRight,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiSearch,
  HiPlus,
} from "react-icons/hi";
import CustomerViewModal from "../../components/modals/CustomerViewModal";

const ITEMS_PER_PAGE = 10;

export default function CustomerDashboard() {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [viewMode, setViewMode] = useState("list");

  useEffect(() => {
    const unsubscribe = listenToCustomers(setCustomers);
    return () => unsubscribe();
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    const query = searchTerm.toLowerCase();
    if (!query) return true;
    return [
      customer.full_name,
      customer.email,
      customer.phone_number,
      customer.address,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  console.log("Filtered Customers:", filteredCustomers);

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCustomers = filteredCustomers.slice(
    startIdx,
    startIdx + ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  function handleView(customer) {
    setSelectedCustomer(customer);
    setViewMode("detail");
  }

  function handleEdit(customer) {
    setSelectedCustomer(customer);
    setIsOpen(true);
  }

  function handleCloseModal() {
    setIsOpen(false);
    setSelectedCustomer(null);
  }

  function handleCloseDeleteModal() {
    setIsDeleteMode(false);
    setSelectedCustomer(null);
  }

  function handleOpenDeleteModal(customer) {
    setIsDeleteMode(true);
    setSelectedCustomer(customer);
  }

  async function handleDelete() {
    try {
      await deleteCustomer(selectedCustomer.id);
      handleCloseDeleteModal();
      toast.success("Customer deleted successfully");
    } catch (error) {
      toast.error("Error deleting customer");
      console.error("Error deleting customer:", error);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex gap-4 items-center justify-between">
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Customer records
          </h1>
          <button
            onClick={() => {
              setSelectedCustomer(null);
              setIsOpen(true);
            }}
            className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 flex items-center justify-center gap-2"
          >
            Add customer
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <label className="relative block">
            <HiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customers by name, email, or phone"
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
            />
          </label>
        </div>

        {/* Table */}
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
                {paginatedCustomers.length > 0 ? (
                  paginatedCustomers.map((customer) => (
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
                              {(customer.full_name || "C")
                                .charAt(0)
                                .toUpperCase()}
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
                      <td className="px-4 py-4 text-right sm:px-6">
                        <div className="flex justify-end gap-2">
                          <HiOutlineEye
                            onClick={() => handleView(customer)}
                            className="cursor-pointer text-blue-300 hover:text-blue-600"
                          />
                          <HiOutlinePencil
                            onClick={() => handleEdit(customer)}
                            className="cursor-pointer text-green-300 hover:text-green-600"
                          />

                          <HiOutlineTrash
                            onClick={() => handleOpenDeleteModal(customer)}
                            className="cursor-pointer text-red-300 hover:text-red-600"
                          />
                        </div>
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
                {Math.min(startIdx + ITEMS_PER_PAGE, filteredCustomers.length)}{" "}
                of {filteredCustomers.length}
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
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 transition disabled:opacity-50 hover:bg-slate-50"
                >
                  <HiChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail View Modal */}
      {viewMode === "detail" && selectedCustomer && (
        <CustomerViewModal
          selectedCustomer={selectedCustomer}
          setViewMode={setViewMode}
          handleEdit={handleEdit}
        />
      )}

      {/* Edit Modal */}
      {isOpen && (
        <CustomerModal onClose={handleCloseModal} customer={selectedCustomer} />
      )}

      {/* Delete Modal */}
      {isDeleteMode && (
        <ConfirmDeleteModal
          onClose={handleCloseDeleteModal}
          type="customer"
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
