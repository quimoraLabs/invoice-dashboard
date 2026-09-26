# 38. Analytics & Telemetry Event Tracking Specification

---

## 1. Overview
Track user engagement, core conversion actions, and application performance metrics using privacy-conscious telemetry providers (GA4 / Plausible).

---

## 2. Event Taxonomy Table

| Event Name | Trigger Condition | Payload Properties | Purpose |
| :--- | :--- | :--- | :--- |
| `user_login` | User signs in via Google or Email | `{ method: "google" \| "email" }` | Auth conversion tracking |
| `invoice_created` | User clicks "Save Invoice" | `{ totalAmount: number, itemCount: number }` | Core engagement metric |
| `invoice_pdf_downloaded` | User clicks "Download PDF" | `{ invoiceId: string }` | Feature utilization metric |
| `invoice_status_updated` | Status changed to Paid/Overdue | `{ status: string }` | Payment tracking metric |
| `customer_added` | New client entry saved | `{ hasGstin: boolean }` | Directory adoption metric |
| `product_added` | New product catalog entry saved | `{ price: number }` | Catalog adoption metric |

---

## 3. Privacy & Compliance (GDPR)
* No personally identifiable information (PII) such as raw client emails, customer names, or exact billing addresses are transmitted in analytics payloads.
* Only aggregated numerical values and feature usage flags are logged.
