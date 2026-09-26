# 31. Known Issues & Tech Debt Inventory

---

## 1. Technical Debt Inventory

| Item ID | Description | Severity | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **TD-01** | `package.json` package name is set to default `"react-firebase"` | Low | Cosmetic | Update `package.json` name to `"invoice-dashboard"` |
| **TD-02** | Hardcoded route guards in `AppShell` (`isAuthPage` check) | Medium | Maintenance | Extract dedicated `<ProtectedRoute>` and `<PublicRoute>` wrapper components |
| **TD-03** | Lack of explicit error boundary wrapping page components | Medium | Reliability | Add `<ErrorBoundary>` wrapper around `<AppShell>` in `App.jsx` |
| **TD-04** | Direct inline Firestore calls inside React page components | Medium | Scalability | Consolidate pure async Firestore functions into `src/firebase/` service files |

---

## 2. Active Known Issues Log

1. **Issue #1: ActionMenu Popover Truncation on Mobile Table Rows**
   * *Symptom:* Clicking the three-dots action menu on small screen tables causes popover content to cut off horizontally.
   * *Fix:* Implement fixed popover positioning or modal sheet fallback for viewports < 640px.

2. **Issue #2: Print Styles Yellow Background Artifact on Certain Browsers**
   * *Symptom:* Printing invoice view directly via browser `window.print()` sometimes leaves yellow link highlights.
   * *Fix:* Use `@react-pdf/renderer` PDF download button exclusively instead of browser native print.
