# Current State

Last reviewed against code: 2026-10-06 (snapshot of the uploaded `invoice-dashboard-main.zip`)

This is the only doc that describes what the code does **today**. Target-state docs are listed in [INDEX.md](./INDEX.md).

> **Phase 0 note:** a hardening patch (stricter `firestore.rules`, workspace listener fix, `currentRole` fallback, `authorizedParties`, dependency/engine cleanup) was prepared after this snapshot. Items it changes are marked **(Phase 0)**. Once the patch is applied and deployed, update those items and remove this note.

---

## 1. Stack and Deployment

| Area | Reality |
| :--- | :--- |
| Frontend | React 19, Vite, Tailwind CSS v4, React Router v7, client-side SPA |
| Auth | Clerk (`@clerk/react`) for login; Firebase Auth only as a session for Firestore |
| Database | Cloud Firestore (default database, `nam5`) |
| Image uploads | Cloudinary (`src/firebase/getFileUrl.js`, `VITE_CLOUDINARY_URL`, `VITE_CLOUDINARY_PRESET`). Firebase Storage is not used and `firebase.json` has no storage config. |
| Hosting | Vercel. `vercel.json` rewrites everything except `/api/*` to `/` (SPA). |
| Serverless | One function: `api/create-firebase-token.js` |
| Firebase config in repo | `firebase.json` (Firestore rules and indexes only), `firestore.rules`, `firestore.indexes.json` |

---

## 2. Authentication Flow (as implemented)

1. User signs in with Clerk (`/login`, `/register`).
2. `src/contexts/authContext/index.jsx` gets a Clerk token via `session.getToken({ template: "firebase" })`.
3. It POSTs that token to `/api/create-firebase-token`.
4. The function verifies it with `verifyToken` (`@clerk/backend`) and mints a Firebase custom token with `admin.auth().createCustomToken(userId)`. **No custom claims are added**, so `orgId` / `role` from the Clerk template never reach Firebase.
5. The client calls `signInWithCustomToken`. `request.auth.uid` in Firestore rules equals the Clerk user id (`user_...`).
6. The app renders only after the Firebase session is ready (`firebaseReady` gate).

Required server env (Vercel): `CLERK_SECRET_KEY` and the Firebase service account (`FIREBASE_SERVICE_ACCOUNT`). Required client env: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_FIREBASE_*`, `VITE_CLOUDINARY_*`. Note `.env.example` does not list the Cloudinary variables.

Local dev: `npm run dev` also serves the token endpoint through a middleware in `vite.config.js` (a duplicate of the API function). `vercel dev` runs the real function.

`verifyToken` has no effective origin check today; **(Phase 0)** adds `authorizedParties`, which has no effect on template tokens that lack an `azp` claim.

---

## 3. Data Model (what the code reads and writes)

Tenancy today is **per user**, not per organization or workspace.

| Collection | Key field | Notes |
| :--- | :--- | :--- |
| `invoices` | `userId` | Fields include `invoice_no`, `created_at` (snake_case). Next number via `getNextInvoiceNumber`, which needs the `invoices(userId asc, invoice_no desc)` index. |
| `customers` | `userId` | `created_at` |
| `products` | `userId` | `created_at` |
| `business_profiles` | doc id = user uid | Referenced by rules and `seed.js` only; no service in `src/` reads or writes it. |
| `workspaces` | `ownerId` | Created by `createWorkspace` |
| `workspace_members` | doc id `{workspaceId}_{userId}`; fields `workspaceId`, `userId`, `role` | Roles used by the UI: `owner`, `accountant` |
| `workspace_invites` | `workspaceId`, `invitedEmail`, `role`, `status` | Pending invites |

There is no `orgId` anywhere in application code (only in `seed.js`). There are no `organizations`, `organizationMembers`, or `organizationInvites` collections.

---

## 4. Firestore Security Rules

**As of the snapshot:**
- `invoices`, `customers`, `products`: `read` allowed for any signed-in user (cross-user data exposure). Create/update/delete check `userId`.
- `workspaces`, `workspace_members`, `workspace_invites`: read and write allowed for any signed-in user.
- `business_profiles`: doc id must equal the caller uid.

**(Phase 0):** reads on domain collections require `resource.data.userId == request.auth.uid`; workspace collections are membership-based (read only for members, invites only for owner/admin, no workspace update/delete, owners cannot be removed). Side effect: accepting invites by email no longer works until server-side invite handling exists.

Rules do not use custom claims and do not enforce roles beyond membership.

---

## 5. Routes (`src/App.jsx`)

`/` → `/home`, `/login/*`, `/register/*`, `/home`, `/invoice`, `/invoice/view/:invoiceId`, `/invoice/update/:invoiceId`, `/invoice/create`, `/customers`, `/products`, and `*` → `/login`. Guards are authentication-only (`ProtectedRoute`); there are no role- or workspace-based route guards.

---

## 6. Service Layer (`src/firebase/`)

- `invoice.js`, `customer.js`, `product.js`: CRUD plus realtime listeners, scoped with `where("userId", "==", uid)`.
- `workspace.js`: `createWorkspace`, `listenToUserWorkspaces`, `listenToWorkspaceMembers`, `inviteMemberToWorkspace`, `listenToWorkspaceInvites`, `revokeWorkspaceInvite`, `removeWorkspaceMember`, `checkAndAcceptPendingInvites`.
- `seed.js`: sample data helper. `getFileUrl.js`: Cloudinary upload. `firebaseConfig.js`: Firebase init.
- No service takes `orgId`, and none stamps audit metadata (`actorUserId`).

---

## 7. Workspace Feature (partial)

Exists: `WorkspaceContext`, `WorkspaceSwitcher`, `CreateWorkspaceModal`, `TeamModal`, default workspace auto-creation, invite creation and revocation, member list.

Not connected: switching workspace does not change which invoices, customers, or products are shown. All domain data is still loaded for the signed-in user's own `userId`, so an invited member does not see the owner's data.

Known problems:
- `currentRole` falls back to `"owner"` when no role is found. **(Phase 0)** changes it to `null`.
- `listenToUserWorkspaces` calls `callback([])` on errors, which can trigger repeated default-workspace creation. **(Phase 0)** removes this and adds an `onError` callback and a ref-based guard.
- Invite acceptance is client-side and unverified.

---

## 8. Known Issues

1. Domain reads are open to any signed-in user in the uploaded rules (see section 4). **(Phase 0)**
2. Invoice numbering orders `invoice_no` as a string (breaks at `INV-1000`) and is not transactional, so concurrent creates can collide.
3. Both `@clerk/clerk-react` and `@clerk/react` are in `package.json`; only `@clerk/react` is used. **(Phase 0)**
4. `vercel.json` contained an `env.NODE_OPTIONS` workaround. **(Phase 0)** removes it and pins `engines.node`; verify the API function on a preview deployment.
5. The token endpoint is duplicated in `vite.config.js` and `api/create-firebase-token.js`.
6. `visualizer()` runs on every build.

---

## 9. Operational Docs vs Reality

These docs were not changed in this pass, but they do not fully match the repo:

- `TESTING.md` describes Vitest, React Testing Library, and Playwright. `package.json` has no test script and none of these packages.
- `DEPLOYMENT.md` describes GitHub Actions CI. There is no `.github/` directory in the repo.

Check both against the repo before relying on them.

---

## 10. Target-State vs Current

| Topic | Target-state docs say | Code does today |
| :--- | :--- | :--- |
| Tenant key | `orgId` | `userId` |
| Tenant entity | `organizations` | `workspaces` (not linked to domain data) |
| Auth into rules | Custom claims (`orgId`, `role`) | `uid` only, no claims |
| Field names | camelCase (`invoiceNumber`, `createdAt`) | snake_case (`invoice_no`, `created_at`) |
| Service signatures | Take `orgId`, stamp `actorUserId` | Take `userId`, no audit stamping |
| Role enforcement | Rules and UI | None beyond workspace membership |
| Migration script | `scripts/migrate-to-b2b.js` | Does not exist; no `scripts/` directory |
| File storage | Firebase Storage | Cloudinary |

---

## 11. Not Started

Migration script; `orgId`/`workspaceId` on domain documents and queries; role enforcement in rules and UI; workspace switching endpoint; user provisioning webhook; server-side invite acceptance; rules tests (emulator); backup/export plan; org-scoped invoice sequence.

---

## 12. Update Protocol

Update this file in the same change as any change to rules, auth flow, collections, routes, env vars, or the workspace feature. Keep "Last reviewed against code" accurate.
