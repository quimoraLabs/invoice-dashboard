# 39. Internationalization (i18n) & Multi-Currency Specification

---

## 1. Currency Formatting Standard (`Intl.NumberFormat`)

All currency renders in the application use standard JavaScript `Intl.NumberFormat` formatters instead of string concatenation:

```javascript
export const formatCurrency = (amount, currencyCode = 'INR', locale = 'en-IN') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

// Examples:
// formatCurrency(12500, 'INR', 'en-IN') => "₹12,500.00"
// formatCurrency(12500, 'USD', 'en-US') => "$12,500.00"
// formatCurrency(12500, 'EUR', 'de-DE') => "12.500,00 €"
```

---

## 2. Multi-Currency Invoice Spec (Phase 4 Expansion)

Each invoice stores currency code metadata:
```json
{
  "currency": "USD",
  "currencySymbol": "$",
  "subtotal": 500.00,
  "totalAmount": 590.00
}
```

---

## 3. Date & Locale Formatters
Dates are formatted according to user locale:
* **India / UK (`en-IN` / `en-GB`):** `DD/MM/YYYY` (e.g. `26/09/2026`)
* **US (`en-US`):** `MM/DD/YYYY` (e.g. `09/26/2026`)
* **ISO Standard:** `YYYY-MM-DD` (Used internally in input fields and Firestore database)
