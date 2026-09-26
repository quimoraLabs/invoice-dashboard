# 46. Privacy Policy & Terms of Service Specification

---

## 1. Privacy Policy Summary (GDPR / DPDP Compliant)

### Data Collected:
* **Account Credentials:** Email address, User Display Name, Profile Photo URL (via Google OAuth / Firebase Auth).
* **Business & Billing Details:** Company name, address, tax identification numbers (GSTIN/EIN), bank account numbers, digital signature image.
* **Customer Data:** Client names, billing addresses, and invoice line items.

### Data Storage & Retention:
* All data is stored in **Google Cloud Firebase (Firestore & Storage)** encrypted at rest and in transit via TLS 1.3.
* Users retain 100% ownership of their data and can delete their account and associated Firestore documents at any time.

---

## 2. Terms of Service Key Clauses
* **No Financial Warranty:** Invoice Dashboard provides billing generation tools "as-is" and is not a certified tax accounting consultant. Users are responsible for verifying local tax calculations.
* **Service Availability:** 99.9% uptime target backed by Firebase infrastructure SLA.
