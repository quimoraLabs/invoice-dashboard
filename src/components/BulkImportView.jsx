import React, { useState, useRef } from "react";
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  FileText,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  readExcelFile,
  downloadSampleTemplate,
  normalizeCustomerRows,
  normalizeProductRows,
} from "../utils/excelHelper";
import { createBulkCustomers } from "../firebase/customer";
import { createBulkProducts } from "../firebase/product";

export default function BulkImportView({ type = "customer", scope, onSuccess, onCancel }) {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const fileInputRef = useRef(null);

  const isCustomer = type === "customer";
  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);

  const displayedRows = showErrorsOnly ? invalidRows : parsedRows;

  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    await processFile(selected);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      await processFile(droppedFile);
    }
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
        setParsedRows([]);
        return;
      }

      const normalized = isCustomer
        ? normalizeCustomerRows(rawData)
        : normalizeProductRows(rawData);

      setParsedRows(normalized);
      toast.success(`Loaded ${normalized.length} rows from file.`);
    } catch (err) {
      toast.error(err.message || "Failed to parse file");
      setFile(null);
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (validRows.length === 0) {
      toast.error("No valid records found to import.");
      return;
    }

    try {
      setIsImporting(true);
      setProgress({ current: 0, total: validRows.length });

      const onProgress = (current, total) => {
        setProgress({ current, total });
      };

      if (isCustomer) {
        await createBulkCustomers(validRows, onProgress, scope);
        toast.success(`Successfully imported ${validRows.length} customers!`);
      } else {
        await createBulkProducts(validRows, onProgress, scope);
        toast.success(`Successfully imported ${validRows.length} products!`);
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.message || "Error importing records");
      console.error(err);
    } finally {
      setIsImporting(false);
    }
  };

  const resetSelection = () => {
    setFile(null);
    setParsedRows([]);
    setProgress({ current: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-5 py-2">
      {/* Top Banner / Template Download */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">
              Bulk {isCustomer ? "Customers" : "Products"} Import
            </h4>
            <p className="text-xs text-muted-foreground">
              Upload hundreds or thousands of rows via Excel (.xlsx) or CSV.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => downloadSampleTemplate(type)}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs font-medium text-foreground transition hover:bg-surface hover:text-primary active:scale-95"
        >
          <Download size={14} />
          Download Sample Template
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
            Click to upload or drag & drop spreadsheet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Supports Microsoft Excel (.xlsx, .xls) and CSV files
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* File Card & Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border bg-surface-elevated p-3 sm:p-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText size={20} />
              </div>
              <div className="min-w-0 truncate">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} total rows
                </p>
              </div>
            </div>

            {/* Validation Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={14} />
                {validRows.length} Ready
              </span>
              {invalidRows.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowErrorsOnly(!showErrorsOnly)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    showErrorsOnly
                      ? "bg-rose-500 text-white"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20"
                  }`}
                >
                  <AlertTriangle size={14} />
                  {invalidRows.length} Issues {showErrorsOnly ? "(Showing)" : "(Filter)"}
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

          {/* Preview Table */}
          <div className="max-h-60 overflow-y-auto rounded-2xl border border-border bg-surface text-left">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface-elevated text-muted-foreground border-b border-border font-medium">
                <tr>
                  <th className="py-2.5 px-3 text-left">Line</th>
                  <th className="py-2.5 px-3 text-left">Code</th>
                  <th className="py-2.5 px-3 text-left">{isCustomer ? "Name" : "Title"}</th>
                  <th className="py-2.5 px-3 text-left">{isCustomer ? "Phone / Email" : "Price / Tax"}</th>
                  <th className="py-2.5 px-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayedRows.slice(0, 100).map((row) => (
                  <tr
                    key={row._rowId}
                    className={`transition hover:bg-surface-elevated/50 ${
                      !row.isValid ? "bg-rose-500/5" : ""
                    }`}
                  >
                    <td className="py-2 px-3 text-muted-foreground font-mono">#{row._rowId}</td>
                    <td className="py-2 px-3 font-mono font-semibold text-primary">
                      {isCustomer ? row.customerCode : row.itemCode}
                    </td>
                    <td className="py-2 px-3 font-medium text-foreground max-w-35 truncate">
                      {isCustomer ? row.name || "-" : row.title || "-"}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground max-w-35 truncate">
                      {isCustomer
                        ? `${row.phone || "No phone"} ${row.email ? `• ${row.email}` : ""}`
                        : `₹${row.price || 0} • ${row.taxRate}% GST`}
                    </td>
                    <td className="py-2 px-3">
                      {row.isValid ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 size={12} /> Valid
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium truncate max-w-45"
                          title={row.errors.join(", ")}
                        >
                          <AlertTriangle size={12} /> {row.errors[0]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {displayedRows.length > 100 && (
              <div className="py-2 text-center text-xs text-muted-foreground border-t border-border">
                Showing first 100 of {displayedRows.length} rows
              </div>
            )}
          </div>

          {/* Progress Bar (during import) */}
          {isImporting && (
            <div className="space-y-2 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between text-xs font-medium text-foreground">
                <span className="inline-flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin text-primary" />
                  Importing into workspace...
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
              <p className="text-[11px] text-muted-foreground">
                Safe batch writing in progress. Please do not close this window.
              </p>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isImporting}
              className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-surface-elevated hover:text-foreground disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={isImporting || validRows.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary-hover active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Import {validRows.length} {isCustomer ? "Customers" : "Products"}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
