# Executive Product Requirement Document (PRD)
## Invoice Dashboard — Production Ready (v1 → v2 SaaS)

---

## 1. Executive Summary
**Invoice Dashboard** is a full-stack B2B/B2C invoicing and financial analytics SaaS application built with **React 19**, **Vite**, **Tailwind CSS v4**, **Clerk Authentication (`@clerk/react`)**, and **Firebase (Cloud Firestore & Storage)**. It enables freelancers, agencies, and small business owners to create, manage, track, and export professional PDF invoices instantly.

---

## 2. Strategic Product Goals
1. **Speed & Efficiency:** Enable users to generate and download branded PDF invoices in under 60 seconds.
2. **Seamless Single Sign-On:** Provide hassle-free authentication (Google, Email, Passwordless) via Clerk Auth with zero backend OAuth overhead.
3. **Financial Visibility:** Provide real-time revenue analytics, status breakdowns (Paid, Pending, Overdue), and client payment metrics.
4. **Data Security & Isolation:** Enforce multi-tenant data isolation at the Firestore query level using strict Clerk `user.id` document ownership.
5. **Zero-Cost PDF Delivery:** Render pixel-perfect A4 invoice PDFs on the client side (`@react-pdf/renderer`) without backend server costs.

---

## 3. High-Level Feature Architecture
* **Auth System:** Clerk Auth (`@clerk/react`) — Single Sign-On, Google Auth, Passkeys, Email & User Profile.
* **Database & Storage:** Firebase Cloud Firestore & Storage.

* **Analytics Dashboard:** Recharts monthly revenue trends & stat cards.
* **Invoice Module:** Full CRUD, dynamic line item calculation, PDF download, and status updates.
* **Client & Product Catalogs:** Directory for instant customer lookup and 1-click product billing insertion.
* **Business Branding:** Business profile configuration (Logo, Tax ID, Signature, Bank details).

---

## 4. Documentation Specs & Deep Dives

Detailed technical specs are maintained in the [`/docs`](./docs) folder. Start at [`docs/INDEX.md`](./docs/INDEX.md) for the doc map and status of each document.

**Entry point:**
- [docs/INDEX.md](./docs/INDEX.md) — doc map and status classifications

**Current behavior (authoritative):**
- [docs/CURRENT_STATE.md](./docs/CURRENT_STATE.md) — what the code actually does today

**Target state (planned B2B, not current behavior):**
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [docs/DATABASE.md](./docs/DATABASE.md)
- [docs/SERVICE_API.md](./docs/SERVICE_API.md)
- [docs/ROUTES.md](./docs/ROUTES.md) — paths current, guards target
- [docs/B2B_MIGRATION_STEP1.md](./docs/B2B_MIGRATION_STEP1.md) — spec only, not implemented
- [docs/B2B_MIGRATION_PHASE4_SCRIPT.md](./docs/B2B_MIGRATION_PHASE4_SCRIPT.md) — spec only, script does not exist
- [docs/CLERK_SETUP.md](./docs/CLERK_SETUP.md) — partly applied, claims not used by the app

**Operational:**
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- [docs/DESIGN.md](./docs/DESIGN.md)
- [docs/FEATURES.md](./docs/FEATURES.md)
- [docs/RESPONSIVE.md](./docs/RESPONSIVE.md)
- [docs/TESTING.md](./docs/TESTING.md)
