# 12. Empty, Loading & Error States Specification

---

## 1. Skeleton Loading Patterns
Instead of jarring full-screen spinners, components use animated Tailwind pulse skeletons during data fetching:

```jsx
// Skeleton Table Row Pattern
export const TableRowSkeleton = () => (
  <tr className="animate-pulse border-b border-gray-200 dark:border-gray-700">
    <td className="p-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
    <td className="p-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-36"></div></td>
    <td className="p-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div></td>
    <td className="p-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div></td>
  </tr>
);
```

---

## 2. Empty State Patterns
When a table or list returns 0 records, render a friendly empty state illustration with a direct primary call-to-action:

* **Invoices List Empty:** "No invoices created yet. Create your first invoice to get paid faster!" -> `[+ Create Invoice]`
* **Customers Directory Empty:** "No clients found. Add your client details for fast invoicing." -> `[+ Add Customer]`
* **Products Catalog Empty:** "Your catalog is empty. Save services/products for quick line items." -> `[+ Add Product]`

---

## 3. Error Fallback States
* **Network Error / Firestore Timeout:** Render inline alert banner with a "Retry" button.
* **React Component Crashing:** Caught by `<ErrorBoundary>` at page level rendering a full fallback card ("Something went wrong") with a button to reload the page or navigate to `/home`.
