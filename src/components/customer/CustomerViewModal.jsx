import React from 'react'

const CustomerViewModal = ({selectedCustomer,setViewMode,handleEdit}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-24px border border-border bg-surface-elevated shadow-2xl">
        <div className="border-b border-border px-6 py-4">
          <p className="text-sm font-semibold uppercase tracking-0.2em text-primary">Customer details</p>
        </div>
        <div className="px-6 py-6 space-y-4">
          {selectedCustomer.profile && (
            <img
              src={selectedCustomer.profile}
              alt={selectedCustomer.name || selectedCustomer.full_name}
              className="mx-auto h-24 w-24 rounded-full object-cover border-4 border-surface"
            />
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-0.1em text-muted-foreground">Name</p>
            <p className="mt-1 text-sm font-medium text-foreground">{selectedCustomer?.name || selectedCustomer?.full_name || "Unnamed Client"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-0.1em text-muted-foreground">Email</p>
            <p className="mt-1 text-sm text-foreground">{selectedCustomer?.email || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-0.1em text-muted-foreground">Phone</p>
            <p className="mt-1 text-sm text-foreground">{selectedCustomer?.phone || selectedCustomer?.phone_number || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-0.1em text-muted-foreground">Address</p>
            <p className="mt-1 text-sm text-foreground">{selectedCustomer.address || "—"}</p>
          </div>
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