import React from "react";
import { Plus, FileSpreadsheet, Camera } from "lucide-react";
import { Link } from "react-router-dom";

function InvoiceListHeader({ onOpenBulkImport, onOpenScanner }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">
          Invoice Ledger
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Audit billing items, track due dates, issue drafts, and collect payments.
        </p>
      </div>
      <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
        {onOpenScanner && (
          <button
            type="button"
            onClick={onOpenScanner}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground active:scale-95 shadow-xs"
            title="Scan Receipt with Camera or Image"
          >
            <Camera size={16} />
            <span className="hidden sm:inline">Scan Receipt</span>
          </button>
        )}
        <button
          type="button"
          onClick={onOpenBulkImport}
          className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs sm:text-sm font-medium text-foreground transition hover:border-primary hover:text-primary active:scale-95 shadow-sm"
        >
          <FileSpreadsheet size={16} />
          Bulk Invoices (Excel)
        </button>
        <Link
          to="/invoice/create"
          className="inline-flex items-center justify-center rounded-xl bg-primary p-3 text-primary-foreground shadow-sm transition-all hover:bg-primary-hover active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring"
          title="Create Single Invoice"
        >
          <Plus size={16} />
        </Link>
      </div>
    </div>
  );
}

export default InvoiceListHeader;
