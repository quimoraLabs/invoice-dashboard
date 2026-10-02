# Design System & UI Specifications

The design system is implemented with **Tailwind CSS v4** via native CSS tokens in `src/index.css` paired with headless interaction primitives from `@headlessui/react`.

---

## 1. Tailwind CSS v4 `@theme` & Breakpoints

Custom breakpoints and variants are declared natively in `src/index.css` using the v4 `@theme` directive and `@custom-variant`:

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --breakpoint-*: initial;
  --breakpoint-xsm: 480px;
  --breakpoint-sm: 720px;
  --breakpoint-md: 1024px;
  --breakpoint-lg: 1599px;
  --breakpoint-xl: 1999px;
}
```

---

## 2. Color Palette & Dark Mode Semantic Mappings

The UI uses Tailwind slate neutrals with indigo primary accents and semantic feedback states:

| Role | Light Mode Value / Class | Dark Mode Value / Class | Purpose |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#f8fafc` (`bg-slate-50`) | `#0f172a` (`dark:bg-slate-900`) | Main application viewport |
| **Surface Card** | `#ffffff` (`bg-white`) | `#1e293b` (`dark:bg-slate-800`) | Cards, tables, dropdown menus |
| **Border / Divider** | `#e2e8f0` (`border-slate-200`) | `#334155` (`dark:border-slate-700`) | Card outlines, row borders |
| **Primary Text** | `#0f172a` (`text-slate-900`) | `#f8fafc` (`dark:text-slate-100`) | Headers, lead titles, amounts |
| **Secondary Text** | `#64748b` (`text-slate-500`) | `#94a3b8` (`dark:text-slate-400`) | Subtitles, labels, descriptions |
| **Brand Accent** | `#4f46e5` (`bg-indigo-600`) | `#6366f1` (`dark:bg-indigo-500`) | Primary CTA buttons, active links |
| **Success State** | `#059669` (`text-emerald-600`) | `#34d399` (`dark:text-emerald-400`)| Paid badges, positive revenue |
| **Warning State** | `#d97706` (`text-amber-600`) | `#fbbf24` (`dark:text-amber-400`) | Pending status, expiring invoices |
| **Danger State** | `#e11d48` (`text-rose-600`) | `#f87171` (`dark:text-rose-400`) | Overdue badges, delete actions |

---

## 3. Typography Scale

The application font family defaults to `Inter, system-ui, sans-serif` declared on `:root`:

| Token | Size | Tracking / Weight | Standard Context |
| :--- | :--- | :--- | :--- |
| `text-xs` | 12px | `font-semibold uppercase tracking-wider` | Metric card category labels, table headers |
| `text-sm` | 14px | `font-medium` | Navigation links, form labels, body cells |
| `text-base` | 16px | `font-normal` | Form inputs, dialog body descriptions |
| `text-lg` | 18px | `font-semibold tracking-tight` | Modal headings, card titles |
| `text-2xl` | 24px | `font-bold tracking-tight` | Page headers, mobile KPI totals |
| `text-3xl` | 30px | `font-bold tracking-tight` | Desktop KPI numbers in `StatCard` |

---

## 4. Core Component Library

### A. `StatCard` (`src/components/StatCard.jsx`)
KPI presentation block displaying a category title, large metric amount, secondary text, and themed icon container.
* **Props:** `title` (string), `value` (string/number), `detail` (string), `iconName` (Feather icon string), `theme` (`"blue"` | `"purple"` | `"amber"` | `"emerald"`).
* **Hover Interaction:** Smooth `-translate-y-1` elevation with matching soft background glow (`hover:shadow-md`).

### B. `ActionMenu` (`src/components/ActionMenu.jsx`)
Headless row action menu powered by `@headlessui/react` `Menu`.
* **Props:** `data` (object), `onView(data)` (function), `onEdit(data)` (function), `onDelete(data)` (function).
* **Features:** Floating anchor positioning (`anchor="bottom end"`), overflow protection inside responsive tables, and destructive danger styling for delete options.

### C. `CustomDropdown` (`src/components/CustomDropdown.jsx`)
Accessible custom dropdown select powered by `@headlessui/react` `Listbox`.
* **Props:** `value` (any), `onChange(value)` (function), `options` (`Array<{ label, value }>`), `labelPrefix` (string), `readOnly` (boolean), `align` (`"left"` | `"right"`).
* **Styling:** Pill-shaped rounded trigger with chevron rotation and portal-anchored popover container (`z-50`).

### D. `InvoiceView` (`src/components/InvoiceView.jsx`)
Client-side PDF document layout and browser print wrapper.
* **Print Styles:** Configured with clean `@media print` CSS overrides (`@page { margin: 10mm; }`) stripping browser headers and footers.
* **Render Modes:** Live preview card with printable table and `@react-pdf/renderer` download blob compiler.

### E. `ImageUploader` (`src/components/ImageUploader.jsx`)
Interactive logo selector supporting local file drag-and-drop, preview clipping, and direct upload.

---

## 5. Universal Component States

* **Buttons & Clickables:** Universal pointer cursor (`cursor: pointer`), active press compression (`active:scale-95`).
* **Disabled Elements:** Handled via global rule `button:disabled, [role="button"][aria-disabled="true"] { cursor: not-allowed; opacity: 0.6; }`.
* **Modals & Overlays:** Backdrop blur with dark scrim (`bg-slate-900/40 backdrop-blur-xs z-50`).
