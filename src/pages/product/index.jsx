import React, { useState, useEffect, useMemo } from "react";
import { deleteProduct, listenToProducts } from "../../firebase/product";
import ProductModal from "../../components/modals/ProductForm";
import toast from "react-hot-toast";
import ConfirmDeleteModal from "../../components/modals/ConfirmDeleteModal";
import {
  HiPlus,
  HiChevronDown,
  HiOutlinePencil,
  HiOutlineTrash,
  HiSearch,
  HiFilter,
} from "react-icons/hi";

function ProductsDashboard() {
  // State for raw products from Firebase
  const [products, setProducts] = useState([]);

  // State for modals and selected product
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // State for controls
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("name-asc");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Subscribe to product data from Firebase on component mount
  useEffect(() => {
    const unsubscribe = listenToProducts(setProducts);
    return () => unsubscribe();
  }, []);

  // Memoized list of unique categories for the filter dropdown
  const categories = useMemo(() => {
    const uniqueCategories = new Set(products.map((p) => p.category));
    return ["all", ...Array.from(uniqueCategories)];
  }, [products]);

  // Memoized and derived state for filtered and sorted products
  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesSearch =
          product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
          categoryFilter === "all" || product.category === categoryFilter;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        switch (sortOrder) {
          case "price-asc":
            return a.price - b.price;
          case "price-desc":
            return b.price - a.price;
          case "name-asc":
            return a.title.localeCompare(b.title);
          case "name-desc":
            return b.title.localeCompare(a.title);
          default:
            return 0;
        }
      });
  }, [products, searchQuery, sortOrder, categoryFilter]);

  // --- Modal Handlers ---

  function handleOpenProductModal(product = null) {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  }

  function handleCloseProductModal() {
    setIsProductModalOpen(false);
    setSelectedProduct(null);
  }

  function handleOpenDeleteModal(product) {
    setSelectedProduct(product);
    setDeleteModalOpen(true);
  }

  function handleCloseDeleteModal() {
    setDeleteModalOpen(false);
    setSelectedProduct(null);
  }

  // --- CRUD Handlers ---
  async function handleDelete() {
    if (!selectedProduct) return;
    try {
      await deleteProduct(selectedProduct.id);
      handleCloseDeleteModal();
      toast.success("Product deleted successfully");
    } catch (error) {
      toast.error("Error in deleting product");
      console.log(error);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
          Product Dashboard
        </h1>
        <button
          onClick={() => handleOpenProductModal()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          <HiPlus size={18} className="hidden sm:block" />
          Add Product
        </button>
      </div>

      {/* Control Bar */}
      <div className="mb-6 flex items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-grow">
          <HiSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-indigo-600"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <HiFilter
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
          >
            {categories.map((category) => (
              <option key={category} value={category} className="capitalize">
                {category === "all" ? "All Categories" : category}
              </option>
            ))}
          </select>
          <HiChevronDown
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
          >
            <option value="name-asc">Name: A-Z</option>
            <option value="name-desc">Name: Z-A</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
          <HiChevronDown
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-100 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Product
                </th>
                <th scope="col" className="px-6 py-3">
                  Price
                </th>
                <th scope="col" className="px-6 py-3 hidden md:table-cell">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedProducts.map((item) => (
                <tr
                  key={item.id}
                  className="border-b bg-white transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img
                        className="h-12 w-12 rounded-md object-cover"
                        src={item.imageUrl}
                        alt={item.title}
                      />
                      <div>
                        <div className="max-w-xs truncate font-semibold text-gray-900 dark:text-white">
                          {item.title}
                        </div>
                        <div className="max-w-xs truncate text-gray-500 dark:text-gray-400">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white whitespace-nowrap">
                    ₹{Number(item.price).toFixed(2)}
                  </td>
                  <td className="hidden px-6 py-4 md:table-cell">
                    <span className="inline-block rounded-full bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 capitalize">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenProductModal(item)}
                        className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700 dark:hover:text-indigo-400"
                        aria-label="Update product"
                      >
                        <HiOutlinePencil size={18} />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(item)}
                        className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400"
                        aria-label="Delete product"
                      >
                        <HiOutlineTrash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isProductModalOpen && (
        <ProductModal
          onClose={handleCloseProductModal}
          product={selectedProduct}
        />
      )}
      {isDeleteModalOpen && (
        <ConfirmDeleteModal
          onClose={handleCloseDeleteModal}
          type="product"
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

export default ProductsDashboard;
