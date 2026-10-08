# Documentation Index

Last reviewed against code: 2026-10-06

This project is mid-migration from single-user (`userId`) to multi-tenant B2B. Some docs describe the **current** app, some describe the **target** design. This index tells you which is which. Read it before trusting any other doc.

---

## 1. Read this first

| Doc | Purpose |
| :--- | :--- |
| [CURRENT_STATE.md](./CURRENT_STATE.md) | What the code actually does today. **Authoritative for current behavior.** |
| [../AGENTS.md](../AGENTS.md) | Rules for AI agents and contributors (process, protected files, vocabulary). |

When any other doc disagrees with `CURRENT_STATE.md` or the code, the code wins.

---

## 2. Target-state docs (planned B2B design, NOT current behavior)

Each carries a disclaimer header. They use `orgId` / `organization` vocabulary; the code uses `workspace` and still scopes data by `userId`. Do not implement from them without an explicit phase approval from the user.

| Doc | Describes | Status |
| :--- | :--- | :--- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Multi-tenant system design, claims-based auth, tenant isolation | Target state |
| [DATABASE.md](./DATABASE.md) | Firestore schema with `orgId`, `organizations`, role rules | Target state |
| [SERVICE_API.md](./SERVICE_API.md) | Service layer API scoped by `orgId` with audit stamping | Target state |
| [ROUTES.md](./ROUTES.md) | Routing table and role/org-aware guards | Partly current (paths), guards are target |
| [B2B_MIGRATION_STEP1.md](./B2B_MIGRATION_STEP1.md) | Ownership model and tenant architecture spec | Spec only, not implemented |
| [B2B_MIGRATION_PHASE4_SCRIPT.md](./B2B_MIGRATION_PHASE4_SCRIPT.md) | Plan for `scripts/migrate-to-b2b.js` | Script implemented (`scripts/migrate-to-b2b.js`), pending vocabulary alignment & verification |
| [CLERK_SETUP.md](./CLERK_SETUP.md) | Clerk JWT template and custom claims (Phase 1) | Partly applied, claims not used by the app |

---

## 3. Operational docs (not reviewed or changed in this docs pass)

| Doc | Purpose | Caveat |
| :--- | :--- | :--- |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Vercel deployment and CI/CD | GitHub Actions pipeline configured (`.github/workflows/ci.yml`) for lint, unit tests, emulator tests, and build |
| [DESIGN.md](./DESIGN.md) | Design system and UI tokens | - |
| [FEATURES.md](./FEATURES.md) | Feature matrix and roadmap | - |
| [RESPONSIVE.md](./RESPONSIVE.md) | Responsive and mobile strategy | - |
| [TESTING.md](./TESTING.md) | Testing strategy | Configured: Vitest unit tests (`test:unit`), rules tests (`test:rules`), and integration smoke suite (`test:integration`) on Firestore emulator |
| [B2B_MIGRATION_AUDIT_REPORT.md](./B2B_MIGRATION_AUDIT_REPORT.md) | Phase 0 & B2B remaining work audit | Comprehensive audit report (spec vs code vs verified, risks, roadmap) |

---

## 4. Which doc do I use?

- "How does it work right now?" → `CURRENT_STATE.md`, then the code.
- "What are we building toward?" → target-state docs in section 2.
- "What may an AI agent touch, and how?" → `../AGENTS.md`.
- "How do I deploy / style / make it responsive?" → operational docs in section 3.

---

## 5. Maintenance rules

1. Any change to rules, auth flow, collections, routes, or env vars updates `CURRENT_STATE.md` in the same change.
2. When a phase ships, move its target-state doc content into `CURRENT_STATE.md` and update the status in section 2 of this file.
3. Do not remove a disclaimer header until the whole doc matches the code.
