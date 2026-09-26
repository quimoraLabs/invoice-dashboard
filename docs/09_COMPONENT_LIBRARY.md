# 09. Comprehensive Component Library Specification

---

## 1. Shared UI Components

### A. Component: `StatCard.jsx` (`src/components/StatCard.jsx`)
* **Purpose:** Displays KPI metric cards on the main dashboard.
* **Props Table:**
  | Prop | Type | Required | Description |
  | :--- | :--- | :---: | :--- |
  | `title` | `string` | Yes | Title label (e.g., "Total Revenue") |
  | `value` | `string \| number` | Yes | Formatted metric value (e.g., "₹45,200") |
  | `icon` | `ReactNode` | Yes | Icon component from `react-icons` |
  | `color` | `string` | Yes | Tailwind background/border color utility class |
  | `subtext` | `string` | No | Secondary description badge |

### B. Component: `ActionMenu.jsx` (`src/components/ActionMenu.jsx`)
* **Purpose:** Popover action dropdown for table rows.
* **Props Table:**
  | Prop | Type | Required | Description |
  | :--- | :--- | :---: | :--- |
  | `onView` | `function` | Yes | Triggered when user clicks "View Invoice" |
  | `onEdit` | `function` | Yes | Triggered when user clicks "Edit Invoice" |
  | `onStatusChange` | `function` | Yes | Triggered to open `UpdateStatusModal` |
  | `onDelete` | `function` | Yes | Triggered when user clicks "Delete" |

### C. Component: `CustomDropdown.jsx` (`src/components/CustomDropdown.jsx`)
* **Purpose:** Custom select dropdown menu supporting search and filtering.
* **Props Table:**
  | Prop | Type | Required | Description |
  | :--- | :--- | :---: | :--- |
  | `options` | `Array<{value, label}>` | Yes | List of select options |
  | `value` | `string` | Yes | Currently selected option value |
  | `onChange` | `function(val)` | Yes | Selection change callback |
  | `placeholder` | `string` | No | Placeholder prompt text |

### D. Component: `ImageUploader.jsx` (`src/components/ImageUploader.jsx`)
* **Purpose:** File uploader component for company logo and digital signature.
* **Props Table:**
  | Prop | Type | Required | Description |
  | :--- | :--- | :---: | :--- |
  | `value` | `string` | No | Existing image URL |
  | `onChange` | `function(url)` | Yes | Image URL change callback |
  | `label` | `string` | Yes | Form field label |
  | `maxSizeMB` | `number` | No | Maximum file size limit (default 2MB) |

### E. Component: `GraphInvoice.jsx` (`src/components/GraphInvoice.jsx`)
* **Purpose:** Analytics visualizer using Recharts.
* **Props Table:**
  | Prop | Type | Required | Description |
  | :--- | :--- | :---: | :--- |
  | `data` | `Array<Invoice>` | Yes | List of user invoice documents |
  | `timeframe` | `'monthly' \| 'yearly'` | No | Chart aggregation granularity |

### F. Component: `InvoiceView.jsx` (`src/components/InvoiceView.jsx`)
* **Purpose:** Direct PDF viewer and preview component using `@react-pdf/renderer`.
* **Props Table:**
  | Prop | Type | Required | Description |
  | :--- | :--- | :---: | :--- |
  | `invoice` | `object` | Yes | Invoice document payload |
  | `businessProfile` | `object` | Yes | User company profile details |

### G. Component: `Loader.jsx` (`src/components/Loader.jsx`)
* **Purpose:** Centered spinner loader indicator.
* **Props Table:**
  | Prop | Type | Required | Description |
  | :--- | :--- | :---: | :--- |
  | `message` | `string` | No | Optional loading text prompt |

---

## 2. Invoice Domain Components (`src/components/invoice/`)

### H. Component: `InvoiceForm.jsx`
* **Purpose:** Complete multi-field form for creating and editing invoices.
* **State Management:** Local state tracking `items` array, `subtotal`, `taxRate`, `totalAmount`, `customerId`.

### I. Component: `InvoiceTable.jsx` & `InvoiceTableRow.jsx`
* **Purpose:** Renders responsive invoice table listing with sortable headers and row action popovers.

### J. Component: `InvoiceFilters.jsx`
* **Purpose:** Search input and status select filter pill bar (`All`, `Paid`, `Pending`, `Overdue`).

### K. Component: `UpdateStatusModal.jsx`
* **Purpose:** Modal overlay to change invoice status (`Paid`, `Pending`, `Overdue`, `Draft`).
