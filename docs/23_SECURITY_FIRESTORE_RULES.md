# 23. Security & Firestore Rules Specification

---

## 1. Production `firestore.rules` Definition

Copy and paste the following rules into your **Firebase Console → Firestore Database → Rules** tab. These rules strictly enforce document ownership matching `request.auth.uid` and explicitly reject anonymous logins:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions enforcing non-anonymous authentication & tenant ownership
    function isAuthenticated() {
      return request.auth != null && request.auth.token.firebase.sign_in_provider != 'anonymous';
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Invoices collection: only allow read/write if document userId matches request.auth.uid
    match /invoices/{invoiceId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isOwner(resource.data.userId);
    }

    // Customers collection
    match /customers/{customerId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isOwner(resource.data.userId);
    }

    // Products collection
    match /products/{productId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isOwner(resource.data.userId);
    }

    // Business Profiles collection
    match /business_profiles/{userId} {
      allow read: if isAuthenticated() && (userId == request.auth.uid || resource.data.userId == request.auth.uid);
      allow create: if isAuthenticated() && (userId == request.auth.uid || request.resource.data.userId == request.auth.uid);
      allow update, delete: if isAuthenticated() && (userId == request.auth.uid || resource.data.userId == request.auth.uid);
    }
  }
}
```

---

## 2. Clerk JWT Template Configuration Setup Guide

To issue Firebase custom tokens signed by Clerk matching `request.auth.uid == clerkUser.id`:

1. Open [Clerk Dashboard](https://dashboard.clerk.com) and select your application.
2. In the left navigation menu, click **JWT Templates**.
3. Click **New Template** and select **Firebase**.
4. Set the template name to `firebase` (all lowercase).
5. Click **Save Changes**.

---

## 3. Multi-Tenant Security & Defense-in-Depth
* **Strict Backend Rules:** Firestore rules mandate `request.auth.uid == resource.data.userId` for every read, write, update, and delete operation.
* **Anonymous Fallback Removed:** `src/contexts/authContext/index.jsx` strictly requires valid authenticated tokens issued via Clerk's `firebase` JWT template and never executes anonymous sign-in fallbacks.
* **Query-Level Data Isolation:** All list subscriptions (`listenToInvoices`, `listenToCustomers`, `listenToProducts`) execute Firestore compound queries filtered strictly by `where("userId", "==", targetUid)`. Unbounded collection reads are prohibited.
* **Single-Record Ownership Guards:** Single-record actions (`getInvoiceById`, `updateInvoice`, `updateInvoiceStatusAndDueDate`, `deleteInvoice`, `updateCustomer`, `deleteCustomer`, `updateProduct`, `deleteProduct`) fetch the target document and verify that `docData.userId === targetUid` prior to performing any read, update, or delete operations.
