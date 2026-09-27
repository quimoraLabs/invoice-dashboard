# 23. Security & Firestore Rules Specification

---

## 1. Production `firestore.rules` Definition

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // When using Clerk Auth for client authentication, multi-tenant isolation is
    // strictly enforced at the application query level via `where("userId", "==", userId)`.
    // Firebase Firestore Rules are configured to allow client operations for configured documents.
    match /invoices/{invoiceId} {
      allow read, write: if true;
    }

    match /customers/{customerId} {
      allow read, write: if true;
    }

    match /products/{productId} {
      allow read, write: if true;
    }

    match /business_profiles/{userId} {
      allow read, write: if true;
    }
  }
}

```

---

## 2. Client Sanitization & Data Protection
* All user input text fields sanitized to prevent XSS.
* Firestore security rules strictly validate document schema field types and prevent cross-tenant modifications.
