# 18. Payment Gateway Integration Specification

---

## 1. Overview
Integrate **Razorpay** (India / INR) and **Stripe** (International / USD) to allow clients to pay invoices directly via a dynamic link embedded on the web view and PDF invoice.

---

## 2. Integration Architecture

```mermaid
sequenceDiagram
    actor Client
    participant Web as Invoice PDF/Web Page
    participant Gateway as Razorpay / Stripe API
    participant Webhook as Firebase Cloud Function
    participant DB as Firestore

    Web->>Gateway: Create Payment Link for Invoice Amount
    Gateway-->>Web: Return Payment URL / QR Code
    Client->>Gateway: Completes Payment
    Gateway->>Webhook: Sends webhook event (payment.captured)
    Webhook->>DB: Updates invoice status to 'Paid'
    DB-->>Web: Real-time UI reflects 'Paid' status badge
```

---

## 3. Webhook Handling Rules
* **Signature Verification:** All incoming webhooks must verify `x-razorpay-signature` or Stripe signature using server secret.
* **Idempotency:** Webhook processor checks if `invoice.status === 'Paid'` before processing to prevent duplicate status updates.
