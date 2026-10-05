import React, { useState, useEffect } from "react";
import { deleteCustomer, listenToCustomers } from "../../firebase/customer";
import { useAuth } from "../../contexts/authContext/useAuth";
import ConfirmDeleteModal from "../../components/modals/ConfirmDeleteModal";
import CustomerModal from "../../components/customer/CustomerForm";
import CustomerViewModal from "../../components/customer/CustomerViewModal";
import toast from "react-hot-toast";
import Loader from "../../components/Loader";

// Sub-components Imports
import DashboardHeader from "../../components/customer/CustomerHeader";
import CustomerControlBar from "../../components/customer/CustomerControlBar";
import CustomerTable from "../../components/customer/CustomerTable";

const ITEMS_PER_PAGE = 10;

export default function CustomerDashboard() {
  const { currentUser } = useAuth();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [loading, setLoading] = useState(false);

  const targetUid = currentUser?.uid || currentUser?.id || currentUser?.clerkUser?.id;

  useEffect(() => {
    if (!targetUid) return;
    setLoading(true);
    const unsubscribe = listenToCustomers((data) => {
      setCustomers(data);
      setLoading(false);
    }, targetUid);
    return () => unsubscribe();
  }, [targetUid]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy]);

  // Search Logic
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

  // Sort the filtered array
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortBy === "name-asc") {
      return (a.full_name || "").localeCompare(b.full_name || "");
    }
    if (sortBy === "name-desc") {
      return (b.full_name || "").localeCompare(a.full_name || "");
    }

    if (sortBy === "newest") {
      const timeA = a.created_at?.toDate
        ? a.created_at.toDate().getTime()
        : a.created_at?.seconds || 0;
      const timeB = b.created_at?.toDate
        ? b.created_at.toDate().getTime()
        : b.created_at?.seconds || 0;
      return timeB - timeA;
    }
    if (sortBy === "oldest") {
      const timeA = a.created_at?.toDate
        ? a.created_at.toDate().getTime()
        : a.created_at?.seconds || 0;
      const timeB = b.created_at?.toDate
        ? b.created_at.toDate().getTime()
        : b.created_at?.seconds || 0;
      return timeA - timeB;
    }
    return 0;
  });

  // Pagination Variables
  const totalPages = Math.ceil(sortedCustomers.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCustomers = sortedCustomers.slice(
    startIdx,
    startIdx + ITEMS_PER_PAGE,
  );

  // Modal Handlers
  const handleAddClick = () => {
    setSelectedCustomer(null);
    setIsOpen(true);
  };
  const handleView = (customer) => {
    setSelectedCustomer(customer);
    setViewMode("detail");
  };
  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setIsOpen(true);
  };
  const handleOpenDelete = (customer) => {
    setIsDeleteMode(true);
    setSelectedCustomer(customer);
  };

  async function handleDelete() {
    try {
      await deleteCustomer(selectedCustomer.id, null, targetUid);
      setIsDeleteMode(false);
      setSelectedCustomer(null);
      toast.success("Customer deleted successfully");
    } catch (error) {
      toast.error(error?.message || "Error deleting customer");
      console.error(error);
    }
  }

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* 1. Header Component */}
        <DashboardHeader onAddClick={handleAddClick} />

        {/* 2. Search Component */}
        <CustomerControlBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />

        {/* 3. Table & Pagination Component */}
        <CustomerTable
          customers={paginatedCustomers}
          totalPages={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          startIdx={startIdx}
          itemsPerPage={ITEMS_PER_PAGE}
          totalCount={sortedCustomers.length}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleOpenDelete}
        />
      </div>

      {/* Modals */}
      {viewMode === "detail" && selectedCustomer && (
        <CustomerViewModal
          selectedCustomer={selectedCustomer}
          setViewMode={setViewMode}
          handleEdit={handleEdit}
        />
      )}
      {isOpen && (
        <CustomerModal
          onClose={() => {
            setIsOpen(false);
            setSelectedCustomer(null);
          }}
          customer={selectedCustomer}
        />
      )}
      {isDeleteMode && (
        <ConfirmDeleteModal
          onClose={() => {
            setIsDeleteMode(false);
            setSelectedCustomer(null);
          }}
          type="customer"
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
