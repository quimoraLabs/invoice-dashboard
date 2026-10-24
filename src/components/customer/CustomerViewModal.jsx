import React from 'react'

const CustomerViewModal = ({selectedCustomer,setViewMode,handleEdit}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-24px border border-border bg-surface-elevated shadow-2xl">
        <div className="border-b border-border px-6 py-4">
          <p className="text-sm font-semibold uppercase tracking-0.2em text-primary">Customer details</p>
        </div>
        <div className="px-6 py-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {selectedCustomer.profile && (
            <img
              src={selectedCustomer.profile}
              alt={selectedCustomer.name || selectedCustomer.full_name}
              className="mx-auto h-20 w-20 rounded-full object-cover border-4 border-surface shadow-sm"
            />
          )}

          {selectedCustomer.companyName && (
            <div className="rounded-xl bg-surface p-3 border border-border">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company / Organization</p>
              <p className="mt-0.5 text-base font-semibold text-foreground">{selectedCustomer.companyName}</p>
              {selectedCustomer.displayTradingName && (
                <p className="text-xs text-muted-foreground">Trading as: {selectedCustomer.displayTradingName}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact Person</p>
              <p className="mt-1 text-sm font-medium text-foreground">{selectedCustomer?.name || selectedCustomer?.full_name || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Code</p>
              <p className="mt-1 font-mono text-sm font-semibold text-primary">{selectedCustomer.customerCode || "—"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">GSTIN</p>
              <p className="mt-1 font-mono text-sm text-foreground">{selectedCustomer.gstin || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">PAN</p>
              <p className="mt-1 font-mono text-sm text-foreground">{selectedCustomer.pan || "—"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</p>
              <p className="mt-1 text-sm text-foreground break-all">{selectedCustomer?.email || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</p>
              <p className="mt-1 text-sm text-foreground">{selectedCustomer?.phone || selectedCustomer?.phone_number || "—"}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Billing Address</p>
            <p className="mt-1 text-sm text-foreground leading-relaxed">{selectedCustomer.address || "—"}</p>
          </div>

          {selectedCustomer.shippingAddress && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shipping Address</p>
              <p className="mt-1 text-sm text-foreground leading-relaxed">{selectedCustomer.shippingAddress}</p>
            </div>
          )}

          {selectedCustomer.paymentTerms && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment Terms</p>
                <p className="mt-1 text-sm font-medium text-foreground">{selectedCustomer.paymentTerms}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Currency</p>
                <p className="mt-1 text-sm font-medium text-foreground">{selectedCustomer.currency || "INR"}</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3 border-t border-border px-6 py-4">
          <button
            onClick={() => setViewMode("list")}
            className="flex-1 rounded-2xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-surface hover:text-foreground"
          >
            Close
          </button>
          <button
            onClick={() => {
              handleEdit(selectedCustomer);
              setViewMode("list");
            }}
            className="flex-1 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover active:scale-95"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  )
}

export default CustomerViewModal