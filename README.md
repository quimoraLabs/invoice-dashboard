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

- 🏢 **B2B Multi-Tenancy & Workspaces:** Multi-tenant workspace switcher, role-based access (`owner`, `accountant`), and complete data isolation.
- 🔐 **Double Security on Team Invites:** Workspace owner must authorize invites with their 6-digit security PIN before dispatching. Recipients must verify the PIN to join.
- ✉️ **Automated Gmail SMTP Email Dispatch:** Serverless Nodemailer service delivers branded invite emails with passcodes and triggers instant security alert emails on unauthorized access attempts.
- ⏳ **15-Minute Standby Inactivity Lock:** Auto-blurs dashboard and locks access with the 6-digit PIN when inactive for 15 minutes, safeguarding sensitive accounting records on open laptops.
- 📜 **Immutable Workspace Audit Trail:** Real-time mutation tracking and security audit log (`/activity-log`).
- 🔢 **Sequential GST Invoice Numbering:** Transactional Firestore counters guarantee atomic, gapless sequential numbering (`INV-001`, `INV-002`).
- 📊 **Interactive Analytics Dashboard:** Real-time revenue analytics powered by Recharts (Monthly Revenue trends, paid vs. unpaid invoice breakdowns).
- 📄 **Instant Client-Side PDF Engine:** High-performance, pixel-perfect A4 invoice generation using `@react-pdf/renderer` without backend server overhead.
- 🛍️ **Product Catalog Management:** Manage products and services, default pricing, tax rates, and unit types for 1-click line item insertion.
- 👥 **Customer Directory:** Track client billing details, contact info, tax IDs (GSTIN/EIN), and billing addresses.
- 🎨 **Tailwind CSS v4 Design Tokens:** Fully responsive, dark-mode ready UI built using standard Tailwind CSS v4 theme variables.
- 🔔 **Instant Feedback:** Sleek toast notifications powered by `react-hot-toast` and interactive popover action menus.

---

## 📚 Documentation

All project documentation follows the **8 Standard Documents** architecture located in the `/docs` directory:

- [PROGRESS.md](./PROGRESS.md) — Live codebase reality & operational milestones (Authoritative)
- [AGENTS.md](./AGENTS.md) — Contributor & AI agent directives
- [docs/PRD.md](./docs/PRD.md) — Product vision, user personas & business requirements
- [docs/ROADMAP.md](./docs/ROADMAP.md) — Version milestones & release plan (V1 → V2 → V3)
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — System design, data flow & database schema
- [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) — Step-by-step production deployment guide
- [docs/API_REFERENCE.md](./docs/API_REFERENCE.md) — Serverless endpoints & client service contracts
- [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) — Developer guidelines & engineering standards
- [docs/CHANGELOG.md](./docs/CHANGELOG.md) — Version release notes & patch history
- [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) — Solutions for common setup & runtime issues

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
| **Email Service** | `nodemailer` v6 | Serverless Gmail SMTP notifications & security alerts |
| **Icons & Alerts** | `lucide-react , @icons-pack/react-simple-icons` & `react-hot-toast` | UI icons and toast alerts |

---

## 📂 Project Directory Structure

```bash
invoice-dashboard/
├── PRD.md                         # Product Requirement Document (v2 B2B)
├── AGENTS.md                      # AI Agent & Developer Directives
├── api/                           # Vercel Serverless Functions
│   ├── create-firebase-token.js   # Clerk JWT -> Firebase custom token bridge
│   ├── accept-invite.js           # Server-side 6-digit passcode invite acceptance
│   ├── my-invites.js              # Fetch user's pending workspace invitations
│   ├── send-email.js              # Nodemailer email dispatcher (alerts & invites)
│   └── mailer.js                  # Gmail SMTP configuration & HTML templates
├── docs/                          # Technical specs & audit reports
├── src/
│   ├── main.jsx                   # React DOM Entrypoint
│   ├── App.jsx                    # Router Shell, InactivityLock, & Toaster
│   ├── index.css                  # Tailwind CSS v4 Theme & Base Styles
│   ├── auth/                      # Login & Register views
│   ├── components/                # Shared UI Components
│   │   ├── workspace/             # Workspace switcher, team, invites, settings, inactivity lock
│   │   ├── ActionMenu.jsx         # Row popover action menu
│   │   ├── GraphInvoice.jsx       # Recharts Analytics
│   │   ├── ImageUploader.jsx      # Company logo/signature uploader
│   │   ├── InvoiceView.jsx        # PDF Document Render component
│   │   ├── StatCard.jsx           # Analytics stat card
│   │   ├── customer/              # Customer components
│   │   ├── invoice/               # Invoice forms, tables, modals
│   │   └── product/               # Product catalog components
│   ├── contexts/                  # AuthContext & WorkspaceContext
│   ├── firebase/                  # Firestore service layer & config
│   ├── header/                    # Top navigation bar
│   └── pages/                     # Main Views (Home, Invoice, Customer, Product, ActivityLog)
├── .env.example                   # Environment variable template
├── package.json                   # Dependencies & scripts
├── vite.config.js                 # Vite build settings & local API middleware
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