# 05. Data Model & Firestore Schema Document

---

## 1. Overview
The Firestore Database uses a document collection model. Data segregation is enforced at the document level via `userId`.

---

## 2. Collections & Document Schemas

### A. Collection: `invoices`
* **Document ID:** Auto-generated Firestore ID (or custom string e.g., `inv_123456`)
```json
{
  "userId": "string (Clerk User ID)",
  "invoiceNumber": "string (e.g. INV-2026-001)",
  "customerId": "string (Reference ID in customers collection)",
  "customerName": "string",
  "customerEmail": "string",
  "customerAddress": "string",
  "invoiceDate": "string (YYYY-MM-DD)",
  "dueDate": "string (YYYY-MM-DD)",
  "status": "string (Paid | Pending | Overdue | Draft)",
  "items": [
    {
      "productId": "string (Optional reference)",
      "description": "string",
      "quantity": "number",
      "unitPrice": "number",
      "total": "number"
    }
  ],
  "subtotal": "number",
  "taxRate": "number (percentage)",
  "taxAmount": "number",
  "totalAmount": "number",
  "notes": "string",
  "createdAt": "timestamp (Firebase Server Timestamp)",
  "updatedAt": "timestamp (Firebase Server Timestamp)"
}
```

### B. Collection: `customers`
```json
{
  "userId": "string (Clerk User ID)",
  "name": "string",
  "email": "string",
  "phone": "string",
  "company": "string",
  "address": "string",
  "gstin": "string (Tax ID)",
  "createdAt": "timestamp"
}
```

### C. Collection: `products`
```json
{
  "userId": "string (Clerk User ID)",
  "name": "string",
  "description": "string",
  "price": "number",
  "unit": "string (e.g. hrs, pcs, items)",
  "taxPercentage": "number",
  "createdAt": "timestamp"
}
```

### D. Collection: `business_profiles`
* **Document ID:** Matching `userId` (1:1 mapping per user)
```json
{
  "userId": "string (Clerk User ID)",
  "companyName": "string",
  "logoUrl": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "taxId": "string (GST / EIN / VAT)",
  "signatureUrl": "string",
  "bankName": "string",
  "accountNumber": "string",
  "ifscCode": "string (or IBAN/SWIFT)",
  "updatedAt": "timestamp"
}
```

---

## 3. Recommended Firestore Composite Indexes
To ensure fast execution of compound queries, create the following composite indexes in Firebase Console:

1. `invoices`: `userId` ASC, `createdAt` DESC
2. `invoices`: `userId` ASC, `status` ASC, `invoiceDate` DESC
3. `customers`: `userId` ASC, `name` ASC
4. `products`: `userId` ASC, `name` ASC
