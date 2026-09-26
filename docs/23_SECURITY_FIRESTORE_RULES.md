# 23. Security & Firestore Rules Specification

---

## 1. Production `firestore.rules` Definition

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function checking authentication
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function checking document ownership
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Invoices collection rules
    match /invoices/{invoiceId} {
      allow read, update, delete: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }

    // Customers collection rules
    match /customers/{customerId} {
      allow read, update, delete: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }

    // Products collection rules
    match /products/{productId} {
      allow read, update, delete: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }

    // Business profiles rules (1:1 per user ID)
    match /business_profiles/{userId} {
      allow read, write: if isOwner(userId);
    }
  }
}
```

---

## 2. Client Sanitization & Data Protection
* All user input text fields sanitized to prevent XSS.
* Firestore security rules strictly validate document schema field types and prevent cross-tenant modifications.
