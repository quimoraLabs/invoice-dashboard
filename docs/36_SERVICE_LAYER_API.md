# 36. Service Layer API Function Signatures

---

## 1. Overview
The Service Layer (`src/firebase/`) abstracts all Firestore database communication away from React presentation components.

---

## 2. Invoices Service API (`src/firebase/invoice.js`)

| Function Name | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `getInvoices(userId)` | `userId: string` | `Promise<Array<Invoice>>` | Retrieves all invoices belonging to user |
| `getInvoiceById(invoiceId)` | `invoiceId: string` | `Promise<Invoice \| null>` | Retrieves single invoice payload |
| `addInvoice(invoiceData)` | `invoiceData: object` | `Promise<string>` | Saves new invoice document, returns Doc ID |
| `updateInvoice(invoiceId, data)` | `invoiceId: string, data: object` | `Promise<void>` | Updates existing invoice fields |
| `updateInvoiceStatus(invoiceId, status)` | `invoiceId: string, status: string` | `Promise<void>` | Updates status (`Paid`, `Pending`, `Overdue`, `Draft`) |
| `deleteInvoice(invoiceId)` | `invoiceId: string` | `Promise<void>` | Deletes specified invoice document |

---

## 3. Customers Service API (`src/firebase/customer.js`)

| Function Name | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `getCustomers(userId)` | `userId: string` | `Promise<Array<Customer>>` | Fetches user customer directory |
| `addCustomer(customerData)` | `customerData: object` | `Promise<string>` | Creates new customer record |
| `updateCustomer(id, data)` | `id: string, data: object` | `Promise<void>` | Updates customer details |
| `deleteCustomer(id)` | `id: string` | `Promise<void>` | Deletes customer from directory |

---

## 4. Products Service API (`src/firebase/product.js`)

| Function Name | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `getProducts(userId)` | `userId: string` | `Promise<Array<Product>>` | Fetches product/service catalog |
| `addProduct(productData)` | `productData: object` | `Promise<string>` | Creates new product entry |
| `updateProduct(id, data)` | `id: string, data: object` | `Promise<void>` | Edits product pricing or details |
| `deleteProduct(id)` | `id: string` | `Promise<void>` | Removes product from catalog |
