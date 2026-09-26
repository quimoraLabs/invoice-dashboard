# 35. Data Schema Versioning & Migration Strategy

---

## 1. Schema Versioning Standard

All Firestore collections contain a version marker field:
```json
{
  "_schemaVersion": 2
}
```

* **Version 1 (Legacy):** Flat invoice items without explicit `productId` references or tax rates.
* **Version 2 (Current Production):** Itemized products with `taxPercentage`, `unitPrice`, and dedicated `business_profiles` collection.

---

## 2. On-the-Fly Migration Pattern (Lazy Reader)

When fetching legacy document records from Firestore, normalizers fill missing fields with defaults:

```javascript
export const normalizeInvoiceDocument = (docData) => {
  return {
    id: docData.id,
    invoiceNumber: docData.invoiceNumber || `INV-${docData.id.slice(0, 6)}`,
    items: (docData.items || []).map(item => ({
      description: item.description || "Service",
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice || item.price) || 0,
      total: Number(item.total) || (Number(item.quantity || 1) * Number(item.unitPrice || 0))
    })),
    taxRate: Number(docData.taxRate) || 0,
    status: docData.status || "Draft",
    _schemaVersion: docData._schemaVersion || 2
  };
};
```

---

## 3. Batch Migration Script Specification
For bulk administrative updates, use Firebase Admin SDK or client batch scripts (`writeBatch`) limited to 500 documents per execution batch.
