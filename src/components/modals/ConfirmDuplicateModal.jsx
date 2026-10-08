import React from "react";
import { IoClose } from "react-icons/io5";
import { HiOutlineDocumentDuplicate } from "react-icons/hi2";

export default function ConfirmDuplicateModal({
  isOpen,
  onClose,
  onConfirm,
  invoiceNumber,
  isDuplicating,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-[24px] border border-border bg-surface-elevated p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-muted text-primary">
              <HiOutlineDocumentDuplicate size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Clone Invoice</p>
              <h3 className="text-lg font-bold text-foreground">Duplicate Invoice?</h3>
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

        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          This will duplicate all items and customer details from{" "}
          <span className="font-semibold text-foreground">{invoiceNumber || "this invoice"}</span>.
          A new sequential invoice number will be reserved, invoice date will be set to today, and status will be initialized to{" "}
          <span className="font-semibold text-foreground">Draft</span>.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end border-t border-border pt-4">
          <button
            onClick={onClose}
            disabled={isDuplicating}
            type="button"
            className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-surface hover:text-foreground transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDuplicating}
            type="button"
            className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-hover transition cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {isDuplicating ? "Creating Duplicate..." : "Confirm & Duplicate"}
          </button>
        </div>
      </div>
    </div>
  );
}
