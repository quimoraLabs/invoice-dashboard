# 17. Notifications System Specification

---

## 1. Notification Categories

### A. In-App Toast Alerts (`react-hot-toast`)
* **Success Toast:** Invoice created successfully, Customer updated, PDF downloaded.
* **Error Toast:** Network failed, required fields missing, authentication expired.
* **Warning Toast:** Invoice marked as Overdue, payment link expired.

### B. Email Notifications (SendGrid / Resend Integration)
* **Invoice Sent to Client:** Triggered when user clicks "Send PDF via Email". Includes invoice summary + attachment link.
* **Payment Reminder:** Automated reminder sent 3 days prior to `dueDate` and on `dueDate`.
* **Payment Receipt:** Confirmation email dispatch upon successful payment receipt via webhook.
