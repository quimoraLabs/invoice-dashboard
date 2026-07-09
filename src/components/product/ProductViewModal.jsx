import React from "react";
import { IoClose } from "react-icons/io5";

export default function ProductViewModal({ product, onClose }) {
  if (!product) return null;

  return (
    <div
      id="view-product-modal"
      tabIndex={-1}
      aria-hidden="true"
      className="fixed inset-0 z-50 flex justify-center items-center bg-slate-900/40 backdrop-blur-sm transition-all duration-200"
    >
      <div className="relative p-4 w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-thin scroll-smooth animate-in fade-in zoom-in-95 duration-200">
        <div className="relative bg-white rounded-2xl shadow-xl border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Product Details
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <IoClose className="text-xl" title="close" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {product.imageUrl && (
              <div className="w-full h-48 bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden">
                <img src={product.imageUrl} alt={product.title} className="w-full h-full object-contain" />
              </div>
            )}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Title</h4>
              <p className="text-slate-800 dark:text-slate-200">{product.title}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Description</h4>
              <p className="text-slate-600 dark:text-slate-300 text-sm">{product.description}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Price</h4>
              <p className="text-slate-800 dark:text-slate-200 font-semibold">₹{Number(product.price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}