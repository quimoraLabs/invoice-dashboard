# 04. Folder Structure & Code Conventions Document

---

## 1. Directory Tree Specification

```
d:\invoice-dashboard\
├── .env                           # Environment variables configuration
├── .gitignore                     # Git ignore rules
├── index.html                     # Single Page Application entry HTML
├── package.json                   # Dependencies & build scripts
├── vite.config.js                 # Vite build configuration
├── PRD.md                         # Product Requirement Document
├── AGENTS.md                      # AI & Developer directives
├── docs/                          # Comprehensive technical documentation
│   ├── INDEX.md
│   ├── MASTER_CONTEXT.md
│   └── ...
└── src/
    ├── main.jsx                   # React DOM root render
    ├── App.jsx                    # Core application wrapper & routing setup
    ├── index.css                  # Global Tailwind CSS v4 design tokens
    ├── assets/                    # Static image/logo assets
    ├── auth/                      # Authentication views (Login, Register)
    ├── components/                # UI Components
    │   ├── ActionMenu.jsx         # Table row popover action dropdown
    │   ├── CustomDropdown.jsx     # Form select dropdown
    │   ├── GraphInvoice.jsx       # Recharts revenue analytics component
    │   ├── ImageUploader.jsx      # Image asset uploader (Logos, Signatures)
    │   ├── InvoiceView.jsx        # PDF preview & render component
    │   ├── Loader.jsx             # Loading indicator state component
    │   ├── StatCard.jsx           # Dashboard analytics stat card
    │   ├── customer/              # Customer domain UI components
    │   ├── invoice/               # Invoice domain UI components
    │   │   ├── InvoiceFilters.jsx
    │   │   ├── InvoiceForm.jsx
    │   │   ├── InvoiceListHeader.jsx
    │   │   ├── InvoiceTable.jsx
    │   │   ├── InvoiceTableRow.jsx
    │   │   └── UpdateStatusModal.jsx
    │   ├── modals/                # Reusable overlay modals
    │   └── product/               # Product domain UI components
    ├── contexts/                  # React Context providers
    │   └── authContext/           # AuthContext.jsx context provider
    ├── firebase/                  # Data service layers
    │   ├── auth.js                # Auth helper handlers
    │   ├── customer.js            # Customer Firestore API methods
    │   ├── firebaseConfig.js      # Firebase app initialization
    │   ├── getFileUrl.js          # File URL helper
    │   ├── invoice.js             # Invoice Firestore API methods
    │   └── product.js             # Product Firestore API methods
    ├── header/                    # Top navigation header component
    └── pages/                     # Main view pages
        ├── Home.jsx               # Dashboard overview
        ├── customer/              # Customer page layout
        ├── invoice/               # Invoice list, add, view, update pages
        └── product/               # Product catalog page layout
```

---

## 2. Naming Conventions

### File Naming
* **React Components & Pages:** PascalCase (e.g., `AddInvoice.jsx`, `InvoiceTable.jsx`, `Home.jsx`).
* **Utility Scripts & Service Files:** camelCase (e.g., `invoice.js`, `customer.js`, `firebaseConfig.js`).
* **CSS Files:** lowercase (e.g., `index.css`).

### Variable & Function Naming
* **React Hooks:** Prefix with `use` (e.g., `useAuth`).
* **Firebase Services:** Descriptive action verbs (e.g., `getUserInvoices`, `createInvoiceDocument`, `updateInvoiceStatus`).
* **Event Handlers:** Prefix with `handle` (e.g., `handleSubmit`, `handleStatusChange`, `handleDelete`).
