# 32. Architecture Decision Records (ADR)

---

## ADR-001: Adoption of Tailwind CSS v4 via `@tailwindcss/vite`
* **Status:** Accepted
* **Context:** Tailwind CSS v4 introduces engine improvements, native CSS `@theme` variables, and faster Vite build compilation.
* **Decision:** Use `@tailwindcss/vite` plugin with `@import "tailwindcss";` in `src/index.css`. Omit legacy `tailwind.config.js`.
* **Consequences:** Styling is clean, fast, and unified in CSS.

---

## ADR-002: Client-Side PDF Generation with `@react-pdf/renderer`
* **Status:** Accepted
* **Context:** Invoices require printable PDF downloads. Serverless Node/Puppeteer functions add latency, cold starts, and hosting cost.
* **Decision:** Render PDF documents directly inside the client browser using `@react-pdf/renderer`.
* **Consequences:** Zero backend compute cost, sub-second PDF downloads, and offline capability.

---

## ADR-003: React Context for Auth & Page-Level Hooks for Data
* **Status:** Accepted
* **Context:** Choosing state management pattern (Redux vs Zustand vs Context API).
* **Decision:** Use React Context API for global `AuthContext`. Use local component state & custom hooks for page data fetching.
* **Consequences:** Eliminates boilerplate state management libraries while keeping state localized and responsive.

---

## ADR-004: Tenant Isolation at Document Level in Firestore
* **Status:** Accepted
* **Context:** Multi-tenant invoice dashboard security requirement.
* **Decision:** Include `userId` field on every document across `invoices`, `customers`, `products`, `business_profiles` and enforce via `firestore.rules`.
* **Consequences:** Guarantees absolute tenant data security and simple query patterns.

---

## ADR-005: Migration from Firebase Auth to Clerk Auth (`@clerk/react`)
* **Status:** Accepted
* **Context:** Firebase Auth introduced environment mismatches between local dev and production environments, complex OAuth redirect handling, and multi-tenant session fragmentation.
* **Decision:** Adopt `@clerk/react` as the primary authentication engine while retaining Firebase Cloud Firestore and Storage for backend data. Wrap routes with `<ClerkProvider>` and use `clerkUser.id` for Firestore tenant isolation.
* **Consequences:** Zero-friction Google Sign-In, consistent local & production authentication behavior, and zero manual backend OAuth configuration.

---

## ADR-006: Dual Headless UI Dropdowns for Invoice Ledger Filtering & Sorting
* **Status:** Accepted
* **Context:** Purging hardcoded status pills and single reset buttons in favor of reusable, scalable filter controls.
* **Decision:** Standardize invoice filter controls in `InvoiceFilters.jsx` using the shared `@headlessui/react` `CustomDropdown` component (`CustomDropdown.jsx`), providing dedicated Status and Sort/New Arrivals dropdowns.
* **Consequences:** Cohesive UI across Customer, Product, and Invoice list views, extensible sort options (Newest First, Oldest First, Amount, Name A-Z/Z-A), and clean search bar styling.
