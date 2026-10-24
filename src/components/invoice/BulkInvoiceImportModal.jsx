import React, { useState, useRef, useMemo } from "react";
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  FileText,
  X,
  UserPlus,
  PackagePlus,
  Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  readExcelFile,
  downloadSampleTemplate,
  normalizeInvoiceRows,
} from "../../utils/excelHelper";
import { createBulkInvoices } from "../../firebase/invoice";
import { createCustomer } from "../../firebase/customer";
import { createProduct } from "../../firebase/product";
import CustomDropdown from "../CustomDropdown";

export default function BulkInvoiceImportModal({
  isOpen,
  onClose,
  allCustomers = [],
  allProducts = [],
  scope,
  onSuccess,
}) {
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [resolutions, setResolutions] = useState({}); // rowId -> { customer, product, skipped }
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [filterMismatchesOnly, setFilterMismatchesOnly] = useState(false);
  const fileInputRef = useRef(null);

  // Pre-flight matching against current customers and products
  const analyzedRows = useMemo(() => {
    return rows.map((row) => {
      const userRes = resolutions[row._rowId] || {};

      if (userRes.skipped) {
        return { ...row, isSkipped: true, isReady: false };
      }

      // 1. Resolve Customer
      let resolvedCustomer = userRes.customer || null;
      if (!resolvedCustomer) {
        const queryName = (row.customerName || "").trim().toLowerCase();
        const queryPhone = (row.customerPhone || "").trim();
        resolvedCustomer = allCustomers.find((c) => {
          if (c.customerCode && c.customerCode.toLowerCase() === queryName) return true;
          if (c.name && c.name.toLowerCase() === queryName) return true;
          if (queryPhone && c.phone && c.phone === queryPhone) return true;
          return false;
        }) || null;
      }

      // 2. Resolve Product
      let resolvedProduct = userRes.product || null;
      if (!resolvedProduct) {
        const queryTitle = (row.itemTitle || "").trim().toLowerCase();
        resolvedProduct = allProducts.find((p) => {
          if (p.itemCode && p.itemCode.toLowerCase() === queryTitle) return true;
          if (p.title && p.title.toLowerCase() === queryTitle) return true;
          return false;
        }) || null;
      }

      const hasCustomerMismatch = !resolvedCustomer;
      const hasProductMismatch = !resolvedProduct;
      const isReady = row.isValid && !hasCustomerMismatch && !hasProductMismatch;

      return {
        ...row,
        resolvedCustomer,
        resolvedProduct,
        hasCustomerMismatch,
        hasProductMismatch,
        isReady,
      };
    });
  }, [rows, resolutions, allCustomers, allProducts]);

  const readyRows = analyzedRows.filter((r) => r.isReady);
  const mismatchRows = analyzedRows.filter(
    (r) => !r.isSkipped && (r.hasCustomerMismatch || r.hasProductMismatch || !r.isValid)
  );

  const displayedRows = filterMismatchesOnly ? mismatchRows : analyzedRows;

  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    await processFile(selected);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) await processFile(droppedFile);
  };

  const processFile = async (uploadedFile) => {
    const ext = uploadedFile.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      toast.error("Please upload an Excel (.xlsx, .xls) or CSV file");
      return;
    }

    try {
      setIsParsing(true);
      setFile(uploadedFile);
      const rawData = await readExcelFile(uploadedFile);

      if (!rawData || rawData.length === 0) {
        toast.error("The spreadsheet is empty or has no readable rows.");
        setRows([]);
        return;
      }

      const normalized = normalizeInvoiceRows(rawData);
      setRows(normalized);
      setResolutions({});
      toast.success(`Loaded ${normalized.length} invoices from spreadsheet.`);
    } catch (err) {
      toast.error(err.message || "Failed to parse spreadsheet");
      setFile(null);
      setRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  // Quick Action: Auto-create missing customer on the fly
  const handleQuickCreateCustomer = async (row) => {
    try {
      const payload = {
        name: row.customerName,
        phone: row.customerPhone || "0000000000",
        email: row.customerEmail || "",
      };
      const createdRef = await createCustomer(payload, null, scope);
      const newCust = { id: createdRef.id, ...payload };
      setResolutions((prev) => ({
        ...prev,
        [row._rowId]: { ...prev[row._rowId], customer: newCust },
      }));
      toast.success(`Created customer "${row.customerName}"!`);
    } catch (err) {
      toast.error("Failed to auto-create customer: " + err.message);
    }
  };

  // Quick Action: Auto-create missing product on the fly
  const handleQuickCreateProduct = async (row) => {
    try {
      const payload = {
        title: row.itemTitle,
        price: row.price || 0,
        taxRate: row.taxRate || 18,
        category: "General",
      };
      const createdRef = await createProduct(payload, null, scope);
      const newProd = { id: createdRef.id, ...payload };
      setResolutions((prev) => ({
        ...prev,
        [row._rowId]: { ...prev[row._rowId], product: newProd },
      }));
      toast.success(`Created product "${row.itemTitle}"!`);
    } catch (err) {
      toast.error("Failed to auto-create product: " + err.message);
    }
  };

  // Quick Action: Map to existing customer from dropdown
  const handleSelectCustomer = (rowId, customerId) => {
    const cust = allCustomers.find((c) => c.id === customerId);
    if (!cust) return;
    setResolutions((prev) => ({
      ...prev,
      [rowId]: { ...prev[rowId], customer: cust },
    }));
  };

  // Quick Action: Map to existing product from dropdown
  const handleSelectProduct = (rowId, productId) => {
    const prod = allProducts.find((p) => p.id === productId);
    if (!prod) return;
    setResolutions((prev) => ({
      ...prev,
      [rowId]: { ...prev[rowId], product: prod },
    }));
  };

  // Quick Action: Skip row
  const handleSkipRow = (rowId) => {
    setResolutions((prev) => ({
      ...prev,
      [rowId]: { ...prev[rowId], skipped: true },
    }));
  };

  const handleImport = async () => {
    if (readyRows.length === 0) {
      toast.error("No verified/resolved invoices ready to import.");
      return;
    }

    try {
      setIsImporting(true);
      setProgress({ current: 0, total: readyRows.length });

      const onProgress = (current, total) => {
        setProgress({ current, total });
      };

      // Assemble structured invoices conforming to GST compliance
      const payloadInvoices = readyRows.map((r) => {
        const cust = r.resolvedCustomer;
        const prod = r.resolvedProduct;

        return {
          client: {
            id: cust.id,
            name: cust.name || cust.full_name || r.customerName,
            email: cust.email || r.customerEmail || "",
            phone: cust.phone || cust.phone_number || r.customerPhone || "",
            address: cust.address || "",
            gstin: cust.gstin || "",
          },
          items: [
            {
              id: prod.id,
              title: prod.title || r.itemTitle,
              quantity: r.quantity,
              price: r.price,
              taxRate: r.taxRate,
            },
          ],
          taxRate: r.taxRate,
          invoiceDate: r.invoiceDate,
          status: r.status || "Pending",
          paymentType: r.status === "Paid" ? r.paymentType || "CASH" : "",
        };
      });

      await createBulkInvoices(scope, payloadInvoices, onProgress);
      toast.success(`Successfully imported ${payloadInvoices.length} invoices!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to import invoices");
      console.error(err);
    } finally {
      setIsImporting(false);
    }
  };

  const resetSelection = () => {
    setFile(null);
    setRows([]);
    setResolutions({});
    setProgress({ current: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-24px border border-border bg-surface-elevated shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Bulk Import Invoices (Spreadsheet)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload invoices with automatic pre-flight check for missing clients & products.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="rounded-full p-2 text-muted-foreground transition hover:bg-surface hover:text-foreground disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Template Download Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Invoices Excel Format
                </h4>
                <p className="text-xs text-muted-foreground">
                  Includes Customer, Product, Quantity, Price, Tax, and Payment Status.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => downloadSampleTemplate("invoice")}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs font-medium text-foreground transition hover:bg-surface hover:text-primary active:scale-95"
            >
              <Download size={14} />
              Download Invoices Template (.xlsx)
            </button>
          </div>

          {/* Upload Dropzone */}
          {!file ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-8 text-center transition-all hover:border-primary hover:bg-primary/5"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-elevated text-muted-foreground shadow-sm transition group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                {isParsing ? (
                  <RefreshCw size={26} className="animate-spin" />
                ) : (
                  <UploadCloud size={26} />
                )}
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">
                Click to upload or drag & drop invoices spreadsheet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Supports Microsoft Excel (.xlsx, .xls) and CSV files
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Stats & Filter Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border bg-surface-elevated p-3 sm:p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0 truncate">
                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {rows.length} total rows parsed
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={14} />
                    {readyRows.length} Ready
                  </span>
                  {mismatchRows.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterMismatchesOnly(!filterMismatchesOnly)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                        filterMismatchesOnly
                          ? "bg-rose-500 text-white"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20"
                      }`}
                    >
                      <AlertTriangle size={14} />
                      {mismatchRows.length} Needs Action {filterMismatchesOnly ? "(Showing)" : "(Filter)"}
                    </button>
                  )}
                  {!isImporting && (
                    <button
                      type="button"
                      onClick={resetSelection}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
                      title="Remove file"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Line-by-Line Reconciliation Table */}
              <div className="max-h-72 overflow-y-auto rounded-2xl border border-border bg-surface text-left">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-surface-elevated text-muted-foreground border-b border-border font-medium">
                    <tr>
                      <th className="py-2.5 px-3">Excel Line</th>
                      <th className="py-2.5 px-3">Customer Status</th>
                      <th className="py-2.5 px-3">Product Item Status</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {displayedRows.map((row) => (
                      <tr
                        key={row._rowId}
                        className={`transition hover:bg-surface-elevated/50 ${
                          !row.isReady && !row.isSkipped ? "bg-rose-500/5" : ""
                        } ${row.isSkipped ? "opacity-40" : ""}`}
                      >
                        <td className="py-2 px-3 font-mono text-muted-foreground">
                          #{row._rowId}
                        </td>

                        {/* Customer Column */}
                        <td className="py-2 px-3 max-w-45">
                          {row.resolvedCustomer ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                              <CheckCircle2 size={12} /> {row.resolvedCustomer.name || row.customerName}
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <span className="text-rose-600 dark:text-rose-400 font-semibold block truncate">
                                ❌ Not found: "{row.customerName}"
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handleQuickCreateCustomer(row)}
                                  className="inline-flex items-center gap-1 text-[11px] bg-primary/10 text-primary hover:bg-primary/20 px-2 py-0.5 rounded-md font-medium"
                                >
                                  <UserPlus size={11} /> Auto-create
                                </button>
                                <select
                                  onChange={(e) => handleSelectCustomer(row._rowId, e.target.value)}
                                  defaultValue=""
                                  className="text-[11px] bg-surface border border-border rounded px-1.5 py-0.5 outline-none max-w-28"
                                >
                                  <option value="" disabled>Map client...</option>
                                  {allCustomers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Product Column */}
                        <td className="py-2 px-3 max-w-45">
                          {row.resolvedProduct ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                              <CheckCircle2 size={12} /> {row.resolvedProduct.title || row.itemTitle}
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <span className="text-rose-600 dark:text-rose-400 font-semibold block truncate">
                                ❌ Not found: "{row.itemTitle}"
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handleQuickCreateProduct(row)}
                                  className="inline-flex items-center gap-1 text-[11px] bg-primary/10 text-primary hover:bg-primary/20 px-2 py-0.5 rounded-md font-medium"
                                >
                                  <PackagePlus size={11} /> Auto-create
                                </button>
                                <select
                                  onChange={(e) => handleSelectProduct(row._rowId, e.target.value)}
                                  defaultValue=""
                                  className="text-[11px] bg-surface border border-border rounded px-1.5 py-0.5 outline-none max-w-28"
                                >
                                  <option value="" disabled>Map item...</option>
                                  {allProducts.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.title}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Amount & Qty */}
                        <td className="py-2 px-3 font-medium text-foreground whitespace-nowrap">
                          ₹{(row.quantity * row.price * (1 + row.taxRate / 100)).toFixed(2)}
                          <span className="text-muted-foreground block text-[10px]">
                            {row.quantity}x @ ₹{row.price} ({row.status})
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-2 px-3 text-right">
                          {!row.isSkipped ? (
                            <button
                              type="button"
                              onClick={() => handleSkipRow(row._rowId)}
                              className="text-muted-foreground hover:text-rose-500 p-1 rounded"
                              title="Skip this line"
                            >
                              <Trash2 size={13} />
                            </button>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">Skipped</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Progress Bar (during import) */}
              {isImporting && (
                <div className="space-y-2 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center justify-between text-xs font-medium text-foreground">
                    <span className="inline-flex items-center gap-2">
                      <RefreshCw size={14} className="animate-spin text-primary" />
                      Generating sequential GST invoices into workspace...
                    </span>
                    <span>
                      {progress.current} / {progress.total} (
                      {Math.round((progress.current / Math.max(progress.total, 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{
                        width: `${Math.round((progress.current / Math.max(progress.total, 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  {mismatchRows.length > 0
                    ? `${mismatchRows.length} lines need resolution or will be skipped.`
                    : "All lines resolved and verified!"}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isImporting}
                    className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-surface-elevated hover:text-foreground disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={isImporting || readyRows.length === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary-hover active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Creating Invoices...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        Generate {readyRows.length} Invoices
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
