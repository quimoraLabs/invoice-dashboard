import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import { HiOutlineCheckCircle } from "react-icons/hi2";

export default function PaymentMethodModal({ isOpen, onClose, onConfirm, invoiceNumber }) {
  const [paymentType, setPaymentType] = useState("UPI");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paymentType) return;
    setIsSubmitting(true);
    try {
      await onConfirm(paymentType);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-[24px] border border-border bg-surface-elevated p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-muted text-success">
              <HiOutlineCheckCircle size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-success">Settle Payment</p>
              <h3 className="text-lg font-bold text-foreground">Mark as Paid</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground transition hover:bg-surface hover:text-foreground cursor-pointer"
          >
            <IoClose size={18} />
          </button>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          GST compliance requires recorded payment methods for settled invoices ({invoiceNumber || "Invoice"}).
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Select Payment Method *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["UPI", "Card", "Cash"].map((method) => {
                const isSelected = paymentType === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentType(method)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${
                      isSelected
                        ? "border-primary bg-primary-muted text-primary shadow-xs"
                        : "border-border bg-surface text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                    }`}
                  >
                    {method}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-surface hover:text-foreground transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !paymentType}
              className="rounded-xl bg-success px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isSubmitting ? "Updating..." : "Confirm & Mark Paid"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
