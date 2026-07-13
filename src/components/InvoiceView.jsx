import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { Table, TH, TR, TD } from "@ag-media/react-pdf-table";
// import logo from "../assets/logo.png";

// Register font (put the .ttf file in /public/fonts)
Font.register({
  family: "Roboto",
  src: "/roboto.ttf", // path relative to /public
});


const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 12, fontFamily: "Helvetica" },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    fontFamily: "Roboto",
  },
  logo: { width: 100, height: 50 },
  billTo: { marginBottom: 10, fontFamily: "Roboto" },
  billDetails:{
    fontSize:10,
    fontFamily:"Roboto",
    color:"gray"
  },
  infoStrip: {
    flexDirection: "row",
    backgroundColor: "#f1c40f",
    itemsAlign: "center",
    padding: 5,
    fontFamily: "Roboto",
    marginBottom: 10,
  },
  infoCell: {
    flex: 1,
    color: "#fff",
    fontWeight: "bold",
    fontSize: 10,
    fontFamily: "Roboto",
  },
  // Table
  table: { marginTop: 10, border: "1px solid #999" },
  th: {
    backgroundColor: "#f2f2f2",
    fontWeight: "bold",
    fontSize: 11,
    border: "1px solid #999",
    padding: 6,
    fontFamily: "Roboto",
  },
  td: {
    border: "1px solid #999",
    padding: 6,
    fontSize: 10,
    fontFamily: "Roboto",
  },

  signatureLine: {
    marginTop: 20,
    paddingTop: 10,
    borderTop: 1,

    fontFamily: "Roboto",
    width: "50%",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    borderTop: 1,
    fontFamily: "Roboto",
    paddingTop: 5,
    fontSize: 10,
    textAlign: "center",
  },
});

const InvoicePDF = ({ data }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={{ fontWeight: "bold", fontSize: 14 }}>
              Invoice #{data.invoice_no}
            </Text>
            <Text>Status: {data.status}</Text>
            <Text>Payment Type: {data.payment_type}</Text>
          </View>
        </View>

        <View style={styles.headerContainer}>
          {/* Bill To */}
          <View style={styles.billTo}>
            <Text style={{ fontWeight: "bold" }}>Bill To:</Text>
            <Text style={styles.billDetails}>{data.client.name}</Text>
            <Text style={styles.billDetails}>{data.client.phone}</Text>
            <Text style={styles.billDetails}>{data.client.email}</Text>
          </View>
          {/* Bill From */}
          <View style={styles.billTo}>
            <Text style={{ fontWeight: "bold" }}>Bill From:</Text>
            <Text style={styles.billDetails}>InvoicePro</Text>
            <Text style={styles.billDetails}>8596741236</Text>
            <Text style={styles.billDetails}>invoicepro789@gmail.com</Text>
          </View>
        </View>

        {/* Info Strip */}
        <View style={styles.infoStrip}>
          <Text style={styles.infoCell}>Invoice No: {data.invoice_no}</Text>
          <Text style={styles.infoCell}>
            Date: {new Date(data.invoice_date).toLocaleDateString()}
          </Text>
          <Text style={styles.infoCell}>
            Paid Date: {data.paid_date || "N/A"}
          </Text>
          <Text style={styles.infoCell}>Total: ₹{data.total_price}</Text>
        </View>

        {/* Items Table */}
        <View style={{ marginBottom: 10 }}>
          {/* Table */}
          <Table style={styles.table}>
            <TH>
              <TD style={styles.th}>No</TD>
              <TD style={styles.th}>Description</TD>
              <TD style={styles.th}>Qty</TD>
              <TD style={styles.th}>Price</TD>
              <TD style={styles.th}>Subtotal</TD>
            </TH>

            {data.items.map((item, i) => (
              <TR key={i}>
                <TD style={styles.td}>{i + 1}</TD>
                <TD style={styles.td}>{item.title}</TD>
                <TD style={styles.td}>{item.quantity}</TD>
                <TD style={styles.td}>₹{item.price}</TD>
                <TD style={styles.td}>₹{item.quantity * item.price}</TD>
              </TR>
            ))}
            <TR>
              <TD
                style={{ borderLeft: 0, borderRight: 0, borderBottom: 0 }}
              ></TD>
              <TD
                style={{ borderLeft: 0, borderRight: 0, borderBottom: 0 }}
              ></TD>
              <TD
                style={{ borderLeft: 0, borderRight: 0, borderBottom: 0 }}
              ></TD>
              <TD style={styles.td}>
                <Text style={{ textAlign: "right", fontWeight: "bold" ,color:"blue"}}>
                  Total
                </Text>
              </TD>
              <TD style={[styles.td,{color:"green",fontWeight:"bold"}]}>₹{data.total_price}</TD>
            </TR>
          </Table>
        </View>

        {/* Signature */}
        <Text
          style={{ fontStyle: "italic", color: "#c9ccd3", fontWeight: "400" }}
        >
          Anil Chaurasia
        </Text>
        <View style={styles.signatureLine}>
          <Text>Issued by, signature:</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
