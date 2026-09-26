# 37. Form Validation Strategy Specification

---

## 1. Overview
All forms validate user inputs client-side prior to invoking Firebase SDK functions to prevent corrupt data writes and provide immediate visual feedback.

---

## 2. Validation Rules Matrix

### A. Invoice Form Validation (`InvoiceForm.jsx`)
* **Customer Selection:** Required (`customerId !== ""`). Message: *"Please select a client for this invoice."*
* **Invoice Date:** Required (`YYYY-MM-DD`). Message: *"Valid invoice date required."*
* **Due Date:** Required (`dueDate >= invoiceDate`). Message: *"Due date cannot be before invoice date."*
* **Line Items:** At least 1 item with `description.length > 0`, `quantity > 0`, and `unitPrice >= 0`. Message: *"Add at least one valid line item."*

### B. Customer Form Validation (`Customer.jsx`)
* **Name:** Required (Min 2 chars).
* **Email:** Optional (If provided, must match `^[^\s@]+@[^\s@]+\.[^\s@]+$`).
* **GSTIN / Tax ID:** Optional (If provided for India, must match `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`).

### C. Product Form Validation (`Product.jsx`)
* **Product Name:** Required (Min 2 chars).
* **Price:** Required (`price > 0`).

---

## 3. UI Error Feedback Pattern
Errors display inline under target fields using `text-rose-600 text-xs mt-1 font-medium` and trigger toast error popups (`toast.error("Form validation failed")`).
