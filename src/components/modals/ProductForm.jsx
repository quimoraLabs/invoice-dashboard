import { IoClose } from "react-icons/io5";
import { useState, useEffect } from "react";
import { createProduct, updateProduct } from "../../firebase/product";
import { toast } from "react-hot-toast";
import ImageUploader from "../ImageUploader"; 

export default function ProductModal({ onClose, product }) {
  const isEditMode = !!product;
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: 0,
    imageUrl: "",
  });

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        title: product.title || "",
        description: product.description || "",
        price: product.price || 0,
        imageUrl: product.imageUrl || "",
      });
    }
  }, [isEditMode, product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (url) => {
    setFormData((prev) => ({
      ...prev,
      imageUrl: url,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!isEditMode) {
        await createProduct(formData);
        toast.success("product added successfully!");
      } else {
        await updateProduct(product.id, formData);
        toast.success("product updated successfully!");
      }
      onClose();
    } catch (error) {
      toast.error(
        `Something went wrong while ${
          isEditMode ? "updating" : "saving"
        } the product.`,
      );
      console.error(error);
    }
  };

  return (
    <div
      id="crud-modal"
      tabIndex={-1}
      aria-hidden="true"
      className="fixed inset-0 z-50 flex justify-center items-center bg-slate-900/40 backdrop-blur-sm transition-all duration-200"
    >
      <div className="relative p-4 w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-thin scroll-smooth animate-in fade-in zoom-in-95 duration-200">
        {/* Modal content */}
        <div className="relative bg-white rounded-2xl shadow-xl border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
          {/* Modal header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {isEditMode ? "Update Product" : "New Product"}
            </h3>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <IoClose className="text-xl" title="close" />
            </button>
          </div>

          {/* Modal body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Title Input */}
            <ImageUploader onUpload={handleImageUpload} />
            <div>
              <label
                htmlFor="title"
                className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                Title
              </label>
              <input
                type="text"
                name="title"
                id="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-3 py-2.5 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:bg-slate-700 dark:border-slate-600 dark:text-white placeholder:text-slate-400"
                placeholder="Tomato"
                required
              />
            </div>

            {/* Description Input */}
            <div>
              <label
                htmlFor="description"
                className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                Description
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-3 py-2.5 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:bg-slate-700 dark:border-slate-600 dark:text-white placeholder:text-slate-400 resize-none"
                placeholder="product stock location"
                required
              />
            </div>

            {/* Price Input */}
            <div>
              <label
                htmlFor="price"
                className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                Price (INR)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400 text-sm pointer-events-none">
                  ₹
                </span>
                <input
                  type="number"
                  maxLength={6}
                  title="price"
                  name="price"
                  id="price"
                  placeholder="140"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-7 pr-3 py-2.5 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  required
                />
              </div>
            </div>

            

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors border border-slate-200 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all shadow-sm shadow-blue-100 dark:shadow-none"
              >
                {isEditMode ? "Update Product" : "Save Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
