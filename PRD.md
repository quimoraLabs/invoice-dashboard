# Executive Product Requirement Document (PRD)
## Invoice Dashboard (Invomora) — Production Ready (v2 Multi-Tenant B2B SaaS)

---

## 1. Executive Summary
**Invoice Dashboard (Invomora)** is a production-grade B2B multi-tenant invoicing, client management, and financial analytics SaaS application built with **React 19**, **Vite**, **Tailwind CSS v4**, **Clerk Authentication (`@clerk/react`)**, and **Firebase Firestore & Serverless APIs**. It enables businesses, agencies, and accountants to create, manage, track, and export professional GST-compliant PDF invoices with complete workspace isolation and enterprise-grade security.

---

## 2. Strategic Product Goals
1. **Speed & Efficiency:** Generate and export pixel-perfect, branded PDF invoices in under 60 seconds.
2. **Seamless Single Sign-On:** Frictionless authentication (Google, Email, Passkeys) via Clerk Auth with Firebase session bridge.
3. **B2B Multi-Tenancy & Collaboration:** Isolated team workspaces (`workspaceId`) with role-based member permissions (`owner`, `accountant`).
4. **Data Security & Open-Desk Protection:**
   - **Double Security on Inviting:** 6-digit workspace passcode authorization required before sending invites.
   - **Automated Gmail SMTP Alerts:** Instant email alerts on failed passcode attempts and automated email delivery of invitations.
   - **15-Minute Standby Lock:** Screen auto-lock with backdrop blur and passcode barrier when left unattended.
5. **GST Compliance & Audit Trail:**
   - Atomic, gapless sequential invoice numbering via Firestore transactional counters.
   - 90-day backdating rule enforcement.
   - Immutable audit logging (`activity_logs`) for all invoices, customers, products, and security events.
6. **Zero-Cost PDF Delivery:** In-browser A4 invoice rendering (`@react-pdf/renderer`) without backend server costs.

---

## 3. High-Level Feature Architecture
* **Auth System:** Clerk Auth (`@clerk/react`) with Firebase custom token bridge minting `{ workspaceId, role }` claims.
* **Database:** Cloud Firestore with strict multi-tenant security rules and composite indexes.
* **Workspace Engine:** Multi-workspace switcher, role management, 6-digit invite passcode protection.
* **Notification & Security System:** Serverless Nodemailer / Gmail SMTP mailer (`api/mailer.js`, `api/send-email.js`) + 15-minute standby inactivity lock (`InactivityLock.jsx`).
* **Analytics Dashboard:** Recharts monthly revenue trends, payment breakdowns (Paid, Pending, Overdue).
* **Invoice Module:** Full CRUD, dynamic line item calculation, GST tax computation, sequential numbering, PDF download.
* **Customer & Product Catalogs:** Directory for instant customer lookup and 1-click product billing insertion.
* **Business Branding:** Workspace profile configuration (Logo, Tax ID, Signature, Bank details).
* **Audit Ledger:** Realtime immutable activity feed (`/activity-log`).

---

## 4. Documentation Specs & Status

Detailed technical specs are maintained in the [`/docs`](./docs) folder following the **8 Standard Documents** structure:

- **Authoritative Current Reality:** [PROGRESS.md](./PROGRESS.md)
- **Detailed Requirements:** [docs/PRD.md](./docs/PRD.md)
- **Roadmap & Versioning:** [docs/ROADMAP.md](./docs/ROADMAP.md)
- **Architecture & System Design:** [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- **Deployment Guide:** [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md)
- **API Reference:** [docs/API_REFERENCE.md](./docs/API_REFERENCE.md)
- **Contribution Guidelines:** [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md)
- **Release Changelog:** [docs/CHANGELOG.md](./docs/CHANGELOG.md)
- **Troubleshooting & FAQ:** [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)

