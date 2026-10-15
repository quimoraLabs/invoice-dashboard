# Product Requirements Document (PRD)
## Invomora — Multi-Tenant B2B Invoicing SaaS

---

## 1. Product Vision & Mission
**Invomora** is a high-performance, full-stack B2B SaaS application designed for freelancers, agencies, and small-to-medium businesses (SMBs). It provides fast, GST-compliant invoicing, isolated multi-tenant team workspaces, client directories, product catalogs, financial analytics, and client-side PDF document generation with zero server rendering costs.

---

## 2. Target Users & Personas
1. **Business Owners & Freelancers:** Require quick invoice creation, branding customization (logos, signatures, bank details), and real-time revenue visibility.
2. **Accountants & Team Members:** Need scoped access to draft invoices, manage customer contacts, track payment statuses, and review transactional histories.
3. **Clients / Customers:** Receive professional, pixel-perfect A4 PDF invoices with complete tax breakdowns (CGST, SGST, IGST) and clear payment details.

---

## 3. Core Features & Capabilities

### 3.1 B2B Multi-Tenancy & Workspaces
- Isolated workspaces (`workspaceId`) with role-based member permissions (`owner`, `accountant`).
- Instant workspace switching via `WorkspaceSwitcher` without page reload.
- Secure invitations with 6-digit owner passcodes.

### 3.2 Security & Data Protection
- **Double Security on Inviting:** Workspace owner must enter their 6-digit PIN before dispatching team invites.
- **Automated Gmail SMTP Alerts:** Instant email notifications on failed passcode attempts and automated delivery of invitations.
- **15-Minute Standby Lock:** Screen auto-lock with backdrop blur and PIN barrier when desk is left unattended.
- **Immutable Audit Trail:** Activity log tracking all create, update, delete, and security events.

### 3.3 GST-Compliant Invoicing
- **Sequential Gapless Numbering:** Atomic Firestore transactions ensuring uninterrupted numbering (`INV-001`, `INV-002`).
- **Invoice Date Rules:** Validated up to 90 days backdated; future dates strictly blocked.
- **Tax Calculations:** Customizable GST tax rates (default 18%) per item, automatic subtotal, tax amount, and rounded grand total computation.
- **Amount in Words:** Automated Indian currency denomination format (Lakhs & Crores).

### 3.4 Product & Customer Directories
- 1-click line item insertion from product catalog with default prices and HSN codes.
- Customer directory storing billing addresses, GSTIN numbers, contact emails, and phone numbers.

### 3.5 Client-Side PDF Generation
- High-performance, pixel-perfect A4 invoice rendering via `@react-pdf/renderer` v4 in-browser without server costs.

### 3.6 Revenue Analytics
- Monthly revenue progression, invoice status distribution (Paid, Pending, Overdue, Draft) using Recharts.

---

## 4. Non-Functional Requirements
- **Performance:** Sub-second page navigations, under 60-second invoice generation and PDF export.
- **Data Isolation:** Enforced via Firebase security rules and Clerk custom claims (`workspaceId`, `role`).
- **Reliability:** 100% test coverage on business rules and transactional counters.
- **Accessibility & Design:** Responsive UI adhering to Tailwind CSS v4 design tokens and dark mode.
