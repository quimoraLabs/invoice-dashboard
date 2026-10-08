import React from "react";
import ReactPDF from "@react-pdf/renderer";
import fs from "fs";
import path from "path";
import InvoicePDF from "../src/components/InvoiceView.jsx";

const OUTPUT_DIR = path.resolve("./artifacts_pdf_review");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Supplier Profile (Maharashtra - 27)
const supplierProfile = {
  companyName: "Acme Enterprises Pvt Ltd",
  ownerName: "Rajesh Kumar",
  phone: "+91 98765 43210",
  email: "billing@acme.in",
  address: "Shop 12, Nariman Point, Mumbai, Maharashtra - 400021",
  gstin: "27AAAAA0000A1Z5",
  stateCode: "27",
};

// --- Scenario 1: Intra-state, single rate (18%) ---
const scenario1Data = {
  invoiceNumber: "INV-001",
  invoiceDate: "2026-10-08",
  status: "Paid",
  paymentType: "UPI",
  client: {
    name: "TechNova Solutions Ltd",
    phone: "+91 91234 56789",
    email: "accounts@technova.com",
    address: "Bandra Kurla Complex, Mumbai, Maharashtra - 400051",
    gstin: "27BBBBB1111B1Z6",
    state: "Maharashtra",
    stateCode: "27",
  },
  items: [
    { title: "Cloud Architecture Consulting", quantity: 2, price: 5000, taxRate: 18, subTotal: 10000 },
    { title: "DevOps Pipeline Implementation", quantity: 1, price: 10000, taxRate: 18, subTotal: 10000 },
  ],
  subTotal: 20000,
  totalTax: 3600,
  totalAmount: 23600,
};

// --- Scenario 2: Inter-state, single rate (18%) ---
const scenario2Data = {
  invoiceNumber: "INV-002",
  invoiceDate: "2026-10-08",
  status: "Pending",
  client: {
    name: "Bangalore Digital Works",
    phone: "+91 98450 12345",
    email: "finance@bdw.in",
    address: "Indiranagar 100ft Road, Bengaluru, Karnataka - 560038",
    gstin: "29CCCCC2222C1Z7",
    state: "Karnataka",
    stateCode: "29",
  },
  items: [
    { title: "Frontend Design System", quantity: 1, price: 15000, taxRate: 18, subTotal: 15000, hsn: "998313" },
    { title: "Performance Optimization Audit", quantity: 1, price: 5000, taxRate: 18, subTotal: 5000, hsn: "998314" },
  ],
  subTotal: 20000,
  totalTax: 3600,
  totalAmount: 23600,
};

// --- Scenario 3: Intra-state, Multi-rate (5%, 12%, 18%) ---
const scenario3Data = {
  invoiceNumber: "INV-003",
  invoiceDate: "2026-10-08",
  status: "Paid",
  paymentType: "Bank Transfer",
  client: {
    name: "Apex Logistics India",
    phone: "+91 98200 99887",
    email: "invoices@apexlogistics.com",
    address: "MIDC Andheri East, Mumbai, Maharashtra - 400093",
    gstin: "27DDDDD3333D1Z8",
    state: "Maharashtra",
    stateCode: "27",
  },
  items: [
    { title: "Essential Maintenance Kit", quantity: 2, price: 2500, taxRate: 5, subTotal: 5000, hsn: "8471" },
    { title: "Hardware Peripherals", quantity: 1, price: 5000, taxRate: 12, subTotal: 5000, hsn: "8473" },
    { title: "Enterprise SaaS License", quantity: 1, price: 10000, taxRate: 18, subTotal: 10000, hsn: "9983" },
  ],
  subTotal: 20000,
  totalTax: 2650, // 5000*0.05=250 + 5000*0.12=600 + 10000*0.18=1800 -> 2650
  totalAmount: 22650,
};

// --- Scenario 4: B2C (Customer without GSTIN) ---
const scenario4Data = {
  invoiceNumber: "INV-004",
  invoiceDate: "2026-10-08",
  status: "Paid",
  paymentType: "Cash",
  client: {
    name: "Ananya Sharma",
    phone: "+91 97690 54321",
    email: "ananya.sharma@gmail.com",
    address: "Kothrud, Pune, Maharashtra - 411038",
    state: "Maharashtra",
    stateCode: "27",
  },
  items: [
    { title: "UI Consultation Session", quantity: 1, price: 4000, taxRate: 18, subTotal: 4000 },
  ],
  subTotal: 4000,
  totalTax: 720,
  totalAmount: 4720,
};

async function renderScenarios() {
  console.log("Generating Scenario 1 PDF...");
  await ReactPDF.renderToFile(
    <InvoicePDF data={scenario1Data} companyProfile={supplierProfile} />,
    path.join(OUTPUT_DIR, "S1_Intrastate_SingleRate.pdf")
  );

  console.log("Generating Scenario 2 PDF...");
  await ReactPDF.renderToFile(
    <InvoicePDF data={scenario2Data} companyProfile={supplierProfile} />,
    path.join(OUTPUT_DIR, "S2_Interstate_SingleRate.pdf")
  );

  console.log("Generating Scenario 3 PDF...");
  await ReactPDF.renderToFile(
    <InvoicePDF data={scenario3Data} companyProfile={supplierProfile} />,
    path.join(OUTPUT_DIR, "S3_Intrastate_MultiRate.pdf")
  );

  console.log("Generating Scenario 4 PDF...");
  await ReactPDF.renderToFile(
    <InvoicePDF data={scenario4Data} companyProfile={supplierProfile} />,
    path.join(OUTPUT_DIR, "S4_B2C_NoGSTIN.pdf")
  );

  console.log("All 4 sample PDFs successfully generated in:", OUTPUT_DIR);
}

renderScenarios().catch((err) => {
  console.error("PDF generation failed:", err);
  process.exit(1);
});
