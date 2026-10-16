# Progress & Codebase Reality (Invomora v2)

Last reviewed against code: 2026-10-15

This document is the authoritative record of what the codebase actually does today, its active architecture, completed milestones, and live operational reality.

---

## 1. Executive Status: v2 Multi-Tenant B2B Production Ready

- **B2B Multi-Tenancy Complete:** Domain collections (`invoices`, `customers`, `products`), sequential counters, and `business_profiles` are strictly scoped to the active workspace (`workspaceId`), with backwards compatibility for legacy single-user documents.
- **Double Security on Team Invites:** Inviting a new member requires the workspace owner to enter the workspace's 6-digit PIN. The invitee must also provide the 6-digit PIN in the Invitations modal or `/api/accept-invite` to join.
- **Nodemailer & Gmail SMTP Automation:** Serverless email dispatcher (`api/mailer.js`, `api/send-email.js`) sends branded team invitations with passcodes and triggers instant security alert emails to owners on unauthorized or failed passcode attempts.
- **15-Minute Standby / Inactivity Lock:** Screen auto-lock (`src/components/workspace/InactivityLock.jsx`) engages after 15 minutes of inactivity with full-screen blur to protect sensitive accounting data on unattended laptops. 3 failed attempts notify the owner via email.
- **Immutable Audit Logging:** All mutations (`invoices`, `customers`, `products`, team invites, member joins/removals, security alerts) are written to an immutable `activity_logs` collection and viewable in real-time at `/activity-log`.

---

## 2. Stack and Deployment Reality

| Area | Implementation Reality |
| :--- | :--- |
| **Frontend Framework** | React 19, Vite 8, Tailwind CSS v4, React Router v7 |
| **Authentication** | Clerk (`@clerk/react`) for SSO & session management; Firebase Auth token bridge for Firestore |
| **Database** | Cloud Firestore (`nam5`) with composite indexes and granular security rules |
| **Media & File Storage** | Cloudinary (`src/firebase/getFileUrl.js`, `VITE_CLOUDINARY_URL`, `VITE_CLOUDINARY_PRESET`) |
| **Email Service** | Nodemailer v6 over Gmail SMTP (`EMAIL_USER`, `EMAIL_PASS`) |
| **Hosting** | Vercel. `vercel.json` rewrites client routes to SPA root while preserving `/api/*` |
| **Serverless Functions** | `create-firebase-token.js`, `accept-invite.js`, `my-invites.js`, `send-email.js` |
| **Security Suite** | 40 Vitest unit tests, 23 Firestore emulator rules tests, ESLint clean |

---

## 3. Data Model Reality

Tenancy is scoped by **workspace** (`workspaceId`):

| Collection | Key Fields | Notes |
| :--- | :--- | :--- |
| `workspaces` | `ownerId`, `name`, `invitePasscode` | 6-digit security PIN managed by owner; auto-generated on workspace creation. |
| `workspace_members` | `{workspaceId}_{userId}`, `role`, `joinedAt` | Active roles: `owner`, `accountant`. |
| `workspace_invites` | `workspaceId`, `invitedEmail`, `role`, `status` | Pending invite lifecycle: `pending`, `accepted`, `revoked`. |
| `invoices` | `workspaceId`, `invoiceNumber`, `total`, `items` | Atomic sequential numbering via `/workspaces/{workspaceId}/counters/invoice`. |
| `customers` | `workspaceId`, `name`, `email`, `gstin`, `phone` | Workspace-isolated client directory. |
| `products` | `workspaceId`, `title`, `price`, `taxRate`, `hsn` | Workspace-isolated item catalog. |
| `business_profiles` | `workspaceId` (or `userId`) | Workspace company header, GSTIN, bank details, logo, signature. |
| `activity_logs` | `workspaceId`, `actorUid`, `action`, `createdAt` | Immutable workspace audit records; update/delete strictly forbidden by rules. |

---

## 4. Completed Milestones & Changelog

### Phase 0 & Security Hardening (Completed)
1. **Passcode Protection:** 6-digit invite passcode authorization implemented on serverless join endpoint (`/api/accept-invite.js`).
2. **Double Security on Inviting:** Workspace owner PIN confirmation added in `TeamModal.jsx` before dispatching invites.
3. **Automated Gmail SMTP Email Dispatch:** Branded invite emails with passcodes and instant owner security alert emails implemented in `api/mailer.js` & `api/send-email.js`.
4. **15-Minute Standby Lock:** Screen auto-blur and PIN barrier implemented in `InactivityLock.jsx` with manual lock screen option.
5. **Tailwind CSS v4 Compliance:** Standardized theme tokens and suppressed CSS lint false-positives via `.vscode/settings.json`.
6. **Immutable Audit Trail:** `/activity-log` page and `activity_logs` Firestore collection integrated across all mutations.
7. **Transactional GST Counters:** Scoped numeric counters for sequential invoice numbering (`INV-001`).
8. **UI & Icon Modernization Refactor:**
   - **Elimination of `react-icons`:** Uninstalled `react-icons` and migrated all 25+ files cleanly to `lucide-react`.
   - **"Forgot Passcode" Recovery:** Implemented secure email recovery pipeline (`api/mailer.js`, `api/send-email.js`, `InactivityLock.jsx`) with 60s cooldown, multi-tier recipient email resolution (Clerk `useUser`, membership docs, verified claims), automatic 6-digit PIN generation & Firestore persistence for unmigrated workspaces, and exact message format: *"Your account wants to open, your passcode is [passcode]"*.
   - **Clerk Component Standardization:** Integrated official Clerk `<UserButton />` in header navigation for session and profile management.
   - **Unified `CustomDropdown`:** Replaced all legacy `<select>` dropdowns across the application with the accessible Headless UI `CustomDropdown`.
   - **Relocated Lock Screen Trigger:** Dedicated lock button in header between theme toggle and notifications, plus quick action in Configure dropdown.
9. **Progressive Web App (PWA) Implementation:**
   - **Web App Manifest (`public/manifest.json`):** Standalone app mode, background/theme branding colors (`#09090b` / `#4f46e5`), shortcut intents for Invoices, Clients, and Products.
   - **Multi-Resolution Icons:** Generated 192x192, 512x512, maskable, and SVG vector app icons.
   - **Offline Service Worker (`public/sw.js`):** Pre-caches app shell, stale-while-revalidate for static assets, network-first for SPA navigation with offline cache fallback, and explicit bypass for `/api/*`, Clerk, and Firebase.
   - **Install Prompt Banner (`PWAInstallBanner.jsx`):** Detects `beforeinstallprompt` to offer seamless native desktop and mobile installation.

---

## 5. Active Verification Checklist

- [x] 40/40 Unit tests pass (`npm run test:unit`)
- [x] 23/23 Security rules emulator tests pass (`npm run test:rules`)
- [x] 0 ESLint errors (`npm run lint`)
- [x] Production build clean (`npm run build`)
- [x] Gmail SMTP handshake verified (`scratch/test-email.cjs`)
