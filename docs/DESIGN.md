# Design System & UI Specifications

The design system is implemented with **Tailwind CSS v4** via native CSS tokens in `src/index.css` paired with headless interaction primitives from `@headlessui/react`.

---

## 1. Tailwind CSS v4 `@theme` & Breakpoints

Standardized responsive breakpoints are declared natively in `src/index.css` using the Tailwind v4 `@theme` directive (see full responsive directives in [RESPONSIVE.md](file:///d:/invoice-dashboard/docs/RESPONSIVE.md)):

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --breakpoint-*: initial;
  --breakpoint-xs: 390px;
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}
```

---

## 2. Color Palette & CSS Variable-Based Semantic Tokens

The UI uses semantic CSS tokens defined in `src/tokens.css` and mapped to Tailwind v4 inline theme via `src/index.css`:

| Semantic Token | Tailwind Class | Light Mode Value | Dark Mode Value | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `--background` | `bg-background` | `#ffffff` | `#09090b` (zinc-950) | Main viewport canvas background |
| `--surface` | `bg-surface` | `#fafafa` | `#18181b` (zinc-900) | Secondary / muted surface background |
| `--surface-elevated` | `bg-surface-elevated` | `#ffffff` | `#27272a` (zinc-800) | Cards, modals, dropdown menus |
| `--muted` | `bg-muted` | `#f4f4f5` | `#27272a` (zinc-800) | Muted badges, skeleton placeholders |
| `--border` | `border-border` | `#e4e4e7` | `#334155` / `#3f3f46` | Outlines, table borders, dividers |
| `--input` | `border-input` | `#e4e4e7` | `#3f3f46` | Input element borders |
| `--foreground` | `text-foreground` | `#18181b` | `#f4f4f5` (zinc-100) | Primary text, titles, values |
| `--muted-foreground` | `text-muted-foreground` | `#71717a` | `#a1a1aa` (zinc-400) | Subtitles, labels, descriptions |
| `--primary` | `bg-primary`, `text-primary` | `#4f46e5` (indigo-600) | `#6366f1` (indigo-500) | Primary CTA buttons, active links |
| `--primary-hover` | `hover:bg-primary-hover` | `#4338ca` | `#818cf8` | Hover state for primary actions |
| `--success` | `text-success`, `bg-success` | `#059669` | `#34d399` | Paid badges, positive revenue |
| `--warning` | `text-warning`, `bg-warning` | `#d97706` | `#fbbf24` | Pending status, warnings |
| `--danger` | `text-danger`, `bg-danger` | `#e11d48` | `#f87171` | Overdue badges, destructive actions |

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
