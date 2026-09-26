# 11. Dark Mode Specification

---

## 1. Dark Mode Token Mappings

Tailwind CSS v4 class-based dark mode (`dark:bg-slate-900`, `dark:text-white`).

| Element | Light Mode Tokens | Dark Mode Tokens |
| :--- | :--- | :--- |
| **Page Background** | `bg-gray-50` | `dark:bg-gray-900` |
| **Card / Surface** | `bg-white border-gray-200` | `dark:bg-gray-800 dark:border-gray-700` |
| **Primary Text** | `text-gray-900` | `dark:text-gray-100` |
| **Secondary Text** | `text-gray-600` | `dark:text-gray-400` |
| **Table Header** | `bg-gray-100 text-gray-700` | `dark:bg-gray-800 dark:text-gray-300` |
| **Input Fields** | `bg-white border-gray-300 text-gray-900` | `dark:bg-gray-700 dark:border-gray-600 dark:text-white` |

---

## 2. Theme Persistence & Toggle Logic

* Theme state stored in `localStorage.getItem('theme')` (`'dark'` or `'light'`).
* Auto-detects OS preference via `window.matchMedia('(prefers-color-scheme: dark)')` if no explicit key exists.
* Toggles `dark` class on root HTML node (`document.documentElement.classList.toggle('dark')`).
