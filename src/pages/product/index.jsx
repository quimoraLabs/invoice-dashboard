import React, { useState, useEffect, useMemo } from "react";
import { deleteProduct, listenToProducts } from "../../firebase/product";
import ProductModal from "../../components/product/ProductForm";
import ProductViewModal from "../../components/product/ProductViewModal";
import toast from "react-hot-toast";
import ConfirmDeleteModal from "../../components/modals/ConfirmDeleteModal";
import { HiPlus } from "react-icons/hi";
import ControlBar from "../../components/product/ControlBar";
import ProductTable from "../../components/product/ProductTable";

function ProductsDashboard() {
  const [products, setProducts] = useState([]);
  
  // The unified modal manager
  const [activeModal, setActiveModal] = useState({ type: null, product: null });

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("name-asc");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    const unsubscribe = listenToProducts(setProducts);
    return () => unsubscribe();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(products.map((p) => p.category));
    return ["all", ...Array.from(uniqueCategories)];
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter((product) => {
        const titleMatch = product.title?.toLowerCase().includes(searchQuery.toLowerCase());
        const descMatch = product.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSearch = titleMatch || descMatch;
        
        const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        switch (sortOrder) {
          case "price-asc":
            return Number(a.price) - Number(b.price);
          case "price-desc":
            return Number(b.price) - Number(a.price);
          case "name-desc":
            return b.title.localeCompare(a.title);
          case "name-asc":
          default:
            return a.title.localeCompare(b.title);
        }
      });
  }, [products, searchQuery, sortOrder, categoryFilter]);

  const closeModal = () => setActiveModal({ type: null, product: null });

  // FIX: Read target ID from activeModal state instead of the old selectedProduct state
  async function handleDelete() {
    const targetProduct = activeModal.product;
    if (!targetProduct?.id) return;
    
    try {
      await deleteProduct(targetProduct.id);
      closeModal();
      toast.success("Product deleted successfully");
    } catch (error) {
      toast.error("Error in deleting product");
      console.error(error);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Product Dashboard
        </h1>
        <button
          onClick={() => setActiveModal({ type: "new", product: null })}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 p-3 text-white shadow-md shadow-indigo-100 dark:shadow-none transition-all hover:bg-indigo-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <HiPlus size={20} />
        </button>
      </div>

      {/* Control Filters */}
      <ControlBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        categories={categories}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />

      {/* Data Table */}
      {/* TRICK/FIX: Pass handlers individually down if your current ProductTable expects onEdit/onDelete */}
      <ProductTable
        products={filteredAndSortedProducts}
        onAction={(type, product) => setActiveModal({ type, product })}
        onEdit={(product) => setActiveModal({ type: "edit", product })}
        onDelete={(product) => setActiveModal({ type: "delete", product })}
        onView={(product) => setActiveModal({ type: "view", product })}
      />

      {/* Dynamic Modal Stack */}
      {activeModal.type === "new" && (
        <ProductModal onClose={closeModal} product={null} />
      )}
      
      {activeModal.type === "edit" && (
        <ProductModal onClose={closeModal} product={activeModal.product} />
      )}
      
      {activeModal.type === "delete" && (
        <ConfirmDeleteModal onClose={closeModal} type="product" onConfirm={handleDelete} />
      )}

      {activeModal.type === "view" && (
        <ProductViewModal onClose={closeModal} product={activeModal.product} />
      )}
    </div>
  );
}

export default ProductsDashboard;