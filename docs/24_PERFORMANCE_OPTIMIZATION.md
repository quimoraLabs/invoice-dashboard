# 24. Performance Optimization Document

---

## 1. Performance Targets & Budgets
* **JS Initial Bundle Size:** < 250 KB (gzipped)
* **First Contentful Paint (FCP):** < 1.0s
* **Time to Interactive (TTI):** < 1.8s
* **Lighthouse Performance Score:** > 90/100

---

## 2. Optimization Strategies

### A. Dynamic Lazy Loading & Code Splitting
Heavy dependencies (`@react-pdf/renderer` and `recharts`) are dynamically imported via React `React.lazy()` to prevent inflating the initial page load bundle:

```jsx
const RechartsGraph = React.lazy(() => import('./components/GraphInvoice'));
const InvoicePDFView = React.lazy(() => import('./components/InvoiceView'));
```

### B. Rollup Bundle Visualizer Analysis
Build configured with `rollup-plugin-visualizer` to monitor chunk distribution:
```bash
npm run build # Generates stats.html to audit bundle size
```
