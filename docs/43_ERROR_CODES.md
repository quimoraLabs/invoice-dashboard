# 43. Application Error Codes & Taxonomy Specification

---

## 1. Error Code Standards

Error codes follow the format `MODULE_XXX` where `MODULE` is a 3-4 letter domain identifier and `XXX` is a 3-digit numeric code.

---

## 2. Error Code Taxonomy Table

| Error Code | Domain | System Cause | User-Facing Message | Action |
| :--- | :--- | :--- | :--- | :--- |
| `AUTH_001` | Authentication | Google Sign-in popup blocked / closed | "Sign-in was cancelled. Please try again." | Re-prompt login button |
| `AUTH_002` | Authentication | Email already in use | "An account with this email already exists." | Redirect to Login |
| `AUTH_003` | Authentication | Invalid password or user not found | "Incorrect email or password." | Clear password field |
| `INV_001` | Invoice | Required fields missing (Customer / Date) | "Please select a client and valid invoice date." | Highlight invalid fields |
| `INV_002` | Invoice | Empty line items list | "Invoice must contain at least one line item." | Focus line items table |
| `INV_003` | Invoice | Firestore document save failed | "Failed to save invoice. Please check your network connection." | Show retry toast |
| `INV_004` | Invoice | Invoice ID not found | "Invoice not found or deleted." | Redirect to `/invoice` |
| `PDF_001` | PDF Engine | Blob compilation timeout | "Generating PDF took too long. Retrying..." | Auto-retry client render |
| `PDF_002` | PDF Engine | Logo / Signature image CORS block | "Could not load company logo image for PDF." | Use placeholder logo |
| `CUST_001` | Customer | Customer name missing | "Customer name is required." | Focus customer name input |
| `PROD_001` | Product | Invalid product price (negative/NaN) | "Product price must be a positive number." | Focus price input |
| `DB_001` | Database | Permission denied (Security rule failure) | "You do not have permission to modify this data." | Log out user |
