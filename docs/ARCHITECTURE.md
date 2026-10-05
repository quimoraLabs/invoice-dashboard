# Architecture Specification

## 1. System Overview & Tech Stack

This application is a production-grade, multi-tenant B2B invoicing SaaS running on client-side rendering with cloud-backed persistence, role-based access control, and authentication.

| Layer | Technology | Key Responsibility |
| :--- | :--- | :--- |
| **UI Framework** | React 19 + Vite | Fast HMR, reactive component rendering, root shell |
| **Styling Engine** | Tailwind CSS v4 (`@tailwindcss/vite`) | High-performance CSS token-based design system |
| **Authentication** | Clerk Auth (`@clerk/react`) | Identity provider, session tokens, Custom Claims JWT delegation |
| **Database & Storage** | Firebase Cloud Firestore & Storage | Real-time document store, logo/asset binary storage |
| **Client Routing** | React Router v7 (`react-router-dom`) | Declarative client routing and route guards |
| **PDF Generation** | `@react-pdf/renderer` | Deterministic in-browser document compilation |
| **Data Viz & UI** | Recharts, `@headlessui/react`, React Icons | Dashboard analytics, accessible headless widgets |
| **Notifications** | `react-hot-toast` | Non-blocking async feedback toasts |

---

## 2. Directory Structure

```
d:\invoice-dashboard\
├── public/                 # Static assets and embedded web fonts (roboto.ttf)
├── docs/                   # Production specification and architecture documents
├── scripts/                # Server-side migration & administrative automation scripts
│   ├── migrate-to-b2b.js   # Main Node.js B2B migration runner
│   └── migrate-helpers.js  # Batch commit, rate limiting & retry utilities
├── src/
│   ├── auth/               # Clerk login & registration view shells
│   ├── assets/             # Brand logos, fallback placeholders, sample data
│   ├── components/         # Shared presentation & domain-specific widgets
│   │   ├── customer/       # Customer forms and list cards
│   │   ├── invoice/        # Invoice forms, filter bars, table rows
│   │   ├── modals/         # Delete confirmations, add dialogs
│   │   ├── product/        # Product modals and line item selectors
│   │   ├── workspace/      # Organization/Workspace switcher & team dialogs
│   │   ├── ActionMenu.jsx  # Reusable headless item action menu
│   │   ├── CustomDropdown.jsx # Headless accessible dropdown selector
│   │   ├── GraphInvoice.jsx# Dashboard revenue and invoice metric charts
│   │   ├── InvoiceView.jsx # PDF preview & printable layout
│   │   ├── Loader.jsx      # Unified spinner and skeleton loader
│   │   ├── ProtectedRoute.jsx # Route-level authentication guard
│   │   └── StatCard.jsx    # Metric KPI summary card
│   ├── contexts/           # Global React Context providers (AuthContext, WorkspaceContext)
│   │   ├── authContext/    # Clerk session bridge & Firebase custom token exchange
│   │   └── WorkspaceContext.jsx # Multi-tenant active organization state & token resolver
│   ├── firebase/           # Service-layer Firebase SDK wrappers & configs
│   ├── header/             # Global sticky navigation bar, org switcher & user profile
│   ├── pages/              # Primary route views (Home, Invoice, Customer, Product)
│   ├── App.jsx             # Top-level route tree and layout shell
│   ├── index.css           # Tailwind v4 theme tokens & global base styles
│   ├── tokens.css          # Semantic light/dark design tokens
│   └── main.jsx            # React root mount and ClerkProvider initialization
```

---

## 3. Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Presentation Layer                    │
│   src/pages/ (Home, Invoice, Customer, Product)             │
│   src/components/ (Domain widgets, Modals, ActionMenu)      │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│        Context Layer         │ │     Service Layer (API)     │
│  src/contexts/authContext/   │ │  src/firebase/              │
│  - Clerk session sync        │ │  - customer.js, product.js  │
│  src/contexts/WorkspaceContext│ │  - invoice.js, getFileUrl.js│
│  - Active orgId & role sync  │ │  - Direct Firestore queries │
│  - Token refresh on switch   │ │  - Scoped by orgId          │
└──────────────┬───────────────┘ └─────────────┬───────────────┘
               │                               │
               └───────────────┬───────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure / Backend                  │
│       Clerk Auth API  │  Cloud Firestore  │  Cloud Storage   │
└─────────────────────────────────────────────────────────────┘
```

### Layer Boundaries & Invariants
1. **View Layer (`src/pages`, `src/components`):** Responsible only for rendering state, capturing UI events, and triggering local state transitions. No direct calls to low-level Firestore SDK primitives (`collection`, `getDocs`, `onSnapshot`).
2. **Context Layer (`src/contexts/`):**
   * `AuthContext`: Bridges Clerk authentication with Firebase. Listens to Clerk session state, retrieves Clerk JWT custom tokens created for Firebase, signs into Firebase Auth via `signInWithCustomToken`, and exposes `currentUser` / `userLoggedIn`.
   * `WorkspaceContext`: Manages the active multi-tenant organization state (`activeOrgId`, `currentRole`), resolves user memberships, and triggers token refreshes on organization switches.
3. **Service Layer (`src/firebase`):** Encapsulates all Firestore queries, constraints, mutations, and real-time listeners. Every function explicitly accepts `orgId` and `actorUserId`, enforcing strict organization tenant isolation.

---

## 4. Client-Side PDF Generation Strategy

Instead of relying on serverless Node.js Puppeteer functions (which introduce cold starts, latency, and hosting overhead), PDF rendering is executed entirely within the client runtime:

* **Engine:** `@react-pdf/renderer` parses invoice state into vector document primitives (`Document`, `Page`, `View`, `Text`, `Image`).
* **Font Asset Loading:** Standardized Roboto font family registered from `/public/roboto.ttf` to eliminate missing font glyph glitches across operating systems.
* **Deterministic Layout:** Uses fixed point metrics (`pt`) rather than fluid viewport CSS units, guaranteeing consistent line wraps and page boundaries across print targets.
* **Execution Flow:** 
  1. User triggers PDF view/download from `InvoiceDetailPage` or `InvoiceView`.
  2. Data is normalized (customer details, item list, tax calculation, company branding).
  3. `<PDFDownloadLink>` or `<PDFViewer>` compiles the document into an in-memory blob.
  4. The browser triggers a direct file download or displays the preview modal without hitting external servers.

---

## 5. Architectural Decision Records (ADR)

### ADR-001: Tailwind CSS v4 Engine Standard
* **Decision:** Use `@tailwindcss/vite` without legacy `tailwind.config.js`. Define custom theme breakpoints and base tokens in `src/index.css` via `@theme`.
* **Rationale:** Reduces configuration overhead, accelerates Vite builds, and provides native CSS variable theme management.

### ADR-002: In-Browser Client-Side PDF Rendering
* **Decision:** Compile invoices via `@react-pdf/renderer` in the browser runtime.
* **Rationale:** Eliminates backend compute costs, supports offline preview, and removes cold-start latency associated with serverless rendering engines.

### ADR-003: Hybrid Clerk Authentication + Firebase Persistence
* **Decision:** Use Clerk (`@clerk/react`) as the primary identity manager and Cloud Firestore for document storage. Authenticate Firebase sessions using Clerk Firebase JWT templates.
* **Rationale:** Provides streamlined authentication UX, social logins, and account management while leveraging Firestore's real-time subscriptions and cost efficiency.

### ADR-004: Organization-Scoped Multi-Tenant Isolation
* **Decision:** Stamp every domain document (`invoices`, `customers`, `products`, `business_profiles`) with `orgId` as the primary tenant key, and enforce security boundaries using Clerk Custom Claims (`request.auth.token.orgId` and `request.auth.token.role`).
* **Rationale:** Enables true B2B organization isolation, multi-user collaboration, granular role-based permissions (`owner`, `admin`, `accountant`, `viewer`), and $O(1)$ Firestore rule evaluation without runtime database read overhead.
