# 15. Business Settings & Profile Specification

---

## 1. Overview
The Business Settings view empowers users to configure their company branding and payment information, which automatically hydrates into generated PDF invoices.

---

## 2. Form Schema & Fields

| Field Name | Type | Validation Rule | Usage in Application |
| :--- | :--- | :--- | :--- |
| `companyName` | `string` | Required (Min 2 chars) | Invoice Header & Header Navbar |
| `logoUrl` | `string (URL)` | Optional | PDF Header branding image |
| `email` | `string` | Valid Email format | Billed By contact info |
| `phone` | `string` | Optional | Billed By contact info |
| `address` | `string` | Required | Billed By address box on PDF |
| `taxId` | `string` | Optional (GSTIN/EIN/VAT) | Legal Tax identification line |
| `bankName` | `string` | Optional | Bank transfer details box |
| `accountNumber` | `string` | Optional | Bank transfer details box |
| `ifscCode` | `string` | Optional | Bank transfer details box |
| `signatureUrl` | `string (URL)` | Optional | PDF Footer digital signature image |

---

## 3. Data Persistence Flow
1. User fills profile in `/settings`.
2. Document saved to Firestore collection `business_profiles` with `doc.id == user.uid`.
3. When creating or rendering an invoice, `InvoiceView.jsx` reads `business_profiles` doc to prefill header & footer fields automatically.
