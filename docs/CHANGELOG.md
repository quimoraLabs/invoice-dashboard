# Changelog
All notable changes to Invomora are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-10-15
### Added
- **Multi-Tenant B2B Architecture:** Isolated workspaces (`workspaceId`) with `owner` and `accountant` roles.
- **Double Security on Team Invites:** Workspace owner must enter 6-digit PIN before issuing team invitations. Recipient must also enter the 6-digit PIN to join.
- **Nodemailer & Gmail SMTP Automation:** Automated delivery of invitation passcodes and instant security alert emails on failed unlock attempts (`api/mailer.js`, `api/send-email.js`).
- **15-Minute Standby Inactivity Lock:** Screen auto-lock component (`InactivityLock.jsx`) with backdrop blur and PIN barrier for unattended laptops; manual "Lock Screen" action in profile dropdown.
- **Immutable Workspace Audit Trail:** Permanent activity logs at `/activity-log` tracking all invoice, customer, product, and security events.
- **Transactional Sequential Numbering:** Atomic Firestore counters (`/workspaces/{workspaceId}/counters/invoice`) guaranteeing gapless GST-compliant invoice numbering.
- **Tailwind CSS v4 Compliance:** Standardized theme tokens and suppressed CSS parser warnings.

### Changed
- Domain collections (`invoices`, `customers`, `products`) and `business_profiles` transitioned to dual-mode `workspaceId`/`userId` scoping.
- Refactored `TeamModal.jsx` and `InvitationsModal.jsx` to consume centralized `WorkspaceContext`.
- Updated Firestore security rules with custom claims fast-path and composite indexes.

### Security
- Eliminated silent auto-joining on login; all joins require verified 6-digit PIN.
- Restricted invoice and document deletions to workspace managers or original creators.

---

## [1.0.0] - 2026-09-01
### Added
- Initial single-user MVP release.
- Clerk Auth integration with Google SSO and Email/Passwordless login.
- Cloudinary unsigned preset integration for logo and signature uploads.
- Pixel-perfect A4 invoice PDF generation using `@react-pdf/renderer`.
- Customer and Product catalog CRUD operations.
- Real-time monthly revenue trends and charts using Recharts.
- GST tax calculations and Indian currency amount-in-words converter.
