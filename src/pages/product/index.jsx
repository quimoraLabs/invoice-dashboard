import React, { useState, useEffect } from "react";
import { deleteProduct, listenToProducts } from "../../firebase/product";
import ProductModal from "../../components/modals/ProductForm";
import toast from "react-hot-toast";
import ConfirmDeleteModal from "../../components/modals/ConfirmDeleteModal";

function ProductsDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = listenToProducts(setProducts);

    return () => unsubscribe();
  }, []);

  function handleCloseModal() {
    setIsOpen(false);
    setSelectedProduct(null);
  }
  function handleDeleteModalClose() {
    setDeleteModalOpen(false);
    setSelectedProduct(null);
  }

  function handleEdit(product) {
    setIsOpen(true);
    setSelectedProduct(product);
  }

  function handleOpenDeleteModal(product) {
    setDeleteModalOpen(true);
    setSelectedProduct(product);
  }

  async function handleDelete() {
    try {
      await deleteProduct(selectedProduct.id);
      handleDeleteModalClose();
      toast.success("Product deleted successfully");
    } catch (error) {
      toast.error("Error in deleting product");
      console.log(error);
    }
  }

  return (
    <div className="px-6 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <span className="text-2xl font-bold  text-gray-600 dark:text-white ">
          Product Dashboard
        </span>
        <button
          onClick={() => setIsOpen(true)}
          className="mt-4 sm:mt-0 bg-indigo-600 text-white cursor-pointer px-4 py-2 rounded hover:bg-indigo-700 transition"
        >
          + Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((item) => (
          <div
            className="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 mx-auto"
            key={item.id}
          >
            {/* Image + Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <img
                className="p-4 rounded-t-lg w-full sm:w-40 sm:h-40 object-cover"
                src={item.imageUrl}
                alt="product image"
              />

              {/* Buttons */}
              <div className="flex sm:flex-col gap-2 p-4 sm:p-2 w-full sm:w-auto justify-center">
                <button
                  className="w-full sm:w-auto relative inline-flex items-center justify-center p-0.5 overflow-hidden text-xs sm:text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-green-400 to-blue-600 hover:text-white dark:text-white focus:ring-2 focus:outline-none focus:ring-green-200 dark:focus:ring-green-800"
                  onClick={() => handleEdit(item)}
                >
                  <span className="relative w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 bg-white dark:bg-gray-900 rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent">
                    Update
                  </span>
                </button>

                <button
                  className="w-full sm:w-auto relative inline-flex items-center justify-center p-0.5 overflow-hidden text-xs sm:text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-red-200 via-red-300 to-yellow-200 dark:text-white dark:hover:text-gray-900 focus:ring-2 focus:outline-none focus:ring-red-100 dark:focus:ring-red-400"
                  onClick={() => handleOpenDeleteModal(item)}
                >
                  <span className="relative w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 bg-white dark:bg-gray-900 rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent">
                    Delete
                  </span>
                </button>
              </div>
            </div>

            {/* Details */}
            <div className="px-4 pb-4 sm:px-5 sm:pb-5">
              <h5 className="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white break-words">
                {item.title.slice(0, 30)}...
              </h5>
              <div className="flex flex-col gap-2 my-2">
                <span className="text-justify text-gray-900 dark:text-white">
                  {item.description.slice(0, 100)}...
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-right">
                  ₹{Number(item.price).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {isOpen && (
        <ProductModal
          onClose={handleCloseModal}
          // isOpen={isOpen}
          product={selectedProduct}
        />
      )}
      {deleteModalOpen && (
        <ConfirmDeleteModal
          onClose={handleDeleteModalClose}
          type="product"
          // isOpen={isOpen}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

export default ProductsDashboard;
