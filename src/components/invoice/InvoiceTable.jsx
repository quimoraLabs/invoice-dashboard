import React from "react";
import InvoiceTableRow from "./InvoiceTableRow";

function InvoiceTable({ invoices }) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-10 rounded-[22px] border border-border bg-surface-elevated shadow-sm">
        <p className="text-muted-foreground">No invoices found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[22px] border border-border bg-surface-elevated shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-muted-foreground">
          <thead className="text-xs text-muted-foreground uppercase bg-surface border-b border-border font-semibold tracking-wider">
            <tr>
              <th scope="col" className="px-4 py-3 sm:px-6">Invoices</th>
              {/* RESPONSIVE HIDE: Hidden on mobile, visible from sm screens up */}
              <th scope="col" className="hidden sm:table-cell px-6 py-3">Client</th>
              {/* RESPONSIVE HIDE: Hidden on mobile, visible from md screens up */}
              <th scope="col" className="hidden md:table-cell px-6 py-3">Date</th>
              <th scope="col" className="px-4 py-3 text-right sm:px-6">Amount</th>
              <th scope="col" className="px-4 py-3 text-center sm:px-6">Status</th>
              <th scope="col" className="px-4 py-3 text-right sm:px-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map((invoice) => (
              <InvoiceTableRow
                key={invoice.id}
                invoice={invoice}                
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InvoiceTable;