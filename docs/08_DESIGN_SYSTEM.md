# 08. Design System & Style Guide

---

## 1. Tailwind CSS v4 Theme Architecture

The design system is integrated into **Tailwind CSS v4** via `@import "tailwindcss";` and custom `@theme` variables in `src/index.css`.

### Actual Code Implementation (`src/index.css`):
```css
@import "tailwindcss";

:root {
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color: #0f172a;
  background-color: #f8fafc;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --breakpoint-*: initial;
  --breakpoint-xsm: 480px;
  --breakpoint-sm: 720px;
  --breakpoint-md: 1024px;
  --breakpoint-lg: 1599px;
  --breakpoint-xl: 1999px;

  /* Custom Color Tokens */
  --color-brand-primary: #4f46e5;
  --color-brand-hover: #4338ca;
  --color-brand-light: #e0e7ff;
  --color-status-paid: #10b981;
  --color-status-pending: #f59e0b;
  --color-status-overdue: #ef4444;
}
```

---

## 2. Design Tokens & Semantic Palette

### Primary Indigo Palette
* **Primary (Brand):** `#4f46e5` (`bg-indigo-600 text-white`)
* **Primary Hover:** `#4338ca` (`hover:bg-indigo-700`)
* **Primary Light:** `#e0e7ff` (`bg-indigo-50 text-indigo-700`)

### Semantic Status Colors
* **Paid State:** Emerald Green (`#10b981`, `bg-emerald-500/10 text-emerald-600 border-emerald-200`)
* **Pending State:** Amber Yellow (`#f59e0b`, `bg-amber-500/10 text-amber-600 border-amber-200`)
* **Overdue State:** Rose Red (`#ef4444`, `bg-rose-500/10 text-rose-600 border-rose-200`)
* **Draft State:** Slate Gray (`#64748b`, `bg-slate-500/10 text-slate-600 border-slate-200`)

---

## 3. Typography & Spacing Scale

* **Page Title (H1):** `text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white`
* **Section Heading (H2):** `text-lg font-semibold text-gray-800 dark:text-gray-100`
* **Body Text:** `text-sm text-gray-600 dark:text-gray-300`
* **Table Text:** `text-sm font-medium text-gray-900 dark:text-gray-200`
* **Cards & Surfaces:** `rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm`
* **Buttons:** `rounded-lg px-4 py-2 font-medium text-sm transition-all duration-150 active:scale-95`
