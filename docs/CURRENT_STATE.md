# Current State

Last reviewed against code: 2026-10-08

This is the only doc that describes what the code does **today**. Target-state docs are listed in [INDEX.md](./INDEX.md).

> **Phase 0 & B2B Status:** Security hardening and B2B multi-tenancy implementation complete. Domain collections, sequential counters, and business profiles scoped to active workspace with backward compatibility.
> **Passcode Protected Invites:** Workspaces feature a 6-digit security PIN (`invitePasscode`). Invitee must explicitly enter the owner's 6-digit passcode via the Invitations UI or `/api/accept-invite` to join. Silent auto-joining on login has been removed.
> **Audit Logging:** All mutations (`invoices`, `customers`, `products`, team invites, member joins/removals) are permanently written to an immutable `activity_logs` collection and viewable at `/activity-log`.

---

## 1. Stack and Deployment

| Area | Reality |
| :--- | :--- |
| Frontend | React 19, Vite, Tailwind CSS v4, React Router v7, client-side SPA |
| Auth | Clerk (`@clerk/react`) for login; Firebase Auth only as a session for Firestore |
| Database | Cloud Firestore (default database, `nam5`) |
| Image uploads | Cloudinary (`src/firebase/getFileUrl.js`, `VITE_CLOUDINARY_URL`, `VITE_CLOUDINARY_PRESET`). Firebase Storage is not used and `firebase.json` has no storage config. |
| Hosting | Vercel. `vercel.json` rewrites everything except `/api/*` to `/` (SPA). |
| Serverless | Three functions: `api/create-firebase-token.js`, `api/accept-invite.js`, and `api/my-invites.js` |
| Firebase config in repo | `firebase.json` (Firestore rules and indexes only), `firestore.rules`, `firestore.indexes.json` |

---

## 2. Authentication Flow (as implemented)

1. User signs in with Clerk (`/login`, `/register`).
2. `src/contexts/authContext/index.jsx` gets a Clerk token via `session.getToken({ template: "firebase" })`.
3. It POSTs that token to `/api/create-firebase-token`.
4. The function verifies it with `verifyToken` (`@clerk/backend`), resolves the active workspace (`workspaceId` and `role`) from token claims or `workspace_members`, and mints a Firebase custom token with `admin.auth().createCustomToken(userId, customClaims)`. Custom claims `{ workspaceId, role }` are minted into the Firebase token. Internal error details are masked to prevent leakages.
5. The client calls `signInWithCustomToken`. `request.auth.uid` in Firestore rules equals the Clerk user id (`user_...`), and `request.auth.token.workspaceId` and `request.auth.token.role` are available in Firebase custom claims.
6. The app renders only after the Firebase session is ready (`firebaseReady` gate).

Required server env (Vercel): `CLERK_SECRET_KEY` and the Firebase service account (`FIREBASE_SERVICE_ACCOUNT`). Required client env: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_FIREBASE_*`, `VITE_CLOUDINARY_*`. Note `.env.example` does not list the Cloudinary variables.

Local dev: `npm run dev` also serves the token, invite, and audit endpoints through middlewares in `vite.config.js`. `vercel dev` runs the real functions.

---

## 3. Data Model (what the code reads and writes)

Tenancy today is scoped by **workspace** (`workspaceId`).

| Collection | Key field | Notes |
| :--- | :--- | :--- |
| `invoices` | `workspaceId`, `userId` | Fields include `invoice_no`, `invoiceNumber`, `created_at`. Atomic sequential numbering via `createInvoiceWithNumber` with `workspaces/{workspaceId}/counters/invoice`. |
| `customers` | `workspaceId`, `userId` | `name`, `email`, `phone`, `gstin`, `address`, `company` |
| `products` | `workspaceId`, `userId` | `title`, `price`, `taxRate`, `hsn` |
| `business_profiles` | `workspaceId` (or user uid) | Read via `getBusinessProfile(scope)` in service layer (`src/firebase/profile.js`) for invoice GST headers. |
| `workspaces` | `ownerId`, `invitePasscode` | Created by `createWorkspace`. Includes 6-digit `invitePasscode` managed by owner. |
| `workspace_members` | doc id `{workspaceId}_{userId}`; fields `workspaceId`, `userId`, `role` | Roles used by the UI: `owner`, `accountant` |
| `workspace_invites` | `workspaceId`, `invitedEmail`, `role`, `status` | Pending invites. |
| `activity_logs` | `workspaceId`, `actorUid`, `action`, `createdAt` | Immutable workspace audit records. Update and delete blocked by Firestore rules. |

---

## 4. Firestore Security Rules

- Domain collections (`invoices`, `customers`, `products`):
  - B2B Multi-tenancy branching: If document contains `workspaceId`, access requires matching `request.auth.token.workspaceId` custom claim ($O(1)$ fast-path) or workspace membership check (`exists()`).
  - Immutability: B2B document `workspaceId` cannot be mutated on update.
  - Delete: restricted to workspace managers (owner/admin claims or workspace owner) or the original creator within that workspace.
- `workspaces`: read for members; create for authenticated owners; update/delete restricted to workspace managers/owners.
- `workspace_members`: read for members and self; create allowed for self-join on newly created workspace via atomic `writeBatch` or by existing workspace manager/owner; update by workspace manager; delete by self or workspace manager.
- `workspace_invites`: read for members or invitee whose email matches; create/update/delete by workspace manager.
- `activity_logs`: read and create allowed for authenticated workspace members; update and delete strictly forbidden (`allow update, delete: if false`).
- Verified: 23/23 rules tests passing in `test/firestore.rules.test.js` against Firebase emulator.

---

## 5. Routes (`src/App.jsx`)

`/` → `/home`, `/login/*`, `/register/*`, `/home`, `/invoice`, `/invoice/view/:invoiceId`, `/invoice/update/:invoiceId`, `/invoice/create`, `/customers`, `/products`, `/activity-log`, `/business-profile`, and `*` → `/login`. Guards are authentication-only (`ProtectedRoute`).

---

## 6. Service Layer (`src/firebase/`)

- `invoice.js`, `customer.js`, `product.js`: CRUD plus realtime listeners with dual-mode scoping (`resolveScope(scopeOrUserId)`). Stamped with automatic activity audit logging.
- `activity.js`: `logActivity`, `listenToActivityLogs`.
- `workspace.js`: `createWorkspace` (with 6-digit passcode), `updateWorkspaceSettings`, `regenerateWorkspacePasscode`, `listenToUserWorkspaces`, `listenToWorkspaceMembers`, `inviteMemberToWorkspace`, `listenToWorkspaceInvites`, `revokeWorkspaceInvite`, `removeWorkspaceMember`, `fetchMyPendingInvites`, `acceptWorkspaceInvite`, `declineWorkspaceInvite`.
- `profile.js`: Dual-writes and loads business profile by `workspaceId` with fallback to `userId`.


---

## 7. Workspace Feature (connected)

Exists & Connected:
- `WorkspaceContext`, `WorkspaceSwitcher`, `CreateWorkspaceModal`, `TeamModal`, default workspace auto-creation, invite creation and revocation, member list.
- **UI Integration (Phases 6 & 7):** All pages and domain components (`Home`, `InvoiceList`, `AddInvoice`, `UpdateInvoice`, `ViewInvoice`, `CustomerList`, `CustomerForm`, `ProductList`, `ProductForm`, `BusinessProfilePage`, `GraphInvoice`) consume `useWorkspace()` and scope all queries, mutations, and listeners to the active workspace (`{ workspaceId: activeWorkspace?.id, userId: targetUid }`).
- Data isolation: switching active workspace seamlessly triggers realtime listeners for that workspace's invoices, customers, and products.

Known problems & Phase 0 Hardening Status:
- `currentRole` falls back to `null` when no role is found. **(Fixed in Phase 0)**
- `listenToUserWorkspaces` uses `onError` guard and no longer calls `callback([])` on error, eliminating default-workspace creation spam. **(Fixed in Phase 0)**
- `createWorkspace` and `checkAndAcceptPendingInvites` use atomic `writeBatch`. **(Fixed in Phase 0)**
- Workspace IDs query avoids N+1 reads using chunked `where(documentId(), 'in', chunk)`. **(Fixed in Phase 0)**
- `TeamModal` refactored to consume centralized `WorkspaceContext` without duplicate listeners. **(Fixed in Phase 0)**
- Invite acceptance is client-side and unverified (full server-verified accept moves to `/api/accept-invite`).

---

## 8. Known Issues

1. Domain reads are open to any signed-in user in the uploaded rules (see section 4). **(Fixed in Phase 0 rules hardening and Phase 2 B2B isolation)**
2. Invoice numbering orders `invoice_no` as a string (breaks at `INV-1000`) and is not transactional. **(Fixed in Phase 0: atomic runTransaction with /users/{userId}/counters/invoice and /workspaces/{workspaceId}/counters/invoice, dual-write, and scan failure explicitly throwing error without fallback duplicate generation)**
3. Backdated invoice updates: 90-day backdating rule enforced on creation and only when `invoiceDate` changes during update; edits to existing backdated invoices without date modification are preserved. **(Fixed in Phase 0)**
4. Both `@clerk/clerk-react` and `@clerk/react` are in `package.json`; only `@clerk/react` is used. **(Phase 0)**
5. `vercel.json` contained an `env.NODE_OPTIONS` workaround. **(Phase 0)** removes it and pins `engines.node`; verify the API function on a preview deployment.
6. The token endpoint is duplicated in `vite.config.js` and `api/create-firebase-token.js`.
7. `visualizer()` runs on every build.


---

## 9. Operational Docs vs Reality

These docs were not changed in this pass, but they do not fully match the repo:

- `TESTING.md`: Vitest unit tests (`test:unit`), rules tests (`test:rules`), and integration tests (`test:integration`) are configured with Firebase emulator.
- `DEPLOYMENT.md`: GitHub Actions CI pipeline is configured in `.github/workflows/ci.yml` running lint, unit tests, emulator tests (Java 21), and build on pushes/PRs.

Check both against the repo before relying on them.

---

## 10. Target-State vs Current

| Topic | Target-state docs say | Code does today |
| :--- | :--- | :--- |
| Tenant key | `orgId` | `workspaceId` (standardized across code, rules, and scripts) |
| Tenant entity | `organizations` | `workspaces` (connected to domain data and UI) |
| Auth into rules | Custom claims (`orgId`, `role`) | Custom claims (`workspaceId`, `role`) minted into Firebase token |
| Field names | camelCase (`invoiceNumber`, `createdAt`) | Dual-support: camelCase primary (`invoiceNumber`, `workspaceId`) with legacy snake_case backward compatibility |
| Service signatures | Take `orgId`, stamp `actorUserId` | Take `scopeOrUserId` (`{ workspaceId, userId }`), stamps `workspaceId` and `userId` |
| Role enforcement | Rules and UI | Rules enforce manager/owner deletion and fast-path claim verification |
| Migration script | `scripts/migrate-to-b2b.js` | Aligned with `workspaces`, Timestamp parsing, and dual-profile creation (`scripts/migrate-to-b2b.js`, `scripts/migrate-repair.js`) |
| File storage | Firebase Storage | Cloudinary |

---

## 11. B2B Cutover Sequence & Tenancy Migration Order

To avoid cross-tenant leaks or breaking live production during migration to multi-tenancy:
1. **Firestore Data Backup:** Full Firestore export (`gcloud firestore export`) or PITR snapshot before running any migration scripts.
2. **Phase 1 (Auth Bridge):** Implemented Clerk Custom Claims (`workspaceId`, `role`) minting via `/api/create-firebase-token.js` with fallback to `workspace_members`. *(Complete)*
3. **Phase 2 (Rules Hardening):** Implemented `request.auth.token.workspaceId` custom claims support and dual-mode backward compatibility in `firestore.rules`. Verified with 23 emulator tests. *(Complete)*
4. **Phase 3 (Composite Indexes):** Staged `firestore.indexes.json` with composite indexes for `workspaceId` across `invoices`, `customers`, `products`, and `workspace_members`. *(Complete)*
5. **Phase 4 (Migration Scripts):** Aligned `scripts/migrate-to-b2b.js` and `scripts/migrate-repair.js` to `workspaces` schema, Timestamp conversions, and business profiles. Ready for live environment execution. *(Complete)*
6. **Phase 5 (Service Layer Cutover):** Re-scoped client queries (`invoice.js`, `customer.js`, `product.js`) to dual-mode `workspaceId`/`userId`. *(Complete)*
7. **Phase 6 & 7 (WorkspaceContext & UI):** Connected all UI pages and components to `useWorkspace()`. *(Complete)*
8. **Synchronized Production Deployment:** Deploy Firestore security rules, indexes, and client code together within the same maintenance window.
9. **Rollback Strategy:** Revert git commit via tag, restore rules version in Firebase Console Rules History, and restore Firestore data from step 1 export if data corruption occurs.

---

## 12. Remaining Operational Items

1. Run live data migration script (`scripts/migrate-to-b2b.js`) against target cloud Firestore environment when scheduled by user.
2. User sign-off prior to merging `phase-0-hardening` into `main`.

---

## 13. Update Protocol

Update this file in the same change as any change to rules, auth flow, collections, routes, env vars, or the workspace feature. Keep "Last reviewed against code" accurate.
