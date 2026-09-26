# 49. Browser Compatibility & Matrix Specification

---

## 1. Supported Browser Matrix

| Browser | Minimum Version | Support Level | Known Limitations / Notes |
| :--- | :--- | :--- | :--- |
| **Google Chrome** | v100+ | Full Support | Primary target |
| **Mozilla Firefox** | v100+ | Full Support | High performance PDF rendering |
| **Apple Safari** | v15.4+ | Full Support | Requires modern CSS `@container` & dialog support |
| **Microsoft Edge** | v100+ | Full Support | Chromium engine parity |
| **iOS Safari** | v15.4+ | Full Support | Touch-friendly action sheets |
| **Android Chrome** | v100+ | Full Support | Full responsive layout support |

---

## 2. Polyfills & Feature Detection
* **`ResizeObserver`:** Standard in modern browsers; polyfilled in JSDOM test suite.
* **`Intl.NumberFormat`:** Supported natively in all target engines (ES2022 build target).
* **CSS Custom Variants (`@custom-variant dark`):** Supported via `@tailwindcss/vite` build transformation.
