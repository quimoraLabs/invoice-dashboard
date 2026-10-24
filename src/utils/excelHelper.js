import * as XLSX from "xlsx";

/**
 * Generates a clean collision-resistant unique code.
 * @param {string} prefix - e.g. "PRD" or "CUST"
 */
export function generateUniqueCode(prefix = "ITEM") {
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  const timePart = Date.now().toString().slice(-4);
  return `${prefix}-${timePart}${randomPart}`;
}

/**
 * Reads any .xlsx, .xls, or .csv file and returns JSON rows.
 * @param {File} file 
 * @returns {Promise<Array<Object>>}
 */
export async function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        resolve(json);
      } catch (err) {
        reject(new Error("Failed to parse spreadsheet file: " + (err.message || "Unknown error")));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read the file."));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Downloads a sample Excel template with helpful dummy data.
 * @param {"customer" | "product"} type 
 */
export function downloadSampleTemplate(type) {
  let data = [];
  let filename = "";

  if (type === "customer") {
    filename = "customers_sample_template.xlsx";
    data = [
      {
        "Customer Code (Optional)": "CUST-1001",
        "Full Name (Required)": "Ramesh Kumar Sharma",
        "Phone Number (Required)": "9876543210",
        "Email": "ramesh.sharma@example.com",
        "Company Name": "Sharma Traders Pvt Ltd",
        "Display / Brand Name": "Sharma Retail",
        "Industry Type": "Retail",
        "GSTIN": "07AAAAA0000A1Z5",
        "PAN Number": "AAAAA0000A",
        "Billing Address": "Plot 42, Sector 18, Gurugram, HR",
        "Shipping Address": "Plot 42, Sector 18, Gurugram, HR",
        "Payment Terms": "Net 30",
        "Opening Balance": 0,
        "Image URL": ""
      },
      {
        "Customer Code (Optional)": "",
        "Full Name (Required)": "Priya Verma",
        "Phone Number (Required)": "9812345678",
        "Email": "priya.verma@example.com",
        "Company Name": "Verma Technologies",
        "Display / Brand Name": "Verma Cloud",
        "Industry Type": "IT",
        "GSTIN": "",
        "PAN Number": "BBBBB1111B",
        "Billing Address": "504, MG Road, Bengaluru, KA",
        "Shipping Address": "504, MG Road, Bengaluru, KA",
        "Payment Terms": "Immediate",
        "Opening Balance": 0,
        "Image URL": ""
      }
    ];
  } else if (type === "product") {
    filename = "products_sample_template.xlsx";
    data = [
      {
        "Item Code (Optional)": "PRD-2001",
        "Title (Required)": "Premium Cotton T-Shirt",
        "Type (Product/Service)": "Product",
        "Price (Required)": 799,
        "Cost Price": 450,
        "Category": "Clothing",
        "Tax Rate %": 18,
        "HSN / SAC Code": "6109",
        "Unit": "Pcs",
        "Stock Quantity": 150,
        "Description": "100% Organic Bio-washed cotton",
        "Image URL": ""
      },
      {
        "Item Code (Optional)": "SRV-3001",
        "Title (Required)": "Cloud DevOps Architecture Audit",
        "Type (Product/Service)": "Service",
        "Price (Required)": 35000,
        "Cost Price": 15000,
        "Category": "DevOps & Cloud",
        "Tax Rate %": 18,
        "HSN / SAC Code": "998313",
        "Unit": "Hours",
        "Stock Quantity": 0,
        "Description": "Comprehensive security & AWS architecture review",
        "Image URL": ""
      }
    ];
  } else if (type === "invoice") {
    filename = "invoices_sample_template.xlsx";
    data = [
      {
        "Customer Name or Code (Required)": "Ramesh Kumar Sharma",
        "Customer Phone (Optional)": "9876543210",
        "Customer Email (Optional)": "ramesh.sharma@example.com",
        "Item Title or Code (Required)": "Premium Cotton T-Shirt",
        "Quantity (Required)": 2,
        "Unit Price (Required)": 799,
        "Tax Rate % (Optional)": 18,
        "Invoice Date (YYYY-MM-DD)": new Date().toISOString().split("T")[0],
        "Payment Status (Pending/Paid/Draft)": "Paid",
        "Payment Type (UPI/Cash/Card)": "UPI"
      },
      {
        "Customer Name or Code (Required)": "Priya Verma",
        "Customer Phone (Optional)": "9812345678",
        "Customer Email (Optional)": "priya.verma@example.com",
        "Item Title or Code (Required)": "Wireless Bluetooth Mouse",
        "Quantity (Required)": 1,
        "Unit Price (Required)": 1499,
        "Tax Rate % (Optional)": 18,
        "Invoice Date (YYYY-MM-DD)": new Date().toISOString().split("T")[0],
        "Payment Status (Pending/Paid/Draft)": "Pending",
        "Payment Type (UPI/Cash/Card)": ""
      }
    ];
  }

  const ws = XLSX.utils.json_to_sheet(data);
  // Auto-fit column widths with readable padding
  if (data.length > 0) {
    ws["!cols"] = Object.keys(data[0]).map((key) => {
      const maxLen = Math.max(
        key.length,
        ...data.map((row) => String(row[key] ?? "").length)
      );
      return { wch: Math.max(maxLen + 4, 16) };
    });
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  XLSX.writeFile(wb, filename);
}

/**
 * Normalizes customer rows from raw Excel data with intelligent header detection.
 * @param {Array<Object>} rawRows 
 */
export function normalizeCustomerRows(rawRows) {
  return rawRows.map((row, index) => {
    // Find keys ignoring case and special characters
    const keys = Object.keys(row);
    const findVal = (...terms) => {
      const match = keys.find((k) =>
        terms.some((t) => k.toLowerCase().replace(/[^a-z0-9]/g, "").includes(t.toLowerCase().replace(/[^a-z0-9]/g, "")))
      );
      return match ? String(row[match]).trim() : "";
    };

    const name = findVal("fullname", "name", "customer", "client");
    const rawPhone = findVal("phone", "mobile", "contact", "cell");
    const phone = rawPhone.replace(/\D/g, "");
    const email = findVal("email", "mail");
    const company = findVal("companyname", "company", "firm", "business");
    const displayTradingName = findVal("displayname", "brandname", "tradingname");
    const industryType = findVal("industrytype", "industry") || "Other";
    const gstin = findVal("gstin", "gst").toUpperCase();
    const pan = findVal("pan", "pannumber", "taxid").toUpperCase();
    const address = findVal("billingaddress", "address", "city", "location");
    const shippingAddress = findVal("shippingaddress", "shipaddress") || address;
    const paymentTerms = findVal("paymentterms", "terms") || "Net 30";
    const currency = findVal("currency") || "INR";
    const rawBalance = findVal("openingbalance", "balance");
    const openingBalance = parseFloat(rawBalance) || 0;
    const code = findVal("code", "customercode", "id") || generateUniqueCode("CUST");
    const imageUrl = findVal("image", "imageurl", "photo", "pic", "avatar");

    const errors = [];
    if (!name) errors.push("Name is required");
    if (!phone || phone.length !== 10) errors.push("Valid 10-digit phone is required");

    return {
      _rowId: index + 2, // Excel row 2+ (after header)
      customerCode: code,
      name,
      companyName: company,
      company, // legacy alias
      displayTradingName,
      industryType,
      phone,
      email,
      gstin,
      pan,
      address,
      shippingAddress,
      paymentTerms,
      currency,
      openingBalance,
      profile: imageUrl,
      isValid: errors.length === 0,
      errors,
    };
  });
}

/**
 * Normalizes product rows from raw Excel data with intelligent header detection.
 * @param {Array<Object>} rawRows 
 */
export function normalizeProductRows(rawRows) {
  return rawRows.map((row, index) => {
    const keys = Object.keys(row);
    const findVal = (...terms) => {
      const match = keys.find((k) =>
        terms.some((t) => k.toLowerCase().replace(/[^a-z0-9]/g, "").includes(t.toLowerCase().replace(/[^a-z0-9]/g, "")))
      );
      return match ? String(row[match]).trim() : "";
    };

    const title = findVal("title", "name", "itemname", "product", "productname");
    const rawType = findVal("type", "producttype", "servicetype");
    const type = rawType.toLowerCase().includes("service") ? "Service" : "Product";
    const rawPrice = findVal("price", "rate", "sellingprice", "unitprice", "amount");
    const price = parseFloat(rawPrice) || 0;
    const rawCost = findVal("costprice", "cost", "purchaseprice");
    const costPrice = parseFloat(rawCost) || 0;
    const category = findVal("category", "group") || "Other";
    const rawTax = findVal("tax", "taxrate", "gst", "gstpercent");
    const taxRate = parseFloat(rawTax) || 18;
    const hsn = findVal("hsn", "hsncode", "sac", "saccode");
    const unit = findVal("unit", "uom") || (type === "Service" ? "Hours" : "Pcs");
    const rawStock = findVal("stockquantity", "stock", "quantity", "qty");
    const stockQuantity = type === "Service" ? 0 : (parseInt(rawStock, 10) || 0);
    const description = findVal("description", "desc", "details");
    const code = findVal("code", "itemcode", "sku", "id") || generateUniqueCode("PRD");
    const imageUrl = findVal("image", "imageurl", "photo", "pic");

    const errors = [];
    if (!title) errors.push("Product title is required");
    if (price <= 0) errors.push("Price must be greater than 0");

    return {
      _rowId: index + 2,
      itemCode: code,
      title,
      type,
      price,
      costPrice,
      category,
      taxRate,
      hsn,
      unit,
      stockQuantity,
      description,
      imageUrl,
      isValid: errors.length === 0,
      errors,
    };
  });
}

/**
 * Normalizes invoice rows from raw Excel data with intelligent header detection.
 * @param {Array<Object>} rawRows 
 */
export function normalizeInvoiceRows(rawRows) {
  return rawRows.map((row, index) => {
    const keys = Object.keys(row);
    const findVal = (...terms) => {
      const cleanKeys = keys.map((k) => ({
        original: k,
        cleaned: k.toLowerCase().replace(/[^a-z0-9]/g, ""),
      }));
      const cleanTerms = terms.map((t) => t.toLowerCase().replace(/[^a-z0-9]/g, ""));

      const exact = cleanKeys.find((k) => cleanTerms.includes(k.cleaned));
      if (exact) return String(row[exact.original]).trim();

      const match = cleanKeys.find((k) => cleanTerms.some((t) => k.cleaned.includes(t)));
      return match ? String(row[match.original]).trim() : "";
    };

    const customerName = findVal("customername", "clientname", "customer", "client", "customercode");
    const customerPhone = findVal("phone", "mobile", "contact").replace(/\D/g, "");
    const customerEmail = findVal("email", "mail");
    const itemTitle = findVal("itemtitle", "producttitle", "product", "item", "title", "itemcode");
    const rawQty = findVal("quantity", "qty", "units");
    const quantity = Math.max(1, parseInt(rawQty, 10) || 1);
    const rawPrice = findVal("unitprice", "price", "rate", "cost");
    const price = parseFloat(rawPrice) || 0;
    const rawTax = findVal("taxrate", "tax", "gst", "gstpercent");
    const taxRate = parseFloat(rawTax) || 18;
    const invoiceDate = findVal("invoicedate", "date") || new Date().toISOString().split("T")[0];
    const status = findVal("paymentstatus", "status") || "Pending";
    const paymentType = findVal("paymenttype", "paymentmode", "paymentmethod", "mode") || "";

    const errors = [];
    if (!customerName) errors.push("Customer name or code is required");
    if (!itemTitle) errors.push("Product item title or code is required");
    if (price <= 0) errors.push("Valid item price is required");
    if (status.toLowerCase() === "paid" && !paymentType) {
      errors.push("Payment type (UPI, Card, Cash) is required for Paid status");
    }

    return {
      _rowId: index + 2,
      customerName,
      customerPhone,
      customerEmail,
      itemTitle,
      quantity,
      price,
      taxRate,
      invoiceDate,
      status: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
      paymentType: paymentType.toUpperCase(),
      isValid: errors.length === 0,
      errors,
    };
  });
}

