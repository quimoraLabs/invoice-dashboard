# MASTER CONTEXT — Invoice Dashboard (Single Source of Truth)

> **Note:** Copy/Paste this block into AI session prompts whenever starting a new development or refactoring task on this project.

---

## 📌 Project Snapshot
* **Project Name:** Invoice Dashboard (React 19 SaaS)
* **Tech Stack:** React 19, Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`), Firebase v12 (Firestore & Auth), React Router v7 (`react-router-dom`), `@react-pdf/renderer` v4, Recharts v3, `react-hot-toast`, `react-icons`.
* **Repository Path:** `d:\invoice-dashboard\`
* **Target Audience:** Freelancers, Agencies, Small Businesses, Consultants needing automated billing & invoicing.

---

## 🏗️ Architectural Guidelines & Invariants
1. **Firestore Data Tenant Isolation:** All Firestore documents (`invoices`, `customers`, `products`, `business_profiles`) are linked to `userId` (`auth.currentUser.uid`). Queries must filter by `where("userId", "==", uid)`.
2. **Tailwind CSS v4 Configuration:** Uses pure CSS setup `@import "tailwindcss";` in `src/index.css`. Custom color tokens & fonts are defined via `@theme` directives in CSS. No legacy JS config (`tailwind.config.js`).
3. **PDF Generation:** Handled client-side using `@react-pdf/renderer`. PDF document specs live in `src/components/InvoiceView.jsx` (or dedicated PDF components).
4. **State Management:** Uses React Context API (`AuthContext`) for user auth session. Local state via `useState` and `useEffect` for page-level data fetching.

---

## 📂 Key Codebase Directories
- `src/App.jsx`: App Shell, router definition, `Toaster` toast setup.
- `src/auth/`: Login and Registration views (`Login.jsx`, `Register.jsx`).
- `src/components/`: Modular reusable components (`InvoiceView`, `GraphInvoice`, `StatCard`, `ActionMenu`, `ImageUploader`).
- `src/components/invoice/`: Invoice form, table, headers, status modals.
- `src/contexts/authContext/`: `AuthContext.jsx` provider & hook.
- `src/firebase/`: Service handlers (`auth.js`, `invoice.js`, `customer.js`, `product.js`, `firebaseConfig.js`).
- `src/pages/`: Pages (`Home.jsx`, `invoice/`, `customer/`, `product/`).
- `docs/`: Technical specification & design documentation directory.

---

## 🔒 Security & Env Variables
Client env vars prefix: `VITE_FIREBASE_*` (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`).

---

## 🎯 Development Standard Operating Procedure (SOP)
1. Read relevant doc in `/docs/` prior to writing code.
2. Ensure changes maintain mobile responsiveness.
3. Validate build with `npm run build` and check linting with `npm run lint`.
4. Keep code modular, clean, and self-documenting.
