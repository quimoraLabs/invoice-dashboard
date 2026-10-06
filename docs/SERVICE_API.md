> ⚠️ **TARGET-STATE DOCUMENT — NOT CURRENT BEHAVIOR.**
> This document describes the planned B2B (multi-tenant) design. It does not describe what the code does today, and it uses `orgId` / `organization` vocabulary while the code uses `workspace`.
> **Known divergence:** Real services in `src/firebase/` take `userId`, not `orgId`, and do not stamp audit metadata. The only workspace service is `workspace.js`.
> For current behavior see [CURRENT_STATE.md](./CURRENT_STATE.md). For the doc map see [INDEX.md](./INDEX.md). Do not implement from this document without explicit phase approval.
> Last reviewed against code: 2026-10-06

---

# Service Layer API Reference

The service layer in `src/firebase/` abstracts all Firestore mutations, reads, and real-time listeners. Every function enforces tenant boundary invariants by operating strictly within the active `orgId` and stamping audit metadata (`actorUserId` / `createdBy`).

---

## 1. Invoice Service API (`src/firebase/invoice.js`)

| Function | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `getNextInvoiceNumber` | `orgId: string` | `Promise<string>` | Queries organization's latest invoice and returns the next sequential number (e.g. `INV-004`). Defaults to `INV-001`. |
| `createInvoice` | `invoice: object, orgId: string, actorUserId: string, setLoading?: (boolean) => void` | `Promise<DocumentReference>` | Stamps `orgId`, `createdBy: actorUserId`, `userId: actorUserId`, timestamps record via `serverTimestamp()`, sets `paid_date` if Paid, and persists to Firestore. |
| `listenToInvoices` | `orgId: string, callback: (invoices: Array<object>) => void` | `() => void` (Unsubscribe) | Real-time listener streaming all invoices matching `where("orgId", "==", orgId)`. Unsubscribes on cleanup. |
| `getInvoiceById` | `invoiceId: string, orgId: string` | `Promise<object \| null>` | Retrieves single invoice by ID. Throws error if `orgId` doesn't match the record's tenant key. |
| `updateInvoice` | `invoiceId: string, invoiceData: object, orgId: string, actorUserId: string, setLoading?: (boolean) => void` | `Promise<void>` | Verifies organization tenant boundary, removes transient `id` key, and updates specified fields in the document. |
| `updateInvoiceStatusAndDueDate` | `invoiceId: string, status?: string, method?: string, orgId: string, actorUserId: string, setLoading?: (boolean) => void` | `Promise<void>` | Sets invoice status (`Paid`, `Pending`, `Overdue`). If Paid, records `payment_type` and current timestamp; otherwise resets them. |
| `deleteInvoice` | `invoiceId: string, orgId: string, setLoading?: (boolean) => void` | `Promise<void>` | Confirms organization ownership before permanently deleting the invoice document. |

### Error & Loading Conventions
* `setLoading?.(true)` is executed in `try` blocks and reset via `finally { setLoading?.(false); }`.
* If `orgId` is missing on write operations, functions throw `Error("Organization authentication required...")`.
* Unauthorized attempts throw `Error("Unauthorized: You do not have permission...")`.

---

## 2. Customer Service API (`src/firebase/customer.js`)

| Function | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `createCustomer` | `customer: object, orgId: string, actorUserId: string, setLoading?: (boolean) => void` | `Promise<DocumentReference>` | Sanitizes `full_name`, `email`, `phone_number`, stamps `orgId`, `createdBy: actorUserId`, `userId: actorUserId`, `createdAt: serverTimestamp()`, and creates record. |
| `listenToCustomers` | `orgId: string, callback: (customers: Array<object>) => void` | `() => void` (Unsubscribe) | Real-time listener returning array of customers filtered strictly by `where("orgId", "==", orgId)`. |
| `updateCustomer` | `customerId: string, customerData: object, orgId: string, actorUserId: string, setLoading?: (boolean) => void` | `Promise<void>` | Validates organization tenant boundary, trims strings, strips legacy aliases (`name`, `phone`), and updates document. |
| `deleteCustomer` | `customerId: string, orgId: string, setLoading?: (boolean) => void` | `Promise<void>` | Validates organization ownership against target document and deletes the customer record. |

---

## 3. Product Service API (`src/firebase/product.js`)

| Function | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `createProduct` | `product: object, orgId: string, actorUserId: string, setLoading?: (boolean) => void` | `Promise<DocumentReference>` | Appends `orgId`, `createdBy: actorUserId`, `userId: actorUserId`, and `createdAt: serverTimestamp()`, saving product to `products` collection. |
| `listenToProducts` | `orgId: string, callback: (products: Array<object>) => void` | `() => void` (Unsubscribe) | Real-time listener streaming all catalog items scoped by `where("orgId", "==", orgId)`. |
| `updateProduct` | `productId: string, productData: object, orgId: string, actorUserId: string, setLoading?: (boolean) => void` | `Promise<void>` | Verifies organization ownership and updates catalog product details (pricing, title, tax rate). |
| `deleteProduct` | `productId: string, orgId: string, setLoading?: (boolean) => void` | `Promise<void>` | Confirms organization ownership and deletes product entry from Firestore. |

---

## 4. Authentication Bridge API (`src/contexts/authContext/`)

While authentication state originates from Clerk (`@clerk/react`), the application exposes an authentication context bridge (`useAuth`) that interfaces with Firebase Auth:

| Hook / Context Property | Type | Description |
| :--- | :--- | :--- |
| `useAuth()` | `() => AuthContextValue` | Hook accessing the global authenticated session and tenant identifiers. |
| `currentUser` | `object \| null` | Normalized user object (`{ uid, id, email, displayName, photoURL, clerkUser }`). |
| `userLoggedIn` | `boolean` | `true` when session is active and verified by Clerk. |
| `loading` | `boolean` | `true` while Clerk SDK initializes or fetches session credentials. |
| `signOut()` | `() => Promise<void>` | Signs out from Clerk and invalidates Firebase auth state, redirecting to `/login`. |

### Firebase Token Exchange Flow
When `isSignedIn` becomes true:
1. `session.getToken({ template: "firebase" })` requests a custom JWT minted by Clerk containing `orgId` and `role` claims.
2. `signInWithCustomToken(auth, token)` signs the user into Firebase SDK.
3. Firestore security rules evaluate `request.auth.token.orgId` against document `orgId`.

---

## 5. Organization Service API (`src/firebase/organization.js` / `workspace.js`)

| Function | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `createOrganization` | `name: string, ownerUser: object` | `Promise<object>` | Creates organization document, sets owner membership in `organizationMembers`, returns organization object. |
| `listenToUserOrganizations` | `userId: string, callback: (organizations: Array<object>) => void` | `() => void` (Unsubscribe) | Real-time listener streaming all organizations where user is an active member with their assigned role. |
| `listenToOrganizationMembers` | `orgId: string, callback: (members: Array<object>) => void` | `() => void` (Unsubscribe) | Streams all active members (`owner`, `admin`, `accountant`, `viewer`) belonging to the selected organization. |
| `inviteMemberToOrganization` | `{ orgId, orgName, invitedEmail, role, invitedBy }` | `Promise<string>` | Validates uniqueness and creates a pending invitation document in `organizationInvites`. |
| `listenToOrganizationInvites` | `orgId: string, callback: (invites: Array<object>) => void` | `() => void` (Unsubscribe) | Streams all pending email invitations for the selected organization. |
| `revokeOrganizationInvite` | `inviteId: string` | `Promise<void>` | Deletes the invitation record, invalidating pending join requests. |
| `removeOrganizationMember` | `orgId: string, memberUserId: string` | `Promise<void>` | Removes member from `organizationMembers` collection. |
| `checkAndAcceptPendingInvites` | `user: object` | `Promise<number>` | Queries pending invites for user's email, automatically joins organizations, and marks invites accepted. |
