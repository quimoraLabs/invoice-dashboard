# Feature Matrix & Roadmap

## 1. Scope Boundary

| Category | In-Scope (Implemented & Supported) | Explicitly Out-of-Scope |
| :--- | :--- | :--- |
| **Authentication** | Clerk Auth email/password, social OAuth (Google), session token sync with Firebase | Custom self-hosted auth backends, multi-tenant directory SSO (SAML/SCIM) |
| **Tenancy** | Single-user workspace isolation by `userId` | Multi-user role-based access control (RBAC), team permissions, audit logs |
| **Billing & Payments**| Invoice generation, status tracking (`Paid`, `Pending`, `Overdue`, `Draft`), payment method recording | Direct payment gateway integrations (Stripe, Razorpay, PayPal), automated chargebacks |
| **Localization** | Standardized currency formatting (INR/USD default), English UI | Internationalization (i18n), multi-language UI bundles, multi-currency real-time exchange |
| **Storage & Export** | Client-side vector PDF generation (`@react-pdf/renderer`), browser print, Firebase Storage logo upload | Headless server-side PDF rendering cluster, automated batch emailing service |

---

## 2. Feature Matrix by Phase

| Feature Area | v1 (Foundation) | v2 (Core Workflows) | v3 (Productivity & Insights) |
| :--- | :---: | :---: | :---: |
| **Auth & Security** | Clerk Sign-in/Sign-up | Route Guards (`ProtectedRoute`) | Token Exchange with Firebase |
| **Invoice Ledger** | Table listing with basic pagination | Real-time live snapshot stream | Headless UI status filter & multi-sort |
| **Invoice CRUD** | Create invoice with auto-generated ID | Update line items, compute tax | Status quick-toggle & delete guard |
| **Customer Directory** | Static client listing | Real-time live customer stream | Inline creation inside invoice builder |
| **Product Catalog** | Basic item definition | Real-time live catalog stream | Auto-fill unit price & tax on invoice |
| **Document Export** | Browser print style override | Client PDF preview (`InvoiceView`) | Instant PDF file download |
| **Analytics Dashboard** | Static KPI summary cards | Dynamic monthly revenue totals | Interactive Recharts breakdown |
| **Branding & Assets** | Plain text business headers | ImageUploader with live preview | Firebase Cloud Storage logo sync |

---

## 3. Detailed In-Scope Features

### A. Authentication & Session Management
* Secure sign-in and sign-up powered by Clerk Auth (`@clerk/react`).
* Automatic session bridge synchronizing Clerk identity with Firebase Firestore via JWT custom token exchange.
* Immediate redirection of unauthenticated sessions attempting to reach protected app routes.

### B. Invoicing & Financial Operations
* Automatic sequential invoice number incrementing (`INV-001`, `INV-002`, ...).
* Dynamic itemized calculation with automatic subtotal, customizable tax percentage, and grand total.
* Status lifecycle management: `Draft` ➔ `Pending` ➔ `Paid` / `Overdue`.
* Quick mark-as-paid settlement with recorded payment method (UPI, Bank Transfer, Cash).

### C. Client & Product Catalogs
* Customer directory storing billing addresses, phone numbers, email, and GSTIN/Tax IDs.
* Reusable product/service catalog with predefined unit metrics and default tax rates for 1-click invoice insertion.

### D. Analytics & Reporting
* Top-level metric cards: Total Revenue, Outstanding Amount, Paid Invoices count, Pending Invoices count.
* Visual revenue timeline with Recharts charting invoiced volume against realized collections.

---

## 4. Product Roadmap

```
  v1: Core Foundation (Completed)
  └── Clerk Auth + Firestore Database + Basic Router
  
  v2: Core Operational Flows (Completed)
  └── Dynamic Invoice Builder + Customer & Product Catalogs + PDF Export
  
  v3: UI Polish & Analytics (Current)
  └── Headless UI Dual Dropdowns + Recharts Visualizations + Cloud Storage Logos
  
  v3.5: Enhancements (Active)
  ├── Recurring invoice templates
  ├── CSV / Excel export for accounting ledgers
  └── Offline-first cached mutations via Firestore local cache
```
