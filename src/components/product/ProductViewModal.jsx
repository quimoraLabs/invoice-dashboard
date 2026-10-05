import React from "react";
import { IoClose } from "react-icons/io5";

export default function ProductViewModal({ product, onClose }) {
  if (!product) return null;

  return (
    <div
      id="view-product-modal"
      tabIndex={-1}
      aria-hidden="true"
      className="fixed inset-0 z-50 flex justify-center items-center bg-black/40 backdrop-blur-sm transition-all duration-200"
    >
      <div className="relative p-4 w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-thin scroll-smooth animate-in fade-in zoom-in-95 duration-200">
        <div className="relative bg-surface-elevated rounded-2xl shadow-xl border border-border">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">
              Product Details
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
            >
              <IoClose className="text-xl" title="close" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {product.imageUrl && (
              <div className="w-full h-48 bg-surface rounded-xl overflow-hidden">
                <img src={product.imageUrl} alt={product.title} className="w-full h-full object-contain" />
              </div>
            )}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</h4>
              <p className="text-foreground">{product.title}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</h4>
              <p className="text-muted-foreground text-sm">{product.description}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price</h4>
              <p className="text-foreground font-semibold">₹{Number(product.price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}