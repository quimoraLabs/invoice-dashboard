# Database Specification & Firestore Schema

## 1. Tenant Isolation Pattern

The application implements document-level multi-tenancy. Every record across all collections contains an immutable `userId` string that corresponds directly to the Clerk User ID (`user.id`).

* **Query Invariant:** All queries must include an equality constraint: `where("userId", "==", targetUid)`. Unbounded reads on root collections are prohibited.
* **Write Invariant:** Creating records stamps `userId: currentUser.id`. Updating or deleting records validates that the document's existing `userId` matches the current caller's authenticated identity.
* **Zero Cross-Tenant Leakage:** A user cannot query, read, or mutate records belonging to any other user identifier.

---

## 2. Collections & Field Schemas

### A. `invoices`
Stores metadata, line items, and financial calculations for issued invoices.

| Field | Type | Description |
| :--- | :--- | :--- |
| `userId` | `string` | Owner Clerk user ID (Tenant key) |
| `invoiceNumber` | `string` | Human-readable identifier (e.g. `INV-2026-001`) |
| `customerId` | `string` | Reference ID to `customers` collection |
| `customerName` | `string` | Cached snapshot of customer business name |
| `customerEmail` | `string` | Customer contact email |
| `customerAddress` | `string` | Billing street address |
| `invoiceDate` | `string` | Date of invoice issuance (`YYYY-MM-DD`) |
| `dueDate` | `string` | Payment due date (`YYYY-MM-DD`) |
| `status` | `string` | State: `"Paid"`, `"Pending"`, `"Overdue"`, `"Draft"` |
| `items` | `Array<object>` | Line items array (schema below) |
| `subtotal` | `number` | Sum of line item amounts before tax |
| `taxRate` | `number` | Applied tax percentage (e.g. `18`) |
| `taxAmount` | `number` | Calculated tax figure |
| `totalAmount` | `number` | Final invoice total (`subtotal + taxAmount`) |
| `notes` | `string` | Payment terms or customer notes |
| `createdAt` | `timestamp` | Document creation timestamp |
| `updatedAt` | `timestamp` | Document update timestamp |

**`items[]` Object Schema:**
```json
{
  "productId": "string (optional reference to products collection)",
  "description": "string",
  "quantity": "number",
  "unitPrice": "number",
  "total": "number"
}
```

### B. `customers`
Stores client directories used to auto-populate invoices.

| Field | Type | Description |
| :--- | :--- | :--- |
| `userId` | `string` | Owner Clerk user ID (Tenant key) |
| `name` | `string` | Customer contact or primary name |
| `email` | `string` | Customer email address |
| `phone` | `string` | Phone or mobile contact |
| `company` | `string` | Registered organization or trading name |
| `address` | `string` | Billing and shipping address |
| `gstin` | `string` | Tax registration number (GST / VAT / Tax ID) |
| `createdAt` | `timestamp` | Record creation timestamp |

### C. `products`
Catalog of goods or billable services.

| Field | Type | Description |
| :--- | :--- | :--- |
| `userId` | `string` | Owner Clerk user ID (Tenant key) |
| `name` | `string` | Item title or service name |
| `description` | `string` | Detailed product or service description |
| `price` | `number` | Default unit price |
| `unit` | `string` | Billing unit (`"hrs"`, `"pcs"`, `"items"`, `"units"`) |
| `taxPercentage`| `number` | Default tax rate |
| `createdAt` | `timestamp` | Record creation timestamp |

### D. `business_profiles`
Single profile record per tenant holding branding and issuer details. Document ID matches `userId`.

| Field | Type | Description |
| :--- | :--- | :--- |
| `userId` | `string` | Owner Clerk user ID (Tenant key & Doc ID) |
| `companyName` | `string` | Registered company / brand title |
| `logoUrl` | `string` | Public URL to company logo stored in Firebase Storage |
| `email` | `string` | Official billing contact email |
| `phone` | `string` | Business phone number |
| `address` | `string` | Registered business address |
| `taxId` | `string` | Issuer tax registration number |
| `signatureUrl` | `string` | Digital stamp or signature image URL |
| `bankName` | `string` | Bank beneficiary name |
| `accountNumber`| `string` | Beneficiary account number |
| `ifscCode` | `string` | Routing code (IFSC / SWIFT / IBAN) |
| `updatedAt` | `timestamp` | Last profile update timestamp |

---

## 3. Firestore Security Rules

Deploy the following declarative rules into `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null && request.auth.token.firebase.sign_in_provider != 'anonymous';
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    match /invoices/{invoiceId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isOwner(resource.data.userId);
    }

    match /customers/{customerId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isOwner(resource.data.userId);
    }

    match /products/{productId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isOwner(resource.data.userId);
    }

    match /business_profiles/{userId} {
      allow read: if isAuthenticated() && (userId == request.auth.uid || resource.data.userId == request.auth.uid);
      allow create: if isAuthenticated() && (userId == request.auth.uid || request.resource.data.userId == request.auth.uid);
      allow update, delete: if isAuthenticated() && (userId == request.auth.uid || resource.data.userId == request.auth.uid);
    }
  }
}
```

---

## 4. Required Composite Indexes

Execute compound sorting and filtering queries by configuring these composite indexes in the Firebase Console:

| Collection ID | Fields Indexed | Query Intent |
| :--- | :--- | :--- |
| `invoices` | `userId` (ASC), `createdAt` (DESC) | Chronological dashboard list |
| `invoices` | `userId` (ASC), `status` (ASC), `invoiceDate` (DESC) | Status-filtered ledger view |
| `customers` | `userId` (ASC), `name` (ASC) | Alphabetical client directory |
| `products` | `userId` (ASC), `name` (ASC) | Alphabetical product picker |
