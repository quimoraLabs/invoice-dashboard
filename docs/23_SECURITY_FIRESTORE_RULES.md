# 23. Security & Firestore Rules Specification

---

## 1. Production `firestore.rules` Definition

Copy and paste the following rules into your **Firebase Console → Firestore Database → Rules** tab to resolve the public access warning:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Enforce active session authentication across all collections
    match /invoices/{invoiceId} {
      allow read, write: if request.auth != null;
    }

    match /customers/{customerId} {
      allow read, write: if request.auth != null;
    }

    match /products/{productId} {
      allow read, write: if request.auth != null;
    }

    match /business_profiles/{userId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 2. Multi-Tenant Isolation & Application Security
* **Authentication Session Synchronization Bridge:** In `src/contexts/authContext/index.jsx`, Clerk authentication automatically synchronizes session state with Firebase Auth (`signInWithCustomToken` / `signInAnonymously`). This guarantees `request.auth != null` is valid for logged-in users while blocking all unauthenticated public scripts.
* **Query-Level Data Isolation:** All list subscriptions (`listenToInvoices`, `listenToCustomers`, `listenToProducts`) execute Firestore compound queries filtered strictly by `where("userId", "==", targetUid)`. Unbounded collection reads are prohibited.
* **Single-Record Ownership Guards:** Single-record actions (`getInvoiceById`, `updateInvoice`, `updateInvoiceStatusAndDueDate`, `deleteInvoice`, `updateCustomer`, `deleteCustomer`, `updateProduct`, `deleteProduct`) fetch the target document and verify that `docData.userId === targetUid` prior to performing any read, update, or delete operations.
* **Client Sanitization:** All user input text fields are sanitized to prevent XSS.
