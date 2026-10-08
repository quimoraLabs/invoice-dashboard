import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { Table, TH, TR, TD } from "@ag-media/react-pdf-table";
import {
  numberToWordsINR,
  extractStateCode,
  getStateDisplayName,
} from "../utils/numberToWords";

// Register font (put the .ttf file in /public/fonts)
try {
  Font.register({
    family: "Roboto",
    src: typeof window !== "undefined" ? "/roboto.ttf" : "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
  });
} catch {
  // Fallback to built-in Helvetica if font registration fails
}

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 9, fontFamily: "Roboto", backgroundColor: "#ffffff" },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    alignItems: "flex-start",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4f46e5",
    textTransform: "uppercase",
  },
  metaText: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 2,
  },
  billToSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  billBox: {
    width: "48%",
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  billDetails: {
    fontSize: 8.5,
    color: "#475569",
    marginBottom: 2,
  },
  gstinBadge: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 2,
  },
  infoStrip: {
    flexDirection: "row",
    backgroundColor: "#4f46e5",
    borderRadius: 4,
    padding: 7,
    marginBottom: 14,
  },
  infoCell: {
    flex: 1,
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 8.5,
  },
  table: { marginTop: 6, border: "1px solid #cbd5e1", borderRadius: 4 },
  th: {
    backgroundColor: "#f8fafc",
    fontWeight: "bold",
    fontSize: 8.5,
    color: "#334155",
    borderBottom: "1px solid #cbd5e1",
    padding: 5,
  },
  td: {
    borderBottom: "1px solid #f1f5f9",
    padding: 5,
    fontSize: 8.5,
    color: "#334155",
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    alignItems: "flex-start",
  },
  amountInWordsBox: {
    width: "54%",
    padding: 8,
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 4,
  },
  amountInWordsLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  amountInWordsText: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#1e293b",
    lineHeight: 1.3,
  },
  taxTableBox: {
    width: "44%",
    border: "1px solid #e2e8f0",
    borderRadius: 4,
    padding: 6,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  summaryLabel: {
    fontSize: 8.5,
    color: "#475569",
  },
  summaryValue: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "right",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    paddingTop: 4,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 9.5,
    fontWeight: "bold",
    color: "#0f172a",
  },
  grandTotalValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#4f46e5",
    textAlign: "right",
  },
  signatureContainer: {
    marginTop: 20,
    alignSelf: "flex-end",
    width: 170,
    textAlign: "center",
  },
  signatureName: {
    fontSize: 9.5,
    fontWeight: "bold",
    color: "#334155",
    marginBottom: 4,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#94a3b8",
    paddingTop: 3,
    fontSize: 7.5,
    color: "#64748b",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 6,
    fontSize: 7.5,
    color: "#94a3b8",
    textAlign: "center",
  },
});

const InvoicePDF = ({ data, companyProfile }) => {
  // Supplier / Company resolution
  const companyName = companyProfile?.companyName || data?.billFrom?.name || "";
  const companyPhone = companyProfile?.phone || data?.billFrom?.phone || "";
  const companyEmail = companyProfile?.email || data?.billFrom?.email || "";
  const companyAddress = companyProfile?.address || data?.billFrom?.address || "";
  const companyGstin = (companyProfile?.gstin || data?.billFrom?.gstin || "").trim().toUpperCase();
  const issuerName = companyProfile?.ownerName || data?.billFrom?.ownerName || companyName || "Authorized Signatory";

  // Customer resolution
  const customerName = data?.client?.name || data?.client?.full_name || "Customer";
  const customerPhone = data?.client?.phone || "";
  const customerEmail = data?.client?.email || "";
  const customerAddress = data?.client?.address || "";
  const customerGstin = (data?.client?.gstin || "").trim().toUpperCase();

  // State codes resolution
  const supplierStateCode = extractStateCode(companyGstin, companyProfile?.stateCode);
  const customerStateCode = extractStateCode(customerGstin, data?.client?.stateCode || data?.client?.state);

  // Place of Supply resolution
  const placeOfSupplyText = getStateDisplayName(
    customerStateCode,
    data?.client?.state || (customerStateCode ? null : "Not specified")
  );

  // Intra-state vs Inter-state determination
  // Rule: If both match -> intra. If both missing -> default intra (safe assumption). If different -> inter.
  const isInterState = Boolean(
    supplierStateCode &&
    customerStateCode &&
    supplierStateCode !== customerStateCode
  );

  // Date formatting
  const rawDate = data?.invoiceDate || data?.invoice_date;
  const formattedDate = rawDate
    ? new Date(rawDate?.toDate ? rawDate.toDate() : rawDate).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "N/A";

  const rawPaidDate = data?.paidDate || data?.paid_date;
  const formattedPaidDate = rawPaidDate
    ? new Date(rawPaidDate?.toDate ? rawPaidDate.toDate() : rawPaidDate).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "N/A";

  // Financial Calculations & Rate Grouping
  const items = Array.isArray(data?.items) ? data.items : [];
  const defaultInvoiceTaxRate = Number(data?.taxRate ?? data?.tax_percentage ?? 18);

  let calculatedSubtotal = 0;
  const rateGroups = {};

  items.forEach((item) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;
    const itemSub = item.subTotal ?? (qty * price);
    const itemRate = Number(item.taxRate ?? defaultInvoiceTaxRate);

    calculatedSubtotal += itemSub;

    if (!rateGroups[itemRate]) {
      rateGroups[itemRate] = { taxableAmount: 0, taxAmount: 0 };
    }
    rateGroups[itemRate].taxableAmount += itemSub;
    const lineTax = (itemSub * itemRate) / 100;
    rateGroups[itemRate].taxAmount += lineTax;
  });

  const subtotal = data?.subTotal ?? calculatedSubtotal;
  let totalTax = 0;
  Object.values(rateGroups).forEach((group) => {
    totalTax += group.taxAmount;
  });
  if (data?.totalTax !== undefined) {
    totalTax = Number(data.totalTax);
  }

  const grandTotal = data?.totalAmount ?? data?.total_price ?? (subtotal + totalTax);
  const amountInWords = numberToWordsINR(grandTotal);

  // Check if any product has an HSN code
  const hasHsn = items.some((it) => it.hsn);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.title}>TAX INVOICE</Text>
            <Text style={styles.metaText}>
              #{data?.invoiceNumber || data?.invoice_no || "INV-000"}
            </Text>
            <Text style={[styles.metaText, { marginTop: 3 }]}>
              Place of Supply: {placeOfSupplyText}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 9.5, fontWeight: "bold", color: "#1e293b" }}>
              Status: {data?.status || "Pending"}
            </Text>
            {(data?.paymentType || data?.payment_type) && (
              <Text style={styles.metaText}>
                Payment Mode: {data.paymentType || data.payment_type}
              </Text>
            )}
            {supplierStateCode && (
              <Text style={styles.metaText}>
                State Code: {supplierStateCode} ({getStateDisplayName(supplierStateCode)})
              </Text>
            )}
          </View>
        </View>

        {/* Bill To & Bill From */}
        <View style={styles.billToSection}>
          <View style={styles.billBox}>
            <Text style={styles.sectionTitle}>Billed To (Customer):</Text>
            <Text style={[styles.billDetails, { fontWeight: "bold", color: "#0f172a" }]}>
              {customerName}
            </Text>
            {customerAddress ? <Text style={styles.billDetails}>{customerAddress}</Text> : null}
            {customerPhone ? <Text style={styles.billDetails}>Phone: {customerPhone}</Text> : null}
            {customerEmail ? <Text style={styles.billDetails}>Email: {customerEmail}</Text> : null}
            {customerGstin ? (
              <Text style={styles.gstinBadge}>GSTIN: {customerGstin}</Text>
            ) : null}
          </View>

          <View style={styles.billBox}>
            <Text style={styles.sectionTitle}>Billed From (Supplier):</Text>
            {companyName ? (
              <Text style={[styles.billDetails, { fontWeight: "bold", color: "#0f172a" }]}>
                {companyName}
              </Text>
            ) : null}
            {companyAddress ? <Text style={styles.billDetails}>{companyAddress}</Text> : null}
            {companyPhone ? <Text style={styles.billDetails}>Phone: {companyPhone}</Text> : null}
            {companyEmail ? <Text style={styles.billDetails}>Email: {companyEmail}</Text> : null}
            {companyGstin ? (
              <Text style={styles.gstinBadge}>GSTIN: {companyGstin}</Text>
            ) : null}
          </View>
        </View>

        {/* Info Strip */}
        <View style={styles.infoStrip}>
          <Text style={styles.infoCell}>
            Invoice #: {data?.invoiceNumber || data?.invoice_no}
          </Text>
          <Text style={styles.infoCell}>Date: {formattedDate}</Text>
          <Text style={styles.infoCell}>Paid Date: {formattedPaidDate}</Text>
          <Text style={styles.infoCell}>
            Total: ₹{Number(grandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </Text>
        </View>

        {/* Items Table */}
        <View style={{ marginBottom: 10 }}>
          <Table style={styles.table}>
            <TH>
              <TD style={[styles.th, { width: "8%" }]}>#</TD>
              <TD style={[styles.th, { width: hasHsn ? "42%" : "50%" }]}>Description</TD>
              {hasHsn && <TD style={[styles.th, { width: "10%", textAlign: "center" }]}>HSN</TD>}
              <TD style={[styles.th, { width: "12%", textAlign: "center" }]}>Qty</TD>
              <TD style={[styles.th, { width: "14%", textAlign: "right" }]}>Price</TD>
              <TD style={[styles.th, { width: "14%", textAlign: "right" }]}>Total</TD>
            </TH>

            {items.map((item, i) => {
              const qty = Number(item.quantity) || 1;
              const price = Number(item.price) || 0;
              const lineTot = item.subTotal ?? (qty * price);
              return (
                <TR key={i}>
                  <TD style={[styles.td, { width: "8%" }]}>{i + 1}</TD>
                  <TD style={[styles.td, { width: hasHsn ? "42%" : "50%" }]}>
                    {item.title || item.description || "Item"}
                  </TD>
                  {hasHsn && (
                    <TD style={[styles.td, { width: "10%", textAlign: "center" }]}>
                      {item.hsn || "-"}
                    </TD>
                  )}
                  <TD style={[styles.td, { width: "12%", textAlign: "center" }]}>{qty}</TD>
                  <TD style={[styles.td, { width: "14%", textAlign: "right" }]}>
                    ₹{price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </TD>
                  <TD style={[styles.td, { width: "14%", textAlign: "right" }]}>
                    ₹{lineTot.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </TD>
                </TR>
              );
            })}
          </Table>
        </View>

        {/* Amount in words + Tax Breakdown Summary Section */}
        <View style={styles.summaryContainer}>
          {/* Amount In Words Card */}
          <View style={styles.amountInWordsBox}>
            <Text style={styles.amountInWordsLabel}>Amount Chargeable (in words)</Text>
            <Text style={styles.amountInWordsText}>{amountInWords}</Text>
            {(!supplierStateCode || !customerStateCode) && (
              <Text style={{ fontSize: 7, color: "#94a3b8", marginTop: 6 }}>
                * Place of supply not explicitly specified; taxes calculated per standard intra-state provisions.
              </Text>
            )}
          </View>

          {/* Tax Breakdown & Grand Total Card */}
          <View style={styles.taxTableBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal (Taxable):</Text>
              <Text style={styles.summaryValue}>
                ₹{Number(subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </Text>
            </View>

            {/* Rate-Wise GST Lines */}
            {Object.entries(rateGroups).map(([rateStr, group]) => {
              const rate = Number(rateStr);
              if (isInterState) {
                // Inter-state: Full IGST
                return (
                  <View key={`igst-${rate}`} style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>IGST @ {rate}%:</Text>
                    <Text style={styles.summaryValue}>
                      ₹{Number(group.taxAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                );
              } else {
                // Intra-state: CGST (half) + SGST (half)
                const halfRate = rate / 2;
                const halfTax = group.taxAmount / 2;
                return (
                  <View key={`intra-${rate}`} style={{ marginVertical: 1 }}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>CGST @ {halfRate}%:</Text>
                      <Text style={styles.summaryValue}>
                        ₹{Number(halfTax).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>SGST @ {halfRate}%:</Text>
                      <Text style={styles.summaryValue}>
                        ₹{Number(halfTax).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </Text>
                    </View>
                  </View>
                );
              }
            })}

            <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 2 }]}>
              <Text style={styles.summaryLabel}>Total Tax:</Text>
              <Text style={styles.summaryValue}>
                ₹{Number(totalTax).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </Text>
            </View>

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Grand Total:</Text>
              <Text style={styles.grandTotalValue}>
                ₹{Number(grandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>

        {/* Signature */}
        <View style={styles.signatureContainer}>
          <Text style={styles.signatureName}>{issuerName}</Text>
          <View style={styles.signatureLine}>
            <Text>Authorized Signatory</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Thank you for your business. For any questions, please reach out to{" "}
            {companyEmail || "support"}.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
