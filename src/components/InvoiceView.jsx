import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { Table, TH, TR, TD } from "@ag-media/react-pdf-table";

// Register font (put the .ttf file in /public/fonts)
Font.register({
  family: "Roboto",
  src: "/roboto.ttf",
});

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: "Roboto", backgroundColor: "#ffffff" },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
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
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  billBox: {
    width: "48%",
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  billDetails: {
    fontSize: 9,
    color: "#475569",
    marginBottom: 2,
  },
  infoStrip: {
    flexDirection: "row",
    backgroundColor: "#4f46e5",
    borderRadius: 4,
    padding: 8,
    marginBottom: 20,
  },
  infoCell: {
    flex: 1,
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 9,
  },
  table: { marginTop: 10, border: "1px solid #cbd5e1", borderRadius: 4 },
  th: {
    backgroundColor: "#f8fafc",
    fontWeight: "bold",
    fontSize: 9,
    color: "#334155",
    borderBottom: "1px solid #cbd5e1",
    padding: 6,
  },
  td: {
    borderBottom: "1px solid #f1f5f9",
    padding: 6,
    fontSize: 9,
    color: "#334155",
  },
  totalRowText: {
    textAlign: "right",
    fontWeight: "bold",
    fontSize: 10,
    color: "#1e293b",
  },
  totalRowAmount: {
    fontWeight: "bold",
    fontSize: 11,
    color: "#4f46e5",
  },
  signatureContainer: {
    marginTop: 30,
    alignSelf: "flex-end",
    width: 180,
    textAlign: "center",
  },
  signatureName: {
    fontStyle: "italic",
    fontSize: 11,
    color: "#334155",
    marginBottom: 4,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#94a3b8",
    paddingTop: 4,
    fontSize: 8,
    color: "#64748b",
  },
  footer: {
    position: "absolute",
    bottom: 25,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
  },
});

const InvoicePDF = ({ data, companyProfile }) => {
  const companyName = companyProfile?.companyName || data?.billFrom?.name || "Invoice Dashboard Pro";
  const companyPhone = companyProfile?.phone || data?.billFrom?.phone || "+91 98765 43210";
  const companyEmail = companyProfile?.email || data?.billFrom?.email || "billing@invoicedashboard.com";
  const issuerName = companyProfile?.ownerName || data?.billFrom?.ownerName || companyName;

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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.metaText}>#{data?.invoiceNumber || data?.invoice_no || "INV-000"}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#1e293b" }}>
              Status: {data?.status || "Pending"}
            </Text>
            {(data?.paymentType || data?.payment_type) && (
              <Text style={styles.metaText}>Payment Method: {data.paymentType || data.payment_type}</Text>
            )}
          </View>
        </View>

        {/* Bill To & Bill From */}
        <View style={styles.billToSection}>
          <View style={styles.billBox}>
            <Text style={styles.sectionTitle}>Billed To:</Text>
            <Text style={[styles.billDetails, { fontWeight: "bold", color: "#0f172a" }]}>
              {data?.client?.name || "Client Name"}
            </Text>
            {data?.client?.phone && <Text style={styles.billDetails}>{data.client.phone}</Text>}
            {data?.client?.email && <Text style={styles.billDetails}>{data.client.email}</Text>}
            {data?.client?.address && <Text style={styles.billDetails}>{data.client.address}</Text>}
          </View>
          <View style={styles.billBox}>
            <Text style={styles.sectionTitle}>Billed From:</Text>
            <Text style={[styles.billDetails, { fontWeight: "bold", color: "#0f172a" }]}>
              {companyName}
            </Text>
            <Text style={styles.billDetails}>{companyPhone}</Text>
            <Text style={styles.billDetails}>{companyEmail}</Text>
          </View>
        </View>

        {/* Info Strip */}
        <View style={styles.infoStrip}>
          <Text style={styles.infoCell}>Invoice #: {data?.invoiceNumber || data?.invoice_no}</Text>
          <Text style={styles.infoCell}>Date: {formattedDate}</Text>
          <Text style={styles.infoCell}>Paid Date: {formattedPaidDate}</Text>
          <Text style={styles.infoCell}>
            Total: ₹{Number(data?.totalAmount ?? data?.total_price ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </Text>
        </View>

        {/* Items Table */}
        <View style={{ marginBottom: 15 }}>
          <Table style={styles.table}>
            <TH>
              <TD style={[styles.th, { width: "10%" }]}>#</TD>
              <TD style={[styles.th, { width: "45%" }]}>Description</TD>
              <TD style={[styles.th, { width: "15%", textAlign: "center" }]}>Qty</TD>
              <TD style={[styles.th, { width: "15%", textAlign: "right" }]}>Price</TD>
              <TD style={[styles.th, { width: "15%", textAlign: "right" }]}>Total</TD>
            </TH>

            {(data?.items || []).map((item, i) => (
              <TR key={i}>
                <TD style={[styles.td, { width: "10%" }]}>{i + 1}</TD>
                <TD style={[styles.td, { width: "45%" }]}>{item.title || item.description}</TD>
                <TD style={[styles.td, { width: "15%", textAlign: "center" }]}>{item.quantity}</TD>
                <TD style={[styles.td, { width: "15%", textAlign: "right" }]}>
                  ₹{Number(item.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </TD>
                <TD style={[styles.td, { width: "15%", textAlign: "right" }]}>
                  ₹{(item.quantity * item.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </TD>
              </TR>
            ))}
            <TR>
              <TD style={{ width: "70%", border: 0 }}></TD>
              <TD style={[styles.td, { width: "15%", border: 0 }]}>
                <Text style={styles.totalRowText}>Grand Total</Text>
              </TD>
              <TD style={[styles.td, { width: "15%", border: 0 }]}>
                <Text style={styles.totalRowAmount}>
                  ₹{Number(data?.totalAmount ?? data?.total_price ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </Text>
              </TD>
            </TR>
          </Table>
        </View>

        {/* Signature */}
        <View style={styles.signatureContainer}>
          <Text style={styles.signatureName}>{issuerName}</Text>
          <View style={styles.signatureLine}>
            <Text>Authorized Signature</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for choosing {companyName}. For billing inquiries, contact {companyEmail}.</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
