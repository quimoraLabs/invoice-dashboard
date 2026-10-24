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
10. **Unified Single & Bulk (Excel/CSV) Import with Unique Codes & Image Fallback:**
   - **Segmented Top Switcher:** Integrated `[Single Entry]` and `[Multiple (Bulk Excel/CSV)]` tabs in both `CustomerForm.jsx` and `ProductForm.jsx`.
   - **Collision-Resistant Unique Codes:** Automatic generation of unique item codes (`PRD-XXXX`) and customer codes (`CUST-XXXX`) with display in tables and forms, preventing name collisions.
   - **Spreadsheet Parser & Template Generator (`src/utils/excelHelper.js`):** SheetJS (`xlsx`) integration for flexible header detection, template `.xlsx` downloads, and row validation.
   - **Interactive Bulk Import Hub (`BulkImportView.jsx`):** Live preview table, error line filtering, progress indicators, and safe 400-item Firestore `writeBatch` chunking.
   - **Image Fallback Display:** Graceful placeholder handling in `ProductTable.jsx` and `CustomerTable.jsx` when images are absent.
11. **ImageKit Smart Media Pipeline & Dual Storage Engine:**
   - **Serverless Authentication Endpoint (`/api/imagekit-auth.js`):** Generates HMAC-SHA1 signed upload credentials using `IMAGEKIT_PRIVATE_KEY`.
   - **Smart Transformation Adapter (`src/utils/imagekit.js`):** `getSmartImageUrl` with `cm-pad_resize` and `bg-blurred` preventing odd-ratio, half-cut, or stretched images.
   - **Folder Isolation & Duplicate Prevention:** Scoped folders (`/invomora/products`, `/invomora/customers`) with `useUniqueFileName: false` so re-uploads overwrite cleanly without duplicate files.
   - **Dual Engine Compatibility:** Cloudinary seamlessly retained as primary fallback for reports, invoices, and legacy media.
12. **Bulk Invoices Spreadsheet Ingestion with Line-by-Line Mismatch Resolver:**
   - **Interactive Resolver Modal (`BulkInvoiceImportModal.jsx`):** Pre-flight checks uploaded spreadsheet rows against workspace customers and products.
   - **Line-by-Line Error Identification:** Flags exact Excel row numbers (e.g. Line #4, Line #12) for unrecognized customers or inventory items.
   - **On-the-Fly Resolutions:** 1-click auto-creation of missing customers or catalog items, dropdown mapping to existing records, or individual row skipping.
   - **Atomic Transactional Batch Writes:** Scoped sequential numbering (`INV-001`) guaranteed via atomic counter increments, safe 400-item batch commits (`createBulkInvoices`), and immutable audit logging.
13. **Shadcn UI Foundation & AI Camera Receipt Scanner:**
   - **Shadcn/UI Canonical Foundation:** Integrated `cn()` utility (`clsx` + `tailwind-merge`) and core accessible primitives in `src/components/ui/` (`DropdownMenu`, `Drawer`, `Dialog`, `Tabs`, `Button`, `Badge`) fully mapped to Tailwind v4 canonical scale (`shrink-0`, `data-disabled:`, and design tokens).
   - **AI Camera Receipt Scanner (`CameraReceiptScannerModal.jsx`):** Allows mobile users to snap receipts via device camera (`capture="environment"`), desktop users to capture via webcam viewfinder, or upload bill screenshots.
   - **Multimodal AI OCR Pipeline (`api/scan-receipt.js`, `src/utils/receiptScanner.js`):** Client-side image auto-compression to max 1200px, serverless Groq Vision extraction (`llama-3.2-11b-vision-preview`), client-side offline heuristic fallback, and 1-click auto-population into `InvoiceForm`.

14. **B2B Customer & Product Master Data & Multimodal AI Ingestion:**
   - **B2B Customer Master:** Full support for `companyName`, `displayTradingName`, `industryType`, `gstin`, `pan`, `shippingAddress` (with toggle for same-as-billing), `paymentTerms` (Due on Receipt, Net 15, Net 30, Net 60), `currency`, and `openingBalance`.
   - **B2B Product & Service Master:** Segmented toggle for `Physical Product` vs `Professional Service`, unit selector (`Pcs`, `Hours`, `Days`, `Month`, `Project`, `Box`, `Kg`, `License`), `costPrice`, `stockQuantity` (hidden for services), GST `taxRate` (0%, 5%, 12%, 18%, 28%), and `hsn`/`sac` codes.
   - **Multimodal AI Camera Ingestion on All 3 Entities:** Unified `CameraReceiptScannerModal` across Invoices (receipt/bill scan), Customers (visiting card / business letterhead scan), and Products (packaging label / spec sheet scan) with live camera viewfinder, mobile autofocus rear camera, image drop, and instant OCR auto-population.
   - **Table & Modal Upgrades:** B2B badges (Type pill, GSTIN, Company Name, HSN/SAC, Unit, and Stock) rendered in `CustomerTable`, `ProductTable`, `CustomerViewModal`, and `ProductViewModal`.
   - **B2B Search:** Fast real-time multi-field search across Company Name, GSTIN, Customer Code, Item Code, HSN/SAC, and Item Classification.

---

## 5. Active Verification Checklist

- [x] 44/44 Unit tests pass (`npm run test:unit`)
- [x] 23/23 Security rules emulator tests pass (`npm run test:rules`)
- [x] 0 ESLint errors (`npm run lint`)
- [x] Production build clean (`npm run build`)
- [x] Tailwind CSS v4 canonical classes applied (`shrink-0`, `grow`, `max-w-35`, `data-disabled:`)
- [x] No protected auth files modified
- [x] Local work only (no `git push`)

