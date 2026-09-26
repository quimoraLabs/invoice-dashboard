import React from 'react'

const CustomerViewModal = ({selectedCustomer,setViewMode,handleEdit}) => {
  return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-[24px] border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Customer details</p>
            </div>
            <div className="px-6 py-6 space-y-4">
              {selectedCustomer.profile && (
                <img
                  src={selectedCustomer.profile}
                  alt={selectedCustomer.full_name}
                  className="mx-auto h-24 w-24 rounded-full object-cover border-4 border-slate-100"
                />
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Name</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{selectedCustomer?.full_name || selectedCustomer?.name || "Unnamed Client"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Email</p>
                <p className="mt-1 text-sm text-slate-700">{selectedCustomer?.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Phone</p>
                <p className="mt-1 text-sm text-slate-700">{selectedCustomer?.phone_number || selectedCustomer?.phone || selectedCustomer?.phone_no || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Address</p>
                <p className="mt-1 text-sm text-slate-700">{selectedCustomer.address || "—"}</p>
              </div>
            </div>
            <div className="flex gap-3 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setViewMode("list")}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleEdit(selectedCustomer);
                  setViewMode("list");
                }}
                className="flex-1 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
  )
}

export default CustomerViewModal