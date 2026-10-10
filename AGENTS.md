# AGENTS.md — Agent & AI Collaboration Directives
## Invoice Dashboard (Invomora)

---

## 1. Mission
Production SaaS built with **React 19**, **Vite**, **Tailwind CSS v4**, **Clerk Auth (`@clerk/react`)**, and **Firebase Firestore**, deployed on Vercel. Image uploads go through Cloudinary.

Every AI agent and human contributor MUST follow this file.

---

## 2. Source of Truth for Documentation
1. Start at [`docs/INDEX.md`](docs/INDEX.md). It says which doc to trust for what.
2. [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) describes what the code does **today**. It is the only doc that is authoritative about current behavior.
3. These docs describe the **planned B2B target state**, not current behavior, and carry a disclaimer header: `ARCHITECTURE.md`, `DATABASE.md`, `SERVICE_API.md`, `ROUTES.md`, `B2B_MIGRATION_STEP1.md`, `B2B_MIGRATION_PHASE4_SCRIPT.md`, `CLERK_SETUP.md`. Do NOT implement from them, and do NOT assume the code already matches them.
4. When docs and code disagree, the code wins. Report the mismatch to the user instead of "fixing" the code to match a target-state doc.
5. Reference only docs that exist in `/docs`. Do not invent or assume missing files.

---

## 3. Process Rules (read first)
1. **One tool, one branch, one phase at a time.** Only one AI tool may work on the repo at any time, on a dedicated branch, on a single named phase. Never mix phases in one change.
2. **No scope creep.** Do only the task explicitly requested. No drive-by refactors, renames, dependency changes, or "improvements".
3. **Ask before architecture changes.** New collections, new auth flows, tenancy changes, and global state refactors need explicit user approval first.
4. **Update `docs/CURRENT_STATE.md`** in the same change whenever behavior it describes changes (rules, auth flow, collections, routes, env vars).

---

## 4. AUTH FILES — DO NOT TOUCH
The following are protected. Do NOT edit, rename, delete, reformat, or "fix" them unless the user has explicitly approved that specific change in the current conversation:

- `src/contexts/authContext/*`
- `api/create-firebase-token.js`
- `vite.config.js` (the auth/token middleware section)
- `firestore.rules`
- `.env*`, service-account files, and any use of `CLERK_SECRET_KEY` / `FIREBASE_SERVICE_ACCOUNT`

**Any agent that edits these files without explicit user approval must be stopped and its changes reverted.** If a task seems to require touching them, STOP and ask the user.

### Clerk key rules
- `ClerkProvider` uses only `VITE_CLERK_PUBLISHABLE_KEY` (`pk_...`).
- `CLERK_SECRET_KEY` (`sk_...`) is used only in `api/create-firebase-token.js` via `process.env`. Never create `VITE_CLERK_SECRET_KEY`. Never reference the secret key anywhere under `src/`.

---

## 5. Tenancy Vocabulary
- The tenancy term in code is **workspace** (`workspaceId`, `workspaces`, `workspace_members`, `workspace_invites`).
- Do NOT introduce `orgId`, `organization`, `organizations`, or `organizationMembers` in code until the Phase 1 decision is made by the user. (Target-state docs use that vocabulary; that is not an instruction to use it.)
- **Current state:** domain collections (`invoices`, `customers`, `products`) are still keyed by `userId`, and Firestore rules enforce that. Do NOT change domain query scoping or document fields; that is a later phase (Phase 3) and needs explicit approval.

---

## 6. Business Rules (GST Compliance)
This section is authoritative for business logic. AI agents MUST follow these rules.

### 6.1 Invoice Date Policy
- Invoice date CANNOT be in the future (GST invalid).
- Invoice date CAN be backdated up to 90 days.
- Beyond 90 days: BLOCKED.
- Enforcement: HTML min/max + JS validation in InvoiceForm.jsx.

### 6.2 Duplicate Product Prevention
- A product appears only ONCE per invoice.
- Multiple units = increase quantity.
- Enforcement: dropdown filter + validation in InvoiceForm.jsx.
### 6.3 Invoice Numbering
- Sequential: INV-001, INV-002...
- No gaps (GST).
- User-scoped transactional counter (`/users/{userId}/counters/invoice`).
- Status: Implemented in Phase 0 via `runTransaction` with numeric incrementation and dual-write (`invoiceNumber` and legacy `invoice_no`).


### 6.4 Tax Rules
- Default GST: 18% (overridable per product).
- taxAmount = subtotal * taxRate / 100.
- Rounding: 2 decimals.

### 6.5 Payment Status
- Draft, Pending, Paid, Overdue.
- Paid requires payment_type (UPI, Card, Cash).

### 6.6 Pending Decisions
- Default due date (30 days?)
- GSTIN validation
- Credit notes handling
- Multi-currency: out of scope for v1.

---

## 7. Stack Invariants
1. **Tailwind CSS v4:** use `@tailwindcss/vite` and the `@theme` block in `src/index.css`. No `tailwind.config.js`.
2. **React 19 & React Router v7:** follow current hook rules; routing is centralized in `src/App.jsx`.
3. **Component isolation:** domain components live in `src/components/{domain}/`; generic UI in `src/components/` or `src/components/modals/`.
4. **Service layer:** Firestore calls live in `src/firebase/`; pages and components do not call low-level Firestore primitives directly.

---

## 8. Commands
- Dev server: `npm run dev` (note: `/api` routes need `vercel dev`)
- Build: `npm run build`
- Lint: `npm run lint`
- Tests:
  - Unit tests: `npm run test:unit` (Vitest)
  - Security Rules tests: `npm run test:rules` (Firestore Emulator)
  - Integration tests: `npm run test:integration` (Firestore Emulator)
  - Full emulator suite: `npm run test:emulator`

Before marking any task done: `npm run build`, `npm run lint`, and tests pass, and mobile viewports are checked if layout changed.


---

## 9. Directory Map
```
├── PRD.md
├── AGENTS.md
├── api/                    # Vercel serverless functions (create-firebase-token.js)
├── docs/                   # Specs; start at docs/INDEX.md
├── src/
│   ├── App.jsx             # Shell & router
│   ├── index.css           # Tailwind v4 theme & base styles
│   ├── auth/               # Login & Register views
│   ├── components/         # Shared and domain components (incl. workspace/)
│   ├── contexts/           # AuthContext, WorkspaceContext
│   ├── firebase/           # Firestore service functions & config
│   ├── header/             # Navbar
│   └── pages/              # Home, Invoice, Customer, Product
```

---

## 10. Editing & Prompting Rules
- Keep edits surgical and localized. Do not remove unrelated comments or logic.
- Show what changed in the final message.
- Never reproduce, log, or commit secrets.

---

## 11. Security & Environment
- Never expose secret keys in client code.
- Client config uses `VITE_FIREBASE_*`, `VITE_CLERK_PUBLISHABLE_KEY`, and `VITE_CLOUDINARY_*` only.
- `.env`, `.env.local`, and service-account JSON files must stay out of git.

---

## 12. Verification Checklist
- [ ] Only the requested phase/task was touched.
- [ ] No protected auth file was modified (or user approved it explicitly).
- [ ] `docs/CURRENT_STATE.md` updated if current behavior changed.
- [ ] No hardcoded colors; design tokens used.
- [ ] Loading, Empty, and Error states handled.
- [ ] `npm run build` and `npm run lint` pass.
