# RESPONSIVE.md — B2B Responsive & Mobile Strategy Specification
## Invoice Dashboard (Multi-Tenant SaaS Migration)

---

## 🎯 Executive Summary & Purpose
This document establishes the **binding responsive and mobile design directives** for the transition from a single-user client application to a **dense, multi-tenant B2B SaaS platform**.

B2B platforms introduce high-density information architecture: workspace switchers, team rosters, multi-role dropdowns, invite modals, dense invoice ledgers, and usage-based subscription tiers. Every directive in this document is **mandatory** for all component implementations.

---

## 📐 1. Breakpoint Audit & Recommendation

### 1.1 Current Breakpoint Evaluation
The legacy custom breakpoints (`--breakpoint-xsm: 480px`, `--breakpoint-sm: 720px`, `--breakpoint-md: 1024px`, `--breakpoint-lg: 1599px`, `--breakpoint-xl: 1999px`) have significant defects for a modern B2B SaaS:

1. **`sm: 720px` misses the entire tablet class (768px - 834px):** iPad Mini/Air/Pro devices in portrait mode land at `768px` to `834px`. A `720px` threshold causes unexpected layout reflows between mobile and tablet ranges.
2. **`xsm: 480px` creates an orphaned mobile gap:** Modern mobile viewports range between `360px` and `430px`. A `480px` breakpoint fails to trigger on standard mobile screens, rendering mobile-first designs inert until phablet/small tablet sizes.
3. **`lg: 1599px` is excessively wide for desktop switching:** Standard 13-inch and 14-inch laptops (MacBook Air/Pro at `1280px`–`1440px`) would fall under `md` (tablet/small desktop), resulting in oversized mobile navigation or cramped multi-column grids on standard workstations.

### 1.2 Final B2B Breakpoint Set (Standardized Tailwind v4 `@theme`)
We standardize on industry-aligned, device-accurate breakpoints within `src/index.css`:

```css
@theme {
  --breakpoint-*: initial;
  --breakpoint-xs: 390px;    /* Flagship mobile (iPhone 14/15/16, Galaxy S24) */
  --breakpoint-sm: 640px;    /* Large mobile / Small tablets (Landscape phone) */
  --breakpoint-md: 768px;    /* Tablets portrait (iPad, Surface) / Mobile Drawer Breakpoint */
  --breakpoint-lg: 1024px;   /* Tablets landscape / Small Laptops (iPad Pro, 11-13" screens) */
  --breakpoint-xl: 1280px;   /* Standard Desktop / High-Density B2B Grid (13-15" Laptops) */
  --breakpoint-2xl: 1536px;  /* Wide Workstation / Multi-Panel Ledgers (1080p+ Monitors) */
}
```

#### Breakpoint Justification Matrix:
| Token | Pixel Value | Target Device Categories | Architectural Purpose |
| :--- | :--- | :--- | :--- |
| **`xs`** | `390px` | Standard modern mobile (390px–430px) | Single-column form compacting, small CTA padding adjustments |
| **`sm`** | `640px` | Large phones, landscape mobile | 2-column KPI grid activation, search bar expansion |
| **`md`** | `768px` | Tablet portrait (768px–834px) | **Critical boundary:** Desktop Navbar ⇄ Mobile Hamburger menu, Table card ⇄ horizontal scroll switch |
| **`lg`** | `1024px` | Tablet landscape, small laptops | Sidebar layout emergence, 3-column dashboard grid, full table column expansion |
| **`xl`** | `1280px` | Standard 1080p laptops / 1440px displays | 4-column KPI metrics, dense split-pane invoice builder |
| **`2xl`**| `1536px` | Ultrawide / 4K multi-window | Max-width constraint boundary (`max-w-7xl` centering) |

---

## 📱 2. Viewport Targets & Mapping

All B2B user interfaces must be tested and verified against the following viewport targets:

| Device Category | Target Viewport Widths | Mapped Breakpoint Class | Behavior Archetype |
| :--- | :--- | :--- | :--- |
| **Compact Mobile** | `360px` – `375px` (SE, Android) | `< xs` (Base mobile) | 100% full-width stacked cards, sticky bottom action bar |
| **Standard Mobile**| `390px` – `430px` (iPhone 15/16, Pixel) | `xs` to `< sm` | 100% full-width stacked cards, tight gutters (`px-4`) |
| **Phablet / Land** | `480px` – `640px` | `sm` to `< md` | 2-column KPI grid, inline search with filter toggle button |
| **Tablet Portrait**| `768px` – `834px` (iPad, Tab S9) | `md` to `< lg` | Collapsed mobile menu, horizontal scrolling tables with sticky actions |
| **Tablet Landscape**| `1024px` – `1200px` (iPad Pro) | `lg` to `< xl` | Full desktop header, full table columns visible, 2-column form grids |
| **Desktop Workstation** | `1280px`, `1440px`, `1920px` | `xl`, `2xl` | 4-column KPI cards, fixed multi-pane builders, expanded workspace menus |

---

## 🧩 3. Responsive Behavior Rules Per Shared Component

### 3.1 `Header` (`src/header/index.jsx`)
* **Mobile & Tablet (`< md` / `< 768px`):**
  * Logo and Brand badge left-aligned (`h-8 w-8`).
  * Workspace Switcher displays **Compact Pill** (Icon + Workspace Name truncated to 100px + Role Badge hidden or iconified).
  * Navigation links (`Dashboard`, `Customers`, `Products`, `Invoices`) are **hidden** behind a slide-over drawer triggered by `HiMenu`.
  * Theme toggle and User profile avatar remain in the top-right bar (`h-16`).
* **Desktop (`≥ md` / `≥ 768px`):**
  * Full horizontal pill navigation with icons and labels.
  * Workspace Switcher shows full name (up to 160px), role badge (`OWNER`, `ADMIN`), and dropdown chevron.
  * Right-side utility cluster: Dark mode toggle, Quick Seed dropdown, Clerk User profile button.

### 3.2 `StatCard` (`src/components/StatCard.jsx`)
* **Mobile (`< sm`):** Grid layout `grid-cols-1 gap-3.5`. Value typography scales down to `text-2xl font-bold` to prevent text truncation with currency symbols (`₹`).
* **Tablet (`sm` to `< lg`):** Grid layout `grid-cols-2 gap-4`.
* **Desktop (`≥ lg`):** Grid layout `grid-cols-4 gap-5`. Icon containers remain fixed at `h-11 w-11`.

### 3.3 `ActionMenu` (`src/components/ActionMenu.jsx`)
* **All Viewports:** Uses `@headlessui/react` `MenuItems` with fixed anchor positioning (`anchor="bottom end"`).
* **Mobile Constraint:** Menu width fixed to `w-48`. Must never overflow viewport boundaries. Z-index strictly locked to `z-50`.
* **Touch Target Rule:** Every item button inside `ActionMenu` must satisfy a minimum touch height of `py-3` (`44px` physical tap area) on touch devices.

### 3.4 `CustomDropdown` (`src/components/CustomDropdown.jsx`)
* **Mobile (`< md`):** Full-width trigger (`w-full`), dropdown list max-height capped at `max-h-60` with smooth touch scroll and subtle inner shadow indicators.
* **Desktop (`≥ md`):** Intrinsic width (`w-52` or auto-anchored), anchored to parent button bottom edge.

### 3.5 `InvoiceView` (`src/components/InvoiceView.jsx`)
* **Mobile (`< md`):** Invoice preview renders inside a horizontal overflow sandbox (`overflow-x-auto`) wrapped in a zoomed-out preview card, OR stacked item summary list. Top action bar (Download PDF, Print, Share) converts into a **sticky bottom floating bar** (`fixed bottom-4 inset-x-4 z-40`).
* **Desktop (`≥ md`):** Full A4 proportional canvas (`max-w-4xl`), dual-column header (Company Details vs Client Info), inline top action buttons.
* **Print (`@media print`):** All viewports strip application navigation, sidebars, headers, and backgrounds. Canvas renders 100% width with standard 10mm margins.

### 3.6 `ImageUploader` (`src/components/ImageUploader.jsx`)
* **Mobile (`< sm`):** Drag-and-drop dropzone converts into a direct tap-to-upload button with visual camera/photo icon. Preview thumbnail displays centered above input.
* **Desktop (`≥ sm`):** Full dashed border dropzone with drag-over hover feedback, dimensions `h-32 w-full`.

### 3.7 `Loader` (`src/components/Loader.jsx`)
* **Universal:** Centered screen overlay with backdrop blur `backdrop-blur-xs` and spinner sized at `h-10 w-10`. Must prevent underlying page scrolling (`overflow-hidden` on body when active).

### 3.8 Recharts Revenue Graph (`src/pages/home/index.jsx`)
* **Mobile (`< sm`):** Chart height locked to `h-[240px]`. X-axis labels reduce tick frequency (show every 2nd or 3rd month/date). Tooltip positioned statically or with touch-point tracking. Y-axis labels formatted in compact abbreviations (`₹10k`, `₹1L`).
* **Desktop (`≥ lg`):** Chart height locked to `h-[340px]`. Full gridlines, complete month labels, multi-series legends enabled.

---

## 📊 4. Data-Dense UI Patterns

### 4.1 Table Strategy: Hybrid Adaptive Architecture
B2B tables (`invoices`, `customers`, `products`, `workspace_members`) MUST follow this dual pattern:

1. **Mobile (`< md` / `< 768px`) — Card-List Pattern:**
   * Do NOT render dense multi-column horizontal scrolling tables on phones unless explicitly toggled by the user.
   * Instead, render a clean **Card-List**:
     * **Top Row:** Primary Title / Name (Bold `text-sm text-foreground`) + Status Badge (`Paid`, `Pending`).
     * **Middle Row:** Secondary metadata (Date, Customer Name, Category) in `text-xs text-muted-foreground`.
     * **Bottom Row:** Monetary Amount (`text-base font-bold text-foreground`) + `ActionMenu` trigger button.
2. **Tablet & Desktop (`≥ md` / `≥ 768px`) — Dense Tabular Layout:**
   * Standard `<table>` with `<thead>` fixed in `bg-surface border-b border-border`.
   * Columns hide progressively based on priority:
     * *Always Visible:* Name/ID, Status, Amount/Price, Actions.
     * *Visible `≥ md` (768px):* Date, Category, Phone.
     * *Visible `≥ lg` (1024px):* Email, Address, GSTIN, Due Date.
     * *Visible `≥ xl` (1280px):* CreatedBy User, Notes snippet.

### 4.2 Modal Strategy: Responsive Sheet-to-Dialog
* **Mobile (`< md` / `< 768px`):**
  * Modals transform into **Bottom Sheets** or **Full-Screen Canvas Panels**:
    * Position: `fixed inset-x-0 bottom-0 max-h-[92vh] rounded-t-[24px] border-t border-border bg-surface-elevated p-5 shadow-2xl overflow-y-auto`.
    * Sticky Header with title and explicit Close (`X`) touch button.
    * Sticky Bottom Action Bar containing Cancel and Submit buttons.
* **Desktop (`≥ md` / `≥ 768px`):**
  * Centered floating dialog:
    * Position: `fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs`.
    * Dialog card: `w-full max-w-lg lg:max-w-2xl rounded-2xl border border-border bg-surface-elevated p-6 shadow-2xl`.

### 4.3 Multi-Column Form Stacking Strategy
* **Mobile (`< md`):**
  * **Strict Single Column Rule:** Every multi-column form (Invoice Line Items, Customer Address fields, Business Profile) collapses into `grid-cols-1 gap-4`.
  * Input field touch targets must be at least `h-11` (`44px`) with `text-base` font size to prevent automatic iOS Safari viewport zooming.
* **Desktop (`≥ md`):**
  * Invoice Line Items: 5-column inline grid (`Product` [4 cols], `Qty` [1 col], `Price` [2 cols], `Total` [2 cols], `Delete` [1 col]).
  * Customer Form: 2-column grid (`grid-cols-2 gap-4`).
  * Profile Form: 2-column grid with sticky sidebar summary.

---

## 🏢 5. B2B-Specific Pre-Decisions (Immediate Directives)

To prevent architectural rework during the multi-tenant migration, the following B2B component patterns are **locked in**:

### 5.1 Workspace Switcher (Header)
* **Mobile Pattern:**
  * Displays as an icon-only or compact pill (`h-9 px-2.5`) next to the brand logo.
  * Clicking opens a **Bottom Sheet Drawer** listing all user organizations, current active status, and an "Add New Workspace" action.
* **Desktop Pattern:**
  * Displays full dropdown pill with Workspace name, Role tag (`OWNER`, `ACCOUNTANT`), and chevron.

### 5.2 Team Member Directory & Invite Modal
* **Member List UI:**
  * *Mobile:* Card list displaying Avatar, Full Name, Role badge (inline select), and 3-dots action menu.
  * *Desktop:* 5-column table (`Member`, `Email`, `Role`, `Joined Date`, `Actions`).
* **Invite Modal:**
  * *Mobile:* Single column stack: Email input → Role radio group (large tap cards) → "Send Invitation" button at bottom.
  * *Desktop:* Modal dialog with inline role select dropdown.

### 5.3 Role & Permission Dropdowns
* **Mobile Pattern:**
  * Native or anchored Listbox with high visual contrast. Each role option displays Role Name (`Admin`, `Accountant`, `Viewer`) plus a 1-line description of permissions underneath.

### 5.4 Pricing & Subscription Upgrade Page
* **Mobile (`< lg`):**
  * Tier cards stack vertically (`1 column`). Monthly/Annual toggle sticks beneath header.
  * Feature comparison table collapses into accordion drawers per tier.
* **Desktop (`≥ lg`):**
  * 3-column side-by-side tier cards with highlighted "Popular / Pro" card elevation (`scale-105 border-primary`).

---

## 🎨 6. Token & Typography Adjustments for Mobile

### 6.1 Font Size Mapping
To prevent iOS Safari from zooming in on inputs, all form input font sizes must use `text-base` (16px) on mobile viewports:

| UI Element | Mobile (`< md`) | Desktop (`≥ md`) | Tailwind Class Strategy |
| :--- | :--- | :--- | :--- |
| **Page Title (`h1`)** | `text-xl font-bold` (20px) | `text-2xl sm:text-3xl font-bold` | `text-xl sm:text-2xl lg:text-3xl font-bold text-foreground` |
| **Section Header (`h2`)** | `text-lg font-semibold` | `text-xl font-semibold` | `text-lg sm:text-xl font-semibold text-foreground` |
| **KPI Big Number** | `text-2xl font-bold` | `text-3xl font-bold` | `text-2xl lg:text-3xl font-bold text-foreground tabular-nums` |
| **Form Inputs** | `text-base` (16px, Prevents Zoom)| `text-sm` (14px) | `text-base sm:text-sm` |
| **Table Cell Text** | `text-xs` / `text-sm` | `text-sm` | `text-xs sm:text-sm` |

### 6.2 Padding & Gutter Tokens
* **Page Containers:** `p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto`.
* **Card Inner Spacing:** `p-4 sm:p-6`.
* **Input Heights:** `h-11 sm:h-10` (Enforcing touch-first minimum tap target on mobile).

---

## ✅ 7. Verification Checklist for Subsequent B2B UI Steps

Before marking any future B2B UI task complete, the implementer must verify against this checklist:

- [ ] **No Horizontal Canvas Leak:** Viewport at `360px` and `390px` has zero horizontal scrollbar on the page body (`overflow-x-hidden`).
- [ ] **Touch Target Compliance:** All buttons, dropdown items, and table action triggers have at least `40px`–`44px` physical tap area.
- [ ] **No Input Zoom on iOS:** All text, email, number, and select inputs have `text-base sm:text-sm` font size.
- [ ] **Table Integrity:** Tables either collapse into cards on mobile OR provide smooth horizontal scrolling with visible row bounds.
- [ ] **Modal Usability:** Modals open cleanly on `360px`–`390px` mobile screens without clipping action buttons off-screen.
- [ ] **Dropdown Positioning:** `@headlessui/react` popovers (`ActionMenu`, `WorkspaceSwitcher`, `CustomDropdown`) never render off-screen or get clipped by table parent containers.
- [ ] **Build Validation:** Production bundle builds cleanly (`npm run build`) with zero lint or JSX layout warnings.

---

## 📌 8. Document Authority & Enforcement
This document is the **definitive responsive guide** for all B2B multi-tenant features. Any pull request or automated code generation violating these rules must be rejected and refactored to comply with this specification.
