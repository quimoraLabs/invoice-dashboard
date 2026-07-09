import React from "react";
import { IoClose } from "react-icons/io5";

export default function ProductViewModal({ product, onClose }) {
  if (!product) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="relative rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
          {/* Modal header */}
          <div className="flex items-start justify-between border-b border-slate-200 p-5 dark:border-slate-700">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {product.title}
              </h3>
              <p className="mt-1 text-sm capitalize text-slate-500 dark:text-slate-400">
                {product.category}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            >
              <IoClose className="text-xl" />
            </button>
          </div>

          {/* Modal body */}
          <div className="space-y-4 p-5">
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.title}
                className="h-48 w-full rounded-lg object-contain"
              />
            )}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Price
              </h4>
              <p className="mt-1 text-lg font-semibold text-slate-800 dark:text-slate-200">
                ₹{Number(product.price).toFixed(2)}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Description
              </h4>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{product.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}