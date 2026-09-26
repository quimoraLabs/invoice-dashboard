# ⚡ Invoice Dashboard

A modern, high-performance, full-stack B2B/B2C invoicing and financial analytics SaaS application built with **React 19**, **Vite 8**, **Tailwind CSS v4**, and **Firebase (Auth & Firestore)**.

![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=for-the-badge&logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite)
![Firebase](https://img.shields.io/badge/Firebase-v12-ffca28?style=for-the-badge&logo=firebase)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

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
- 🔐 **Multi-Tenant Data Isolation:** Secure authentication via Firebase Auth (Google Sign-In & Email/Password) with strict `userId` Firestore query isolation.
- 🔔 **Instant Feedback:** Sleek toast notifications powered by `react-hot-toast` and interactive popover action menus.

---

## 📚 Technical Documentation Hub

This project is built following strict architectural specs. Detailed specs and design documents live in the [`/docs`](file:///d:/invoice-dashboard/docs/INDEX.md) directory:

- 📌 [**PRD (Product Requirement Document)**](file:///d:/invoice-dashboard/PRD.md)
- 📌 [**AGENTS.md (AI & Developer Directives)**](file:///d:/invoice-dashboard/AGENTS.md)
- 📄 [**Documentation Master Index**](file:///d:/invoice-dashboard/docs/INDEX.md)
- 📄 [**Master Context Snippet**](file:///d:/invoice-dashboard/docs/MASTER_CONTEXT.md)
- 🔴 [**01. Project Vision & Overview**](file:///d:/invoice-dashboard/docs/01_PROJECT_VISION.md)
- 🔴 [**03. Tech Stack & Architecture**](file:///d:/invoice-dashboard/docs/03_TECH_STACK_ARCHITECTURE.md)
- 🔴 [**05. Data Model & Firestore Schema**](file:///d:/invoice-dashboard/docs/05_FIRESTORE_SCHEMA.md)
- 🟡 [**08. Design System & Style Guide**](file:///d:/invoice-dashboard/docs/08_DESIGN_SYSTEM.md)
- 🟢 [**18. Payment Gateway Integration Spec**](file:///d:/invoice-dashboard/docs/18_PAYMENT_GATEWAY.md)
- 🔵 [**23. Security & Firestore Rules**](file:///d:/invoice-dashboard/docs/23_SECURITY_FIRESTORE_RULES.md)

---

## 🛠️ Tech Stack & Tooling

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 (`react`, `react-dom`) | Modern component model & hooks |
| **Build Tool** | Vite 8 (`@vitejs/plugin-react-swc`) | Ultra-fast HMR and bundle compilation |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`) | Native CSS theme tokens via `@import "tailwindcss"` |
| **Backend as a Service** | Firebase v12 | Firebase Authentication & Cloud Firestore Database |
| **Routing** | React Router v7 (`react-router-dom`) | Declarative client-side routing & route guards |
| **PDF Generation** | `@react-pdf/renderer` v4 | In-browser client PDF compilation |
| **Data Visualization** | Recharts v3 | Responsive revenue graphs & pie charts |
| **Icons & Alerts** | `react-icons` & `react-hot-toast` | UI icons and toast alerts |

---

## 📂 Project Directory Structure

```bash
invoice-dashboard/
├── PRD.md                         # Product Requirement Document
├── AGENTS.md                      # AI Agent & Developer Directives
├── docs/                          # Exhaustive Technical Specifications (34 files)
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
Create a `.env` file in the root directory and add your Firebase Web Configuration keys:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
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

Contributions are welcome! Please read the [**Contributing Guidelines**](file:///d:/invoice-dashboard/docs/28_CONTRIBUTING.md) before submitting pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/) (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**. See the `LICENSE` file for details.