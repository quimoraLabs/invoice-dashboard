# 14. PDF Invoice Design Specification

---

## 1. Printable Page Layout (A4 Standard)

PDF invoices generated using `@react-pdf/renderer` strictly follow standard A4 page dimensions (595.28 pt x 841.89 pt).

### Layout Sections:
1. **Header Bar (Top):**
   * Left: Company Logo image & Company Name.
   * Right: Title "INVOICE", Invoice Number (`INV-2026-001`), Invoice Date, Due Date.
2. **Billing Details Section (Two Columns):**
   * Left Column ("Billed By"): User Business Name, Address, Email, GST/Tax ID.
   * Right Column ("Billed To"): Customer Name, Company, Address, Phone, GSTIN.
3. **Itemized Table Grid:**
   * Columns: Item Description | Quantity | Unit Price (₹) | Total (₹)
   * Alternating row shading for high legibility.
4. **Totals & Payment Summary Box (Bottom Right):**
   * Subtotal, Tax Percentage & Tax Amount, Grand Total (Bold accent font).
5. **Footer / Terms & Signature (Bottom):**
   * Bank Payment Details (Bank Name, Account #, IFSC/SWIFT).
   * Digital Signature image (Right aligned).
   * Terms & Conditions note.

---

## 2. Color Palette for PDF Rendering
* **Primary Accent Color:** `#4f46e5` (Header accent / Table headers).
* **Text Dark:** `#111827` (Body text).
* **Text Muted:** `#6b7280` (Labels & captions).
* **Border Lines:** `#e5e7eb` (Table grid lines).
