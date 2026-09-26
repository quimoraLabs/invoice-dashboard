# 10. UI/UX Screen Flows & Wireframe Specs

---

## 1. Primary User Journey Flows

### Flow A: New User Onboarding & Invoice Creation
```mermaid
sequenceDiagram
    actor User
    participant Auth as Auth View
    participant Dash as Dashboard (/home)
    participant Form as Invoice Form (/invoice/create)
    participant DB as Firestore
    participant View as PDF View (/invoice/view/:id)

    User->>Auth: Sign in with Google / Email
    Auth->>Dash: Redirect to /home
    User->>Dash: Click "Create Invoice"
    Dash->>Form: Navigate to /invoice/create
    User->>Form: Select Customer, Add Line Items, Set Tax
    User->>Form: Click "Save Invoice"
    Form->>DB: Save document to 'invoices'
    DB-->>Form: Return Document ID
    Form->>View: Redirect to /invoice/view/:id
    View->>User: Display PDF Download Preview
```

---

## 2. Screen Layout Specs

### Screen 1: Dashboard (`/home`)
* **Header:** Welcome greeting, quick action button ("+ Create Invoice").
* **Top Grid (4 Cards):** Total Revenue, Paid Invoices, Pending Invoices, Overdue Invoices.
* **Middle Section:** 
  * Left: Recharts Monthly Revenue Trend (Line/Bar Chart).
  * Right: Invoice Status Distribution (Pie Chart).
* **Bottom Section:** Recent Invoices Table (Top 5 items with quick status update trigger).

### Screen 2: Invoice Management (`/invoice`)
* **Top Header:** Title, Search Bar, Status Filter Dropdown (`All`, `Paid`, `Pending`, `Overdue`).
* **Main Table:** Desktop view renders clean table; Mobile view renders responsive card stack.
* **Row Actions:** View PDF, Edit, Update Status, Delete.
