# MASTER CONTEXT — Invoice Dashboard (Single Source of Truth)

> **Note:** Copy/Paste this block into AI session prompts whenever starting a new development or refactoring task on this project.

---

## 📌 Project Snapshot
* **Project Name:** Invoice Dashboard (React 19 SaaS)
* **Tech Stack:** React 19, Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`), Clerk Auth (`@clerk/react`), Firebase v12 (Cloud Firestore & Storage), React Router v7 (`react-router-dom`), `@react-pdf/renderer` v4, Recharts v3, `@headlessui/react`, `react-hot-toast`, `react-icons`.
* **Repository Path:** `d:\invoice-dashboard\`
* **Target Audience:** Freelancers, Agencies, Small Businesses, Consultants needing automated billing & invoicing.

---

## 🏗️ Architectural Guidelines & Invariants
1. **Firestore Data Tenant Isolation with Clerk User IDs:** All Firestore documents (`invoices`, `customers`, `products`, `business_profiles`) are linked to `userId` matching Clerk's `user.id`. Queries must filter by `where("userId", "==", targetUid)`. Unbounded collection reads are strictly forbidden.
2. **Clerk Authentication Sub-routes:** Authentication is handled via `@clerk/react`. Routing uses wildcard routes (`/login/*`, `/register/*`) in `src/App.jsx` to accommodate Clerk OAuth callbacks and multi-step verification flows.
3. **Tailwind CSS v4 Configuration:** Uses pure CSS setup `@import "tailwindcss";` in `src/index.css`. Custom color tokens & fonts are defined via `@theme` directives in CSS. No legacy JS config (`tailwind.config.js`).
4. **Reusable UI Components:** Dropdowns across all list controls (Customer, Product, Invoice) use the shared `@headlessui/react` `CustomDropdown` component (`src/components/CustomDropdown.jsx`).
5. **PDF Generation:** Handled client-side using `@react-pdf/renderer`. PDF document specs live in `src/components/InvoiceView.jsx` (or dedicated PDF components).
6. **State Management & Realtime Sync:** Global auth state is provided by `AuthContext` powered by Clerk hooks (`useUser`, `useClerk`). Page data sync uses realtime `onSnapshot` Firestore listeners tied to `[targetUid]` dependencies.

---

## 📂 Key Codebase Directories
- `src/App.jsx`: App Shell, router definition with `/login/*` and `/register/*` wildcard routes, `Toaster` toast setup.
- `src/auth/`: Login and Registration views (`Login.jsx`, `Register.jsx`) rendering Clerk `<SignIn />` and `<SignUp />` widgets.
- `src/components/`: Modular reusable components (`CustomDropdown`, `InvoiceView`, `GraphInvoice`, `StatCard`, `ActionMenu`, `ImageUploader`).
- `src/components/invoice/`: Invoice form, table, headers, filters (`InvoiceFilters.jsx`).
- `src/contexts/authContext/`: `AuthContext.jsx` provider bridging Clerk user session.
- `src/firebase/`: Service handlers (`invoice.js`, `customer.js`, `product.js`, `firebaseConfig.js`).
- `src/pages/`: Pages (`Home.jsx`, `invoice/`, `customer/`, `product/`).
- `docs/`: Technical specification & design documentation directory.

---

## 🔒 Security & Env Variables
Client env vars prefix: `VITE_CLERK_PUBLISHABLE_KEY` alongside `VITE_FIREBASE_*` (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`).

---

## 🎯 Development Standard Operating Procedure (SOP)
1. Read relevant doc in `/docs/` prior to writing code.
2. Ensure changes maintain mobile responsiveness and single-toast UX.
3. Validate build with `npm run build` and check linting with `npm run lint`.
4. Keep code modular, clean, and self-documenting.
