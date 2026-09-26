# 20. Testing Strategy & Quality Assurance Document

---

## 1. Testing Pyramid Matrix

```
       /  E2E (Playwright)  \      -> Core User Flows (Auth, Invoice Creation, Download)
      / Integration (Vitest) \     -> Page Views & Firestore Mock Integration
     /  Unit (Vitest + RTL)   \    -> Calculations, Helpers, Stat Generators
```

---

## 2. Test Specifications

### A. Unit Tests (Coverage Target: 85%)
* **Tax & Calculation Helpers (`helper.js`):** Test subtotal calculations, tax amounts, grand totals, and currency formatting.
* **Date Parsing:** Verify formatting of `invoiceDate` and `dueDate` strings across timezones.

### B. Component Integration Tests
* **`InvoiceForm.jsx`:** Verify line item add/remove actions, auto-calculating totals on input change.
* **`StatCard.jsx`:** Verify correct rendering of numerical values and status colors.

### C. End-to-End (E2E) Smoke Tests
1. **Auth Flow:** Login with test credentials -> Redirect to Dashboard.
2. **Invoice Flow:** Create new invoice -> Save -> Verify appearing in table -> Download PDF.
