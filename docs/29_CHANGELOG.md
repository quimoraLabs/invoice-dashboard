# 29. Project Changelog

All notable changes to the **Invoice Dashboard** project will be documented in this file. Format based on [Keep a Changelog](https://keepachangelog.com/).

---

## [1.1.0] - 2026-09-27

### Added & Changed
* **Clerk Auth Integration:** Migrated authentication engine from legacy Firebase Auth to `@clerk/react` for seamless Single Sign-On, Google Auth, and session state across development and production environments.
* **Firestore Data Isolation:** Secured all Firestore collections (`invoices`, `customers`, `products`, `business_profiles`) under strict Clerk `user.id` (`targetUid`) filtering.
* **Wildcard Sub-path Routing:** Fixed React Router v7 routes to use `/login/*` and `/register/*` for multi-step Clerk OAuth and verification callbacks.
* **Realtime Listener Synchronization:** Standardized realtime `onSnapshot` listeners on Home, Invoice, Customer, and Product dashboards with reactive `[targetUid]` dependencies.
* **Invoice Ledger Dual Dropdowns:** Replaced legacy status pills and reset button on `/invoice` with Headless UI `CustomDropdown` controls for Status (`All`, `Paid`, `Unpaid`, `Pending`) and Sorting / New Arrivals (`newest`, `oldest`, `amount-desc`, `amount-asc`, `name-asc`, `name-desc`).
* **Deletion UX & Single Toast Fix:** Guarded `ViewInvoice.jsx` detail listener with `isDeletingRef` to eliminate temporary 404 page flashes and duplicate delete toast alerts.

---

## [1.0.0] - 2026-09-26

### Added
* Initial release of Invoice Dashboard with React 19, Vite, and Tailwind CSS v4.
* Authentication integration with Firebase Auth (Google Sign-In & Email/Password).
* Full CRUD for Invoices, Customer Directory, and Product Catalog in Firestore.
* Interactive analytics dashboard featuring Recharts (Monthly Revenue & Status Distribution).
* Client-side PDF generation using `@react-pdf/renderer`.
* Toast notifications via `react-hot-toast`.
* Exhaustive 32-document documentation suite and root `PRD.md` and `AGENTS.md`.
