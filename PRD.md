# Executive Product Requirement Document (PRD)
## Invoice Dashboard — Production Ready (v1 → v2 SaaS)

---

## 1. Executive Summary
**Invoice Dashboard** is a full-stack B2B/B2C invoicing and financial analytics SaaS application built with **React 19**, **Vite**, **Tailwind CSS v4**, and **Firebase (Auth & Firestore)**. It enables freelancers, agencies, and small business owners to create, manage, track, and export professional PDF invoices instantly.

---

## 2. Strategic Product Goals
1. **Speed & Efficiency:** Enable users to generate and download branded PDF invoices in under 60 seconds.
2. **Financial Visibility:** Provide real-time revenue analytics, status breakdowns (Paid, Pending, Overdue), and client payment metrics.
3. **Data Security & Isolation:** Enforce multi-tenant data isolation at the Firestore query level using strict `userId` document ownership.
4. **Zero-Cost PDF Delivery:** Render pixel-perfect A4 invoice PDFs on the client side (`@react-pdf/renderer`) without backend server costs.

---

## 3. High-Level Feature Architecture
* **Auth System:** Firebase Auth (Google Sign-In & Email/Password).
* **Analytics Dashboard:** Recharts monthly revenue trends & stat cards.
* **Invoice Module:** Full CRUD, dynamic line item calculation, PDF download, and status updates.
* **Client & Product Catalogs:** Directory for instant customer lookup and 1-click product billing insertion.
* **Business Branding:** Business profile configuration (Logo, Tax ID, Signature, Bank details).

---

## 4. Documentation Specs & Deep Dives
Detailed technical specs are maintained in the [`/docs`](file:///d:/invoice-dashboard/docs/INDEX.md) folder:
* 📄 [**Project Vision & User Personas**](file:///d:/invoice-dashboard/docs/01_PROJECT_VISION.md)
* 📄 [**Feature Matrix & Scope Boundaries**](file:///d:/invoice-dashboard/docs/02_FEATURE_SCOPE.md)
* 📄 [**Data Model & Firestore Schema**](file:///d:/invoice-dashboard/docs/05_FIRESTORE_SCHEMA.md)
* 📄 [**Service Layer API Contracts**](file:///d:/invoice-dashboard/docs/36_SERVICE_LAYER_API.md)
