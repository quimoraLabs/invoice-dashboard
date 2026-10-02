# Service Layer API Reference

The service layer in `src/firebase/` abstracts all Firestore mutations, reads, and real-time listeners. Every function enforces tenant boundary invariants by accepting or resolving the authenticated `userId`.

---

## 1. Invoice Service API (`src/firebase/invoice.js`)

| Function | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `getNextInvoiceNumber` | `userId: string` | `Promise<string>` | Queries user's latest invoice and returns the next sequential number (e.g. `INV-004`). Defaults to `INV-001`. |
| `createInvoice` | `invoice: object, setLoading?: (boolean) => void, userId: string` | `Promise<DocumentReference>` | Validates user ID, timestamps the record via `serverTimestamp()`, sets `paid_date` if created as Paid, and persists to Firestore. |
| `listenToInvoices` | `callback: (invoices: Array<object>) => void, userId: string` | `() => void` (Unsubscribe) | Real-time listener streaming all invoices matching `where("userId", "==", userId)`. Unsubscribes on cleanup. |
| `getInvoiceById` | `id: string, userId?: string` | `Promise<object \| null>` | Retrieves single invoice by ID. Throws error if `userId` is provided and doesn't match the record's owner. |
| `updateInvoice` | `id: string, updatedData: object, setLoading?: (boolean) => void, userId?: string` | `Promise<void>` | Verifies ownership, removes transient `id` key, and updates specified fields in the document. |
| `updateInvoiceStatusAndDueDate` | `id: string, status?: string, type?: string, setLoading?: (boolean) => void, userId?: string` | `Promise<void>` | Sets invoice status (`Paid`, `Pending`, `Overdue`). If Paid, records `payment_type` and current timestamp; otherwise resets them. |
| `deleteInvoice` | `id: string, setLoading?: (boolean) => void, userId?: string` | `Promise<void>` | Checks document ownership before permanently removing the invoice document. |

### Error & Loading Conventions
* `setLoading?.(true)` is executed in `try` blocks and reset via `finally { setLoading?.(false); }`.
* If `userId` is missing on write operations, functions throw `Error("User authentication required...")`.
* Unauthorized attempts throw `Error("Unauthorized: You do not have permission...")`.

---

## 2. Customer Service API (`src/firebase/customer.js`)

| Function | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `createCustomer` | `customer: object, setLoading?: (boolean) => void, userId: string` | `Promise<DocumentReference>` | Sanitizes `full_name`, `email`, `phone_number`, stamps `userId` and `created_at`, and creates a customer record. |
| `listenToCustomers` | `callback: (customers: Array<object>) => void, userId: string` | `() => void` (Unsubscribe) | Real-time listener returning array of customers filtered strictly by `where("userId", "==", userId)`. |
| `updateCustomer` | `id: string, updatedData: object, setLoading?: (boolean) => void, userId?: string` | `Promise<void>` | Validates tenant ownership, trims strings, strips legacy field aliases (`name`, `phone`), and updates document. |
| `deleteCustomer` | `id: string, setLoading?: (boolean) => void, userId?: string` | `Promise<void>` | Validates ownership against target document and deletes the customer record. |

---

## 3. Product Service API (`src/firebase/product.js`)

| Function | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `createProduct` | `product: object, setLoading?: (boolean) => void, userId: string` | `Promise<DocumentReference>` | Appends `userId` and `serverTimestamp()`, saving product or service to `products` collection. |
| `listenToProducts` | `callback: (products: Array<object>) => void, userId: string` | `() => void` (Unsubscribe) | Real-time listener streaming all catalog items scoped by `where("userId", "==", userId)`. |
| `updateProduct` | `id: string, updatedData: object, setLoading?: (boolean) => void, userId?: string` | `Promise<void>` | Verifies ownership and updates catalog product details (pricing, title, tax rate). |
| `deleteProduct` | `id: string, setLoading?: (boolean) => void, userId?: string` | `Promise<void>` | Confirms record ownership and deletes product entry from Firestore. |

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
1. `session.getToken({ template: "firebase" })` requests a custom JWT minted by Clerk.
2. `signInWithCustomToken(auth, token)` signs the user into Firebase SDK.
3. Firestore security rules evaluate `request.auth.uid` against document `userId`.
