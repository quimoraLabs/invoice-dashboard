# 02. Feature List & Scope Document

---

## 1. Feature Matrix Overview

| Feature Module | Capabilities | v1 (Current) | v2 (Production) | Future (v3) |
| :--- | :--- | :---: | :---: | :---: |
| **Auth & Security** | Google Auth & Email/Password Sign-in | ✅ | ✅ | ✅ |
| | Password Reset & Profile Sync | ❌ | ✅ | ✅ |
| | Multi-factor Authentication (MFA) | ❌ | ❌ | 🔮 |
| **Dashboard Analytics** | Monthly Revenue Graph (Recharts) | ✅ | ✅ | ✅ |
| | Stat Cards (Paid, Unpaid, Total Invoices) | ✅ | ✅ | ✅ |
| | Recent Invoices Quick Table | ✅ | ✅ | ✅ |
| **Invoice Management** | Create / Edit / Delete Invoices | ✅ | ✅ | ✅ |
| | Status Lifecycle (Paid, Pending, Overdue, Draft) | ✅ | ✅ | ✅ |
| | Client PDF Generation & Download | ✅ | ✅ | ✅ |
| | Send PDF directly via Email | ❌ | ✅ | ✅ |
| **Customer Directory** | Add / Edit / Delete Customers | ✅ | ✅ | ✅ |
| | Client Billing Address & Tax ID Storage | ✅ | ✅ | ✅ |
| | Client Specific Invoice History | ❌ | ✅ | ✅ |
| **Product Catalog** | Product / Service Listing & Pricing | ✅ | ✅ | ✅ |
| | Stock / Inventory Tracking | ❌ | ❌ | 🔮 |
| **Business Settings** | Company Name, Logo, Address, Tax/GST | 🟡 Partial | ✅ | ✅ |
| | Digital Signature Upload | 🟡 Partial | ✅ | ✅ |
| | Bank Account Details on PDF | 🟡 Partial | ✅ | ✅ |
| **Payments** | Payment Gateway Link (Razorpay/Stripe) | ❌ | ✅ | ✅ |
| | Auto-reconciliation via Webhooks | ❌ | ✅ | ✅ |

---

## 2. In-Scope vs Out-of-Scope (Strict Boundaries)

### In-Scope for Production Readiness (v2):
* Full CRUD for Invoices, Customers, Products, and Business Settings.
* Dynamic client-side PDF document generation.
* Robust error boundaries, toast alerts, loading skeletons.
* Persistent Firestore caching and auth guards.
* Light & Dark mode theme toggling.

### Out-of-Scope (Deferred to Future Releases):
* Complex double-entry accounting / ledger posting.
* Native mobile apps (iOS / Android) — Web App PWA takes priority.
* Inventory warehouse tracking.
* Payroll management.
