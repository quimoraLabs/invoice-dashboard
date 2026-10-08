> ⚠️ **TARGET-STATE DOCUMENT — NOT CURRENT BEHAVIOR.**
> This document describes the planned B2B (multi-tenant) design. It does not describe what the code does today, and it uses `orgId` / `organization` vocabulary while the code uses `workspace`.
> **Known divergence:** Code today uses `workspaces` / `workspace_members` / `workspace_invites`, scopes domain data by `userId`, writes camelCase fields (`invoiceNumber`, `createdAt`) with fallback dual-reads for legacy snake_case (`invoice_no`, `created_at`). There is no active `organizations` collection in the frontend.
> For current behavior see [CURRENT_STATE.md](./CURRENT_STATE.md). For the doc map see [INDEX.md](./INDEX.md). Do not implement from this document without explicit phase approval.
> Last reviewed against code: 2026-10-06

---

# Database Specification & Firestore Schema

## 1. Multi-Tenant Organization Isolation Pattern

The application implements organization-scoped multi-tenancy. Every record across domain collections (`invoices`, `customers`, `products`, `business_profiles`) contains an immutable `orgId` string matching the tenant key.

* **Tenant Boundary:** All client queries must filter on the caller's active organization: `where("orgId", "==", activeOrgId)`. Unbounded reads on root collections are strictly forbidden.
* **Dual-Key Stamping:** Every domain document carries `orgId` (tenant key) alongside `userId` and `createdBy` (actor audit and creator tracking).
* **Zero Cross-Tenant Leakage:** Firestore Security Rules enforce `$O(1)$` boundary validation using Clerk JWT Custom Claims (`request.auth.token.orgId` and `request.auth.token.role`). A user cannot query, read, or mutate records belonging to any organization outside their active JWT claim.
* **Deterministic Profile Key:** The `business_profiles` document ID is identical to `orgId` (`doc(db, "business_profiles", orgId)`).

---

## 2. Collections & Field Schemas

### A. `organizations`
Stores organization metadata, tier, and workspace ownership.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Auto-generated Firestore document ID (`orgId`) |
| `name` | `string` | Human-readable organization name (e.g. `"Acme Corp"`) |
| `ownerId` | `string` | Clerk User ID of the primary owner |
| `plan` | `string` | Subscription tier: `"free"`, `"starter"`, `"pro"`, `"enterprise"` |
| `status` | `string` | Status: `"active"`, `"suspended"`, `"trial"` |
| `trialEndsAt` | `timestamp` | Timestamp when free trial period expires |
| `createdAt` | `timestamp` | Server creation timestamp (`serverTimestamp()`) |
| `updatedAt` | `timestamp` | Server last modified timestamp |

---

### B. `organizationMembers`
Stores team membership, deterministic composite IDs, and operational roles.

* **Document ID Format:** `${orgId}_${userId}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Composite key `${orgId}_${userId}` |
| `orgId` | `string` | Reference to parent `organizations.id` |
| `userId` | `string` | Member's Clerk User ID (`user.id`) |
| `email` | `string` | Member email (lowercased, trimmed) |
| `displayName` | `string` | Full name or cached username |
| `photoURL` | `string` | User avatar image URL (optional) |
| `role` | `string` | Member permission level: `"owner"`, `"admin"`, `"accountant"`, `"viewer"` |
| `status` | `string` | Membership state: `"pending"`, `"active"`, `"suspended"` |
| `joinedAt` | `timestamp` | Server timestamp of joining |
| `updatedAt` | `timestamp` | Server timestamp of last role/status mutation |

---

### C. `business_profiles`
Single profile record per organization holding branding and issuer details. Document ID matches `orgId`.

| Field | Type | Description |
| :--- | :--- | :--- |
| `orgId` | `string` | Organization ID (Matches document ID) |
| `userId` | `string` | User ID of the profile creator/owner |
| `createdBy` | `string` | User ID of the actor who initialized the profile |
| `companyName` | `string` | Registered company / brand title |
| `logoUrl` | `string` | Public URL to company logo stored in Firebase Storage |
| `email` | `string` | Official billing contact email |
| `phone` | `string` | Business phone number |
| `address` | `string` | Registered business address |
| `gstin` | `string` | Issuer tax registration number (GST / VAT / Tax ID) |
| `signatureUrl` | `string` | Digital stamp or signature image URL |
| `website` | `string` | Corporate website URL |
| `createdAt` | `timestamp` | Server creation timestamp |
| `updatedAt` | `timestamp` | Last profile update timestamp |

---

### D. `invoices`
Stores metadata, line items, and financial calculations for issued invoices.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Auto-generated Firestore document ID |
| `orgId` | `string` | **Tenant Key**: Reference to `organizations.id` |
| `userId` | `string` | Actor Clerk User ID (for audit tracking) |
| `createdBy` | `string` | Actor Clerk User ID who generated the record |
| `invoiceNumber` | `string` | Human-readable identifier (e.g. `INV-2026-001`) |
| `customerId` | `string` | Reference ID to `customers` collection |
| `customerName` | `string` | Cached snapshot of customer business name |
| `customerEmail` | `string` | Customer contact email |
| `customerAddress`| `string` | Billing street address |
| `invoiceDate` | `Timestamp` | Date of invoice issuance (Firestore Timestamp, UTC) |
| `dueDate` | `Timestamp` | Payment due date (Firestore Timestamp, UTC) |
| `status` | `string` | State: `"Paid"`, `"Pending"`, `"Overdue"`, `"Draft"` |
| `items` | `Array<object>` | Line items array (`productId`, `title`, `qty`, `price`, `total`) |
| `subtotal` | `number` | Sum of line item amounts before tax |
| `taxRate` | `number` | Applied tax percentage (e.g. `18`) |
| `taxAmount` | `number` | Calculated tax figure |
| `totalAmount` | `number` | Final invoice total (`subtotal + taxAmount`) |
| `notes` | `string` | Payment terms or customer notes |
| `createdAt` | `timestamp` | Document creation timestamp |
| `updatedAt` | `timestamp` | Document update timestamp |

---

### E. `customers`
Stores client directories used to auto-populate invoices.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Auto-generated Firestore document ID |
| `orgId` | `string` | **Tenant Key**: Reference to `organizations.id` |
| `userId` | `string` | Creator Clerk User ID |
| `createdBy` | `string` | Creator Clerk User ID |
| `name` | `string` | Customer contact or primary name |
| `email` | `string` | Customer email address |
| `phone` | `string` | Phone or mobile contact |
| `company` | `string` | Registered organization or trading name |
| `address` | `string` | Billing and shipping address |
| `gstin` | `string` | Tax registration number (GST / VAT / Tax ID) |
| `profile` | `string` | Avatar/logo URL (optional) |
| `createdAt` | `timestamp` | Record creation timestamp |
| `updatedAt` | `timestamp` | Record update timestamp |

---

### F. `products`
Catalog of goods or billable services.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Auto-generated Firestore document ID |
| `orgId` | `string` | **Tenant Key**: Reference to `organizations.id` |
| `userId` | `string` | Creator Clerk User ID |
| `createdBy` | `string` | Creator Clerk User ID |
| `title` | `string` | Item title or service name |
| `description` | `string` | Detailed product or service description |
| `price` | `number` | Default unit price |
| `category` | `string` | Classification category (e.g. `"Development"`) |
| `imageUrl` | `string` | Asset or Cloud Storage URL |
| `createdAt` | `timestamp` | Record creation timestamp (camelCase) |
| `updatedAt` | `timestamp` | Record update timestamp |

---

### G. Date Fields Policy

All date fields in domain collections are stored as Firestore Timestamp (UTC).

- `invoiceDate`, `dueDate` (`invoices`)
- `createdAt`, `updatedAt` (all collections)

Rationale:
- Timezone-safe (stored in UTC, displayed in local time)
- Enables proper range queries for GST monthly/quarterly filing
- Correct chronological sorting
- Overdue detection: `where('dueDate', '<', Timestamp.now())`

Client-side: convert to/from ISO string for UI display only. Never store strings in Firestore.

Legacy data: migrated from string to Timestamp during the B2B migration script (see [B2B_MIGRATION_STEP1.md Section 2.1 Step B.5](./B2B_MIGRATION_STEP1.md)).

---

## 3. Firestore Security Rules (Custom Claims Engine)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // --- Helper Functions (O(1) Token Claims Evaluation) ---
    
    function isAuthenticated() {
      return request.auth != null && request.auth.uid != null;
    }
    
    // Validates that caller's active JWT claim matches the target organization
    function isMember(orgId) {
      return isAuthenticated() && request.auth.token.orgId == orgId;
    }
    
    // Validates organization membership AND specific role permissions
    function hasRole(orgId, allowedRoles) {
      return isMember(orgId) && request.auth.token.role in allowedRoles;
    }

    // --- 1. Organizations Collection ---
    match /organizations/{orgId} {
      allow read: if isMember(orgId);
      // Organization creation is restricted to Server/Admin SDK or Cloud Functions
      allow create: if false;
      allow update: if hasRole(orgId, ['owner', 'admin']);
      allow delete: if hasRole(orgId, ['owner']);
    }

    // --- 2. Organization Members Collection ---
    match /organizationMembers/{memberId} {
      // Members can read roster of their active org; individual users can read their own membership docs across orgs
      allow read: if isAuthenticated() && (
        resource.data.userId == request.auth.uid ||
        isMember(resource.data.orgId)
      );
      // Only owners/admins can invite or update roles
      allow create, update: if isAuthenticated() &&
        hasRole(request.resource.data.orgId, ['owner', 'admin']);
      allow delete: if isAuthenticated() && (
        resource.data.userId == request.auth.uid || // Self leave
        hasRole(resource.data.orgId, ['owner', 'admin'])
      );
    }

    // --- 3. Business Profiles Collection ---
    match /business_profiles/{orgId} {
      allow read: if isMember(orgId);
      allow create, update: if hasRole(orgId, ['owner', 'admin']);
      allow delete: if hasRole(orgId, ['owner']);
    }

    // --- 4. Invoices Collection ---
    match /invoices/{invoiceId} {
      allow read: if isMember(resource.data.orgId);
      allow create: if isMember(request.resource.data.orgId) &&
                       hasRole(request.resource.data.orgId, ['owner', 'admin', 'accountant']) &&
                       request.resource.data.createdBy == request.auth.uid;
      allow update: if isMember(resource.data.orgId) &&
                       hasRole(resource.data.orgId, ['owner', 'admin', 'accountant']);
      allow delete: if isMember(resource.data.orgId) &&
                       hasRole(resource.data.orgId, ['owner', 'admin']);
    }

    // --- 5. Customers Collection ---
    match /customers/{customerId} {
      allow read: if isMember(resource.data.orgId);
      allow create: if isMember(request.resource.data.orgId) &&
                       hasRole(request.resource.data.orgId, ['owner', 'admin', 'accountant']);
      allow update: if isMember(resource.data.orgId) &&
                       hasRole(request.resource.data.orgId, ['owner', 'admin', 'accountant']);
      allow delete: if isMember(resource.data.orgId) &&
                       hasRole(resource.data.orgId, ['owner', 'admin']);
    }

    // --- 6. Products Collection ---
    match /products/{productId} {
      allow read: if isMember(resource.data.orgId);
      allow create: if isMember(request.resource.data.orgId) &&
                       hasRole(request.resource.data.orgId, ['owner', 'admin', 'accountant']);
      allow update: if isMember(resource.data.orgId) &&
                       hasRole(resource.data.orgId, ['owner', 'admin', 'accountant']);
      allow delete: if isMember(resource.data.orgId) &&
                       hasRole(resource.data.orgId, ['owner', 'admin']);
    }
  }
}
```

---

## 4. Composite Index Specifications (`firestore.indexes.json`)

```json
{
  "indexes": [
    {
      "collectionGroup": "invoices",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "orgId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "invoices",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "orgId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "customers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "orgId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "products",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "orgId", "order": "ASCENDING" },
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "price", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "products",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "orgId", "order": "ASCENDING" },
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "price", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "organizationMembers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "joinedAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```
