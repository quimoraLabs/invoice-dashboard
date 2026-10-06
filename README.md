# ⚡ Invoice Dashboard

A modern, high-performance, full-stack B2B/B2C invoicing and financial analytics SaaS application built with **React 19**, **Vite 8**, **Tailwind CSS v4**, and **Firebase (Auth & Firestore)**.

![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=for-the-badge&logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite)
![Firebase](https://img.shields.io/badge/Firebase-v12-ffca28?style=for-the-badge&logo=firebase)

---

## 🌟 Overview

The **Invoice Dashboard** is designed for freelancers, agencies, and small business owners who need to create, manage, and deliver professional PDF invoices instantly. It includes real-time financial analytics, client directories, product catalogs, customizable business branding, and instant client-side PDF document generation.

---

## ✨ Key Features

- 📊 **Interactive Analytics Dashboard:** Real-time revenue analytics powered by Recharts (Monthly Revenue trends, paid vs. unpaid invoice breakdowns).
- 📄 **Instant Client-Side PDF Engine:** High-performance, pixel-perfect A4 invoice generation using `@react-pdf/renderer` without backend server overhead.
- 🛍️ **Product Catalog Management:** Manage products and services, default pricing, tax rates, and unit types for 1-click line item insertion.
- 👥 **Customer Directory:** Track client billing details, contact info, tax IDs (GSTIN/EIN), and billing addresses.
- 🎨 **Tailwind CSS v4 Design Tokens:** Fully responsive, dark-mode ready UI built using standard Tailwind CSS v4 theme variables.
- 🔐 **Multi-Tenant Data Isolation:** Secure authentication via Clerk Auth (Google Sign-In & Email/Password) with strict `userId` Firestore query isolation.
- 🔔 **Instant Feedback:** Sleek toast notifications powered by `react-hot-toast` and interactive popover action menus.

---

## 📚 Documentation

All documentation lives in the /docs folder. Start at [docs/INDEX.md](./docs/INDEX.md) for the doc map.

- [PRD.md](./PRD.md) — Product requirements
- [AGENTS.md](./AGENTS.md) — AI agent and contributor directives
- [docs/INDEX.md](./docs/INDEX.md) — Documentation index
- [docs/CURRENT_STATE.md](./docs/CURRENT_STATE.md) — Current behavior (authoritative)
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — System design
- [docs/DATABASE.md](./docs/DATABASE.md) — Firestore schema
- [docs/SERVICE_API.md](./docs/SERVICE_API.md) — Service layer API
- [docs/ROUTES.md](./docs/ROUTES.md) — Routing
- [docs/DESIGN.md](./docs/DESIGN.md) — Design system
- [docs/RESPONSIVE.md](./docs/RESPONSIVE.md) — Responsive strategy
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) — Deployment
- [docs/TESTING.md](./docs/TESTING.md) — Testing
- [docs/FEATURES.md](./docs/FEATURES.md) — Feature matrix
- [docs/CLERK_SETUP.md](./docs/CLERK_SETUP.md) — Clerk setup
- [docs/B2B_MIGRATION_STEP1.md](./docs/B2B_MIGRATION_STEP1.md) — B2B migration spec

---

## 🛠️ Tech Stack & Tooling

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 (`react`, `react-dom`) | Modern component model & hooks |
| **Build Tool** | Vite 8 (`@vitejs/plugin-react-swc`) | Ultra-fast HMR and bundle compilation |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`) | Native CSS theme tokens via `@import "tailwindcss"` |
| **Identity & Auth** | Clerk Auth (`@clerk/react`) | Identity provider, session tokens, JWT delegation |
| **Backend as a Service** | Firebase v12 | Cloud Firestore database + Firebase Admin (server-side token minting) |
| **Routing** | React Router v7 (`react-router-dom`) | Declarative client-side routing & route guards |
| **PDF Generation** | `@react-pdf/renderer` v4 | In-browser client PDF compilation |
| **Data Visualization** | Recharts v3 | Responsive revenue graphs & pie charts |
| **Icons & Alerts** | `lucide-react , @icons-pack/react-simple-icons` & `react-hot-toast` | UI icons and toast alerts |

---

## 📂 Project Directory Structure

```bash
invoice-dashboard/
├── PRD.md                         # Product Requirement Document
├── AGENTS.md                      # AI Agent & Developer Directives
├── docs/                          # Technical specs (14 files)
├── src/
│   ├── main.jsx                   # React DOM Entrypoint
│   ├── App.jsx                    # Router Shell & Toast Provider
│   ├── index.css                  # Tailwind CSS v4 Theme & Base Styles
│   ├── auth/                      # Login & Register views
│   ├── components/                # Shared UI Components
│   │   ├── ActionMenu.jsx         # Row popover action menu
│   │   ├── GraphInvoice.jsx       # Recharts Analytics
│   │   ├── ImageUploader.jsx      # Company logo/signature uploader
│   │   ├── InvoiceView.jsx        # PDF Document Render component
│   │   ├── StatCard.jsx           # Analytics stat card
│   │   ├── customer/              # Customer components
│   │   ├── invoice/               # Invoice forms, tables, modals
│   │   └── product/               # Product catalog components
│   ├── contexts/                  # AuthContext Provider
│   ├── firebase/                  # Pure Firestore & Auth service functions
│   ├── header/                    # Top navigation bar
│   └── pages/                     # Main Application Views (Home, Invoice, Customer, Product)
├── .env.example                   # Environment variable template
├── package.json                   # Dependencies & scripts
├── vite.config.js                 # Vite build settings
└── vercel.json                    # Single-Page App SPA deployment rewrites
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### 2. Installation & Clone
```bash
git clone https://github.com/your-username/invoice-dashboard.git
cd invoice-dashboard
npm install
```

### 3. Environment Variables Setup
Create a `.env` file with:

```env
# CLIENT-SIDE:
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_CLOUDINARY_URL=your_cloudinary_url
VITE_CLOUDINARY_PRESET=your_cloudinary_preset

# SERVER-SIDE (for Vercel functions — never prefix with VITE_):
CLERK_SECRET_KEY=sk_test_...
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Build & Lint Commands

- **Start Dev Server:** `npm run dev`
- **Verify Production Build:** `npm run build`
- **Lint Codebase:** `npm run lint`
- **Preview Production Build:** `npm run preview`

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or PR on GitHub.

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/) (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request