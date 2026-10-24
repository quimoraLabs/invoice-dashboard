import React from "react";
import { X } from "lucide-react";

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
              <X className="w-5 h-5" title="close" />
            </button>
          </div>

          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {product.imageUrl && (
              <div className="w-full h-48 bg-surface rounded-xl overflow-hidden border border-border">
                <img src={product.imageUrl} alt={product.title} className="w-full h-full object-contain" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                {product.type && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      product.type === "Service"
                        ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    }`}
                  >
                    {product.type}
                  </span>
                )}
                {product.itemCode && (
                  <span className="font-mono text-xs text-muted-foreground">{product.itemCode}</span>
                )}
              </div>
              <h4 className="text-base font-semibold text-foreground">{product.title}</h4>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface border border-border">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Selling Price</p>
                <p className="mt-0.5 text-base font-bold text-foreground">
                  ₹{Number(product.price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  {product.unit && <span className="text-xs font-normal text-muted-foreground ml-1">/ {product.unit}</span>}
                </p>
              </div>
              {product.costPrice ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cost Price</p>
                  <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                    ₹{Number(product.costPrice).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {product.type === "Service" ? "SAC Code" : "HSN Code"}
                </h4>
                <p className="mt-0.5 font-mono text-sm text-foreground">{product.hsn || product.sac || "—"}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">GST Rate</h4>
                <p className="mt-0.5 text-sm text-foreground">{product.taxRate !== undefined ? `${product.taxRate}%` : "18%"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</h4>
                <p className="mt-0.5 text-sm text-foreground">{product.category || "General"}</p>
              </div>
              {product.type !== "Service" && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stock In-Hand</h4>
                  <p className="mt-0.5 text-sm font-medium text-foreground">{product.stockQuantity || 0} {product.unit || "Units"}</p>
                </div>
              )}
            </div>

            {product.description && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</h4>
                <p className="mt-0.5 text-muted-foreground text-sm leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}