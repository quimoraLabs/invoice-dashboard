# 06. Application Route Map

---

## 1. Route Table Overview

| Path | Component | Access Level | Layout Wrapper | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `Login.jsx` | Public | Auth Shell | Default fallback / Sign in view |
| `/login` | `Login.jsx` | Public | Auth Shell | Email/Password & Google Sign In |
| `/register` | `Register.jsx` | Public | Auth Shell | Account registration view |
| `/home` | `Home.jsx` | Protected | Dashboard Header | Main Dashboard (Analytics & Overview) |
| `/invoice` | `pages/invoice/index.jsx` | Protected | Dashboard Header | Invoice List & Management Table |
| `/invoice/create` | `AddInvoice.jsx` | Protected | Dashboard Header | New Invoice Creation Form |
| `/invoice/view/:invoiceId` | `ViewInvoice.jsx` | Protected | Dashboard Header | Invoice Details & PDF Viewer |
| `/invoice/update/:invoiceId` | `UpdateInvoice.jsx` | Protected | Dashboard Header | Edit Existing Invoice |
| `/customers` | `pages/customer/index.jsx` | Protected | Dashboard Header | Customer Management Directory |
| `/products` | `pages/product/index.jsx` | Protected | Dashboard Header | Product Catalog & Price List |
| `/settings` | `pages/settings/index.jsx` | Protected | Dashboard Header | Business Profile & Billing Settings (v2) |
| `*` | `Login.jsx` | Public | Auth Shell | Catch-all redirect to Login |

---

## 2. Guard Behavior Rules
1. **Unauthenticated User Attempting Protected Route:**
   * Automatically redirected to `/login`.
   * Preserves requested target URL in query string (`/login?redirectTo=/invoice/create`) for seamless post-login redirection.

2. **Authenticated User Attempting Auth Route (`/login` or `/register`):**
   * Automatically redirected to `/home`.

3. **Missing Resource (`/invoice/view/non-existent-id`):**
   * Renders 404 state with "Invoice Not Found" action button back to `/invoice`.
