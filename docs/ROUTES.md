> ⚠️ **TARGET-STATE DOCUMENT — NOT CURRENT BEHAVIOR.**
> This document describes the planned B2B (multi-tenant) design. It does not describe what the code does today, and it uses `orgId` / `organization` vocabulary while the code uses `workspace`.
> **Known divergence:** Route paths in `src/App.jsx` are the source of truth. Role- and organization-aware guards described here are not implemented; `ProtectedRoute` only checks authentication.
> For current behavior see [CURRENT_STATE.md](./CURRENT_STATE.md). For the doc map see [INDEX.md](./INDEX.md). Do not implement from this document without explicit phase approval.
> Last reviewed against code: 2026-10-06

---

# Routing Table & Access Guards Specification

The application routes are centralized in `src/App.jsx` using React Router v7 (`react-router-dom`) with declarative guards implemented in `src/components/ProtectedRoute.jsx`.

---

## 1. Master Route Table

| Path Pattern | Component View | Guard Type | Shell Header | Purpose |
| :--- | :--- | :--- | :---: | :--- |
| `/` | `Navigate to="/home"` | Redirect | Hidden | Default root entry redirect |
| `/login/*` | `Login.jsx` | `PublicOnlyRoute` | Hidden | Clerk email/password and OAuth sign-in |
| `/register/*` | `Register.jsx` | `PublicOnlyRoute` | Hidden | New user onboarding sign-up |
| `/home` | `Home.jsx` | `ProtectedRoute` | Visible | Main dashboard, metrics & recent invoices |
| `/invoice` | `Invoice/index.jsx` | `ProtectedRoute` | Visible | Master invoice ledger with filter/search |
| `/invoice/create` | `AddInvoice.jsx` | `ProtectedRoute` | Visible | Multi-line invoice authoring form |
| `/invoice/view/:invoiceId` | `ViewInvoice.jsx` | `ProtectedRoute` | Visible | Printable invoice view & PDF export |
| `/invoice/update/:invoiceId` | `UpdateInvoice.jsx`| `ProtectedRoute` | Visible | Existing invoice editor |
| `/customers` | `Customer/index.jsx`| `ProtectedRoute` | Visible | Client directory listing & management |
| `/products` | `Product/index.jsx` | `ProtectedRoute` | Visible | Product/service pricing catalog |
| `*` | `Navigate to="/login"` | Catch-All Fallback | Hidden | 404 fallback redirect |

---

## 2. Guard Behaviors & State Transitions

### A. `ProtectedRoute`
Wraps private pages to prevent unauthenticated access:
1. **Loading State:** While `loading` from `useAuth()` is `true`, renders a centered spinner (`h-8 w-8 animate-spin border-indigo-600`) and halts route rendering.
2. **Unauthenticated State:** If `userLoggedIn` is `false`, renders `<Navigate to="/login" replace />`.
3. **Authenticated State:** Renders child component within the active layout.

### B. `PublicOnlyRoute`
Wraps auth entry points (`/login/*`, `/register/*`):
1. **Loading State:** Renders a centered spinner during auth initialization.
2. **Authenticated State:** If an already authenticated user accesses `/login` or `/register`, immediately redirects to dashboard: `<Navigate to="/home" replace />`.
3. **Unauthenticated State:** Renders the authentication form.

```
       Unauthenticated User                      Authenticated User
       ────────────────────                      ──────────────────
  Access /home     ──► Redirect to /login    Access /home     ──► Render Dashboard
  Access /invoice  ──► Redirect to /login    Access /login    ──► Redirect to /home
  Access /login    ──► Render Login Form     Access /register ──► Redirect to /home
```

---

## 3. Shell Layout & Navbar Visibility Rules

The main application shell (`AppShell` in `src/App.jsx`) conditionally renders the top navigation bar (`<Header />`) and sets body padding:

* **Authentication Pages:**
  * Determined by: `pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/register")`
  * Layout: `<Header />` is unmounted. Main wrapper has `className="min-h-screen"` (no top padding).
* **Protected Dashboard Pages:**
  * Layout: `<Header />` is permanently mounted at the top (`fixed top-0 inset-x-0 h-14 z-40`).
  * Main wrapper has `className="pt-14 min-h-screen"` to prevent page content from being obscured beneath the fixed header.

---

## 4. Deep-Link & Dynamic Parameter Resolution

* **Invoice Details (`/invoice/view/:invoiceId`):**
  * Extracts `:invoiceId` via `useParams()`.
  * Fetches document from Firestore via `getInvoiceById(invoiceId, orgId)`.
  * If record does not exist or belongs to another organization tenant, displays error toast and redirects back to `/invoice`.
* **Invoice Editor (`/invoice/update/:invoiceId`):**
  * Loads existing invoice payload into form inputs scoped by `orgId`.
  * Preserves original `createdAt` timestamp and `invoiceNumber` while submitting updated item arrays.
