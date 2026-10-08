# B2B Migration: Final Remaining Work Report
**Branch:** `phase-0-hardening`  
**Date:** 8 Oct 2026  
**Auditor:** Pair Programming Review

---

## 1. Executive Summary

Phase 0 (security hardening) lagbhag ho chuka hai, aur uske upar migration/seed/clear scripts, Business Profile page aur Floci adapter bhi bane hain. Par **B2B tenancy abhi bhi live code me nahi hai**: `invoice.js`, `customer.js` aur `product.js` ab bhi sirf `userId` se scope hote hain (`invoice.js:28,54,104`, `customer.js:59`, `product.js:53`), koi page `useWorkspace` use nahi karta, aur token me `orgId`/`role` claims mint nahi hote (`api/create-firebase-token.js:91`). Functional kaam ka lagbhag **20-25%** (≈5 of ≈20 working days) ho chuka hai, aur zyadatar foundation hai.

Production cutover ko ye cheezein rok rahi hain:
1. Tenant entity ka vocabulary tay nahi hai: migration `organizations` banata hai, app `workspaces` use karta hai.
2. Invoice numbering ka index galat field pe hai, to merge ke baad purane users ke invoices me duplicate `INV-001` ban sakta hai.
3. Rules me workspace membership ka authorization hole hai aur invite flow poora toota hua hai.
4. Koi B2B test nahi hai.

**Verdict: Main branch merge ke liye NO.** Phase-0 hardening ka hissa 3 fixes (Section 8) ke baad *Partial* me merge ho sakta hai, B2B ka nahi.

---

## 2. Completed Work (with evidence)

**Legend:**
- **Spec:** Sirf documentation me hai.
- **Code:** File/code maujood hai.
- **Verified:** Repo me testing ka concrete saboot hai.

| Item | Level | Evidence / Caveat |
|---|---|---|
| Auth bridge Clerk→Firebase | Code (local+prod me operational report kiya gaya) | `api/create-firebase-token.js:36-101`, `authContext/index.jsx:14-80`. `firebaseReady` gate (:98-137), error screen with retry. |
| `authorizedParties` | Code, par lagbhag no-op | `api:63-82`. Client template token bhejta hai (`authContext:21`) jisme aksar `azp` nahi hota, to check skip ho jaata hai. |
| Rules tightening | Code | `firestore.rules:25-41` domain reads `userId`-owned. Pehle open reads the. Neeche section 6 me holes hain. |
| Workspace listener fix | Code | `workspace.js:59-102` (`callback([])` hata, `onError` add), `WorkspaceContext.jsx:21,51-67` ref guard, `:112` `currentRole = null`. |
| Dependency/config cleanup | Code | `@clerk/clerk-react` hata, `vercel.json` clean (`NODE_OPTIONS` hack nahi), `/api` rewrite se excluded. **Note:** `package.json:6-8` me `engines.node` `24.x` hai (pehle 20.x manga tha). Vercel project setting verify karo. |
| camelCase standardization | **PARTIAL** | Writes camelCase (`invoice.js:55`, `customer.js:35`, `product.js:29`, `profile.js:39,44`), par ~14 files me `x \|\| legacy_x` dual-read bacha hai (jaise `customer.js` ke 8 legacy references). Ye safe hai (purana data dikhta rahega), par "standardization" poori nahi hui. `docs/DATABASE.md:3` ab bhi snake_case likhta hai. |
| Migration script (Phase 4) | **Code, never verified** | `scripts/migrate-to-b2b.js` (246 lines): default dry-run (`:8`), `--execute`, `--user=`, `--limit=`, `--repair-clerk`, chunked 400-doc batches, Clerk rate-limit+retry (`migrate-helpers.js:37-54`). Repo me koi dry-run report nahi (`scripts/migration-report.json` gitignored). Problems section 3/6 me. |
| Seed script (Groq + fallback) | Code | `scripts/seed.js:30-33` (Groq model), fallbacks at `:135,190,300`. Destructive `clearData` pehle chalta hai (`:416-446`) bina confirm flag ke. |
| Business Profile page | Code | `pages/profile/index.jsx`, route `/business-profile` (`App.jsx:98`), `firebase/profile.js`. **PDF/invoice view isse branding nahi leta** (`getBusinessProfile` ka koi consumer `pages/profile` ke bahar nahi). |
| Floci media adapter | Code | `src/firebase/mediaAdapter.js` (172 lines), `docker-compose.floci.yml`, `.env.example:16-21` (`VITE_USE_FLOCI=false` default). Chalne ka saboot nahi. |
| Data clear script | Code | `scripts/clear-all.js`, `--confirm` guard (`:109`). Production-safety guards nahi hain (section 6). |
| Docs: INDEX, CURRENT_STATE, AGENTS, disclaimers, PRD §4, DEPLOYMENT §2.1 | Done, par **stale** | Section 4 me mismatch table. |

---

## 3. Remaining Work by Phase

*Effort estimate 1 developer + AI pair programming ke hisaab se hai.*

### Phase 1: Clerk JWT template + Custom Claims
- **Status:** **NOT STARTED** (spec `docs/CLERK_SETUP.md`; sirf script `migrate-helpers.js:37-42` Clerk `private_metadata` likhta hai).
- **Files:** `api/create-firebase-token.js`, `vite.config.js:22-75` (duplicate middleware), `authContext/index.jsx`.
- **Tasks:** Token me `orgId`/`role` mint karna (abhi sirf uid, `api:91`); Clerk template/metadata set karna; claims ka design final karna; dev middleware ko API ke saath sync rakhna ya hatana.
- **Depends on:** Vocabulary decision, Clerk dashboard access.
- **Effort:** 0.5 din

### Phase 2: Rules deploy (Custom Claims)
- **Status:** **PARTIAL.** Rules file hai par `userId`/membership based hai, claims/`orgId` based nahi. Live me kya deployed hai, repo se pata nahi.
- **Files:** `firestore.rules`.
- **Tasks:** `workspace_members` hole band karna (`:59-62`), invite read/accept (`:72`), `orgId` rules (transition ke liye `userId` ya `orgId`), emulator tests, `firebase deploy --only firestore:rules`.
- **Depends on:** Phase 1 (ya membership-`get()` design).
- **Effort:** 1-2 din

### Phase 3: Composite indexes
- **Status:** **PARTIAL/BROKEN.** `firestore.indexes.json:4-9` me index `(userId, invoice_no desc)` hai, par code `orderBy("invoiceNumber")` karta hai (`invoice.js:28`).
- **Tasks:** Sahi index (`userId`+`invoiceNumber`, baad me `orgId`+`invoiceNumber`, aur jo aur queries add hongi), deploy, build hone ka wait.
- **Depends on:** Phase 5 ke query shape.
- **Effort:** 2-3 ghante

### Phase 4: Migration execution
- **Status:** **PARTIAL** (script hai, run nahi hua).
- **Files:** `scripts/migrate-*.js`.
- **Tasks:** Pehle script ke issues fix karna (Section 6), vocabulary se match karana, Firestore export, dry-run, 1 test user (`--user=`), full run, post-checks.
- **Depends on:** Phase 2, 3, vocabulary decision.
- **Effort:** 1.5 din

### Phase 5: Service layer camelCase + orgId scoping
- **Status:** **PARTIAL.** camelCase writes hain, `orgId` scoping **NOT STARTED**.
- **Files:** `invoice.js`, `customer.js`, `product.js`, `profile.js` (parameter `orgId` hai par doc `business_profiles/{userId}`, `pages/profile/index.jsx:43,57,151`).
- **Tasks:** Sab queries/writes `orgId`/`workspaceId` pe; audit stamping; transactional invoice numbering; legacy dual-read hatana (migration ke baad).
- **Depends on:** Phase 4 (data stamped) ya dual-mode.
- **Effort:** 2-3 din

### Phase 6: WorkspaceContext refactor
- **Status:** **PARTIAL.** Listener/role fixes ho gaye, active org abhi `localStorage` se (`WorkspaceContext.jsx:12-19,81-100`), claims/token refresh nahi.
- **Tasks:** Active org resolution, org switch pe token refresh + re-sign-in, switch endpoint (Gap 4).
- **Depends on:** Phase 1.
- **Effort:** 1-2 din

### Phase 7: Pages/components consume `activeOrgId`
- **Status:** **NOT STARTED.** Har page `targetUid = currentUser...` use karta hai (`Home.jsx:24`, `customer/index.jsx:29`, `AddInvoice.jsx:18`, `UpdateInvoice.jsx:15`, `ViewInvoice.jsx:34`, `invoice/index.jsx:17`, `product/index.jsx:25`, `profile/index.jsx:43`). `useWorkspace` sirf 4 workspace components me hai.
- **Tasks:** ~8 pages, role-based UI gating, PDF me org branding.
- **Depends on:** Phase 5, 6.
- **Effort:** 2-3 din

### Phase 8: Testing
- **Status:** **NOT STARTED** (dekhein Section 5).
- **Effort:** 3-4 din

### Phase 9: Production cutover + rollback
- **Status:** **NOT STARTED.**
- **Depends on:** Sabhi phases.
- **Effort:** 1 din + monitoring window

---

## 4. Gaps Not Covered by Any Phase

| Gap | Status |
|---|---|
| Invite accept server-side | Abhi client-side (`workspace.js:212-256`), rules se teen jagah toota (Section 6). ~2 din |
| Clerk `user.created` webhook (default org provisioning) | Nahi hai. Abhi client auto-create (`WorkspaceContext.jsx:51-67`). ~1 din |
| Org switching endpoint | Nahi hai. ~1 din |
| Password reset | Clerk handle karta hai; kuch custom nahi chahiye, bas production me verify |
| Storage rules | Firebase Storage use nahi hota (Cloudinary prod, Floci local); `firebase.json` me storage nahi. Docs ab bhi Storage likhte hain |
| Error boundaries | Nahi hain (`ErrorBoundary`/Sentry grep me kuch nahi). ~2-3 ghante |
| API rate limiting | `/api/create-firebase-token` pe nahi. Vercel firewall rule. ~1 ghanta |
| Backup/export | Plan nahi; `clear-all.js` aur migration ke liye pehle zaroori |
| Monitoring/logging | `.env.example` me Sentry sirf commented hai; kuch wired nahi |
| Rollback procedure | Kahin documented nahi |
| Vercel env verification | `.env.example` me `CLERK_SECRET_KEY`, `FIREBASE_SERVICE_ACCOUNT`, `APP_URL`, `VITE_CLOUDINARY_*`, `GROQ` missing hain |
| CORS | `/api` same-origin hai, headers ki zaroorat nahi; Floci bucket CORS sirf localhost (`mediaAdapter.js:23-45`) |
| Firestore backup | PITR/scheduled backups enable nahi dikhte; export ke liye billing enabled (Blaze) chahiye |
| Invoice numbering | String `orderBy`, 1000 ke baad galat, race condition (`invoice.js:24-41`), aur legacy docs me `invoiceNumber` na hone se query unhe skip karti hai |

### Doc vs Code Mismatches

| Doc | Kya kehta hai | Code |
|---|---|---|
| `docs/CURRENT_STATE.md:3,7` | Pre-Phase-0 snapshot, "patch was prepared" | Patch lag chuka |
| `CURRENT_STATE.md:56,84` | `orgId` app code me nahi | `profile.js:12-26`, `seed.js`, scripts me hai |
| `CURRENT_STATE.md:140`, `INDEX.md`, `B2B_MIGRATION_PHASE4_SCRIPT.md` header | "Script does not exist" | `scripts/migrate-to-b2b.js` hai |
| `DEPLOYMENT.md:25-31` | `vercel.json` me `NODE_OPTIONS` | Asli file me nahi |
| `DEPLOYMENT.md:3,91`, `TESTING.md:3-13` | GitHub Actions; Vitest/RTL/Playwright | `.github/` nahi, `vitest` package.json me nahi |
| `docs/DATABASE.md:3` | snake_case | Writes camelCase |
| `AGENTS.md` §5 | `orgId` mat use karo | `src/firebase/profile.js` me `orgId` |

---

## 5. Test Coverage Audit

**Aaj kya hai:**  
`src/breakpoints.test.js` (1 test, CSS breakpoint tokens check). Ye **chal nahi sakta**: `vitest` `package.json` me nahi hai aur `test` script nahi hai. `scripts/test-admin.js` aur `scripts/test-migration-query.js` tests nahi, manual debug scripts hain (second me real user id hardcoded hai, `:7`).

**B2B ke liye Test Checklist (sab missing):**
- [ ] Do users, do orgs: cross-org read/write/query leak test (emulator)
- [ ] Rules: unauthenticated, non-member, member, owner ke liye har collection ke allow/deny
- [ ] `workspace_members` self-create as owner kisi doosre workspace pe deny hona chahiye
- [ ] Roles (owner/admin/accountant/viewer) enforcement, rules aur UI dono me
- [ ] Org switch pe token refresh aur data refresh
- [ ] Invoice CRUD under org scope; sequential numbering under concurrency
- [ ] Legacy (snake_case, orgId-less) docs ka read compatibility
- [ ] PDF generation with org branding (abhi feature hi wired nahi)
- [ ] Migration idempotency: do baar run, same result; partial failure ke baad re-run
- [ ] Migration: date string formats, missing fields, user with zero data
- [ ] Token endpoint: bad/expired token, wrong origin, missing env
- [ ] E2E: signup → default workspace → invoice create → invite → accept

---

## 6. Security Audit

### Firestore Rules (`firestore.rules`)
- **High: `workspace_members` create (`:59-62`).** Pehla clause `userId == auth.uid && role == 'owner'` na workspace ownership check karta hai, na doc ID `{workspaceId}_{uid}` enforce karta hai. Koi bhi signed-in user kisi bhi `workspaceId` ke liye khud ko owner member bana sakta hai. Phir wo workspace padh/update/delete kar sakta hai, members add kar sakta hai aur invites (emails) padh sakta hai. Abhi workspace ID guess karna padega (auto-IDs), aur domain data `userId`-scoped hai isliye tatkaal data leak nahi. Par jaise hi data workspace/org se scope hoga, ye full cross-tenant breach ban jaayega.
- **Invites poore toote hue hain:**
  1. Invite read `request.auth.token.email` (`:72`) pe depend karta hai, par custom token me email claim hota hi nahi (`api:91`).
  2. Accept me invitee `accountant` role ke saath member banna chahta hai, par rule sirf `role=='owner'` self-create allow karta hai (`:60`).
  3. Invite update sirf owner kar sakta hai (`:76`).
- `isWorkspaceOwner` `get()` bina `exists()` ke (`:22`), safe (deny hota hai), par fragile.
- Admin role rules me nahi hai, sirf owner/accountant.
- Domain collections abhi bhi **userId-only** hain (`:25-41`), `orgId` ka koi path nahi.
- `business_profiles` `docId == uid` (`:44`): migration ke baad profile `orgId` doc me move hota hai, to profile page khali dikhega.

### Custom Claims
Mint nahi hote (`api:91` `createCustomToken(userId)`). `docs/CLERK_SETUP.md` ki claims wali baat code me nahi hai.

### userId-only Paths
`invoice.js`, `customer.js`, `product.js`, saari pages (`targetUid`), rules domain section, `seed.js` ka `clearData`.

### Secrets & Leak Risks
- **Low:** `api:97-100` error me `details: error.message` client ko jaata hai (config names leak ho sakte hain).
- **Medium (config):** `.env.example:19-20` Floci S3 keys `VITE_` prefix ke saath hain, to client bundle me jaate hain. Abhi `test` values aur default `false` hain, par Vercel pe `true` set hua to risk.
- **Medium:** Cloudinary unsigned upload preset (`getFileUrl.js`) public hai, abuse ho sakta hai.
- `.gitignore` sahi hai (`.env*`, `serviceAccount*.json`, `scripts/migration-report.json`).
- **Scripts production-dangerous hain:** `clear-all.js:109` sirf `--confirm` pe delete karta hai, project ID dikhata/poochta nahi, aur `:47-54` list me `workspaces`/`workspace_members`/`workspace_invites` nahi hain par `organizations`/`organizationMembers` hain. `migrate-helpers.js:10-25` service account parse fail hone par chupchap `applicationDefault` pe chala jaata hai. `.firebaserc` ka default project production hai. `seed.js:416-446` bina confirm ke user ka data mita deta hai.

### Migration Script ki Dikkatein
- `organizations`/`organizationMembers` banata hai (`:67-101`), jabki app `workspaces` use karta hai. Migrate kiya hua data app ko dikhega hi nahi, aur app apna alag default workspace bana dega.
- Business profile ko `orgId` doc me move karke legacy doc delete karta hai (`:171-196`), jabki app `business_profiles/{uid}` padhta hai. Run karne par profiles "ghayab" ho jaayenge.
- Date conversion (`:142-152`) sirf `YYYY-MM-DD` maanta hai; ISO string pe Invalid Date throw karega, aur user ki kuch batches pehle commit ho chuki hongi (per-user atomic nahi).
- `console.assert` (`:227,234`) fail pe exit nahi karta; `:246` `.catch(console.error)` se exit code 0 rehta hai, to automation ko failure dikhega hi nahi.
- Pagination condition (`:42`) operator precedence ki wajah se null batch pe crash kar sakti hai.
- Clerk `private_metadata` set karta hai (`:200-209`) par token ye claims ke roop me nahi bhejta, to ye likhna abhi bekaar hai.

---

## 7. Production Cutover Checklist

Code purane aur naye fields dono padhta hai (dual-read) aur abhi `userId`-scoped hai. Isliye **Phase-0 hardening ko B2B se alag, pehle merge karna safe path hai (Stage A)**. Stage B uske baad aayega.

### Stage A (Phase-0 Only — Safe to merge after quick fixes)
1. Invoice numbering index fix deploy.
2. Vercel preview pe login + CRUD validation.
3. `firebase deploy --only firestore:indexes`.
4. Rules security holes patch & deploy.
5. Merge branch into main & smoke test.

### Stage B (B2B Full Migration)
1. **Pre-merge validation:** Vocabulary decision, Phases 1-3 aur 5-7 complete, emulator + E2E tests green, `npm run build` + `lint` clean, docs refreshed.
2. **Data backup:** Firestore export (billing enabled) ya PITR on, aur export ka restore test.
3. **Migration dry-run:** Production project ke against read-only, report review (doc count, errors).
4. **Test-user migration:** Ek user (`--user=`), uska app flow end-to-end verify.
5. **Full migration:** `--execute`, post-checks manually verify (script ke assert pe bharosa mat karo).
6. **Rules + indexes deploy:** Pehle indexes (build wait), phir rules.
7. **Preview deployment test:** Vercel preview pe do orgs ke saath cross-org leak test.
8. **Main merge.**
9. **Production smoke test:** Login, invoice create/PDF, org switch, invite, profile.
10. **Rollback triggers:** Login failure rate, permission-denied spike, duplicate invoice numbers, missing data reports. **Procedure:** Purane rules file (`.bak`) redeploy, previous Vercel deployment promote, data export se restore.

---

## 8. What Can Be Done Today (Actionable Plan)

### Quick Wins (< 4 ghante)
1. **Invoice numbering fix (30-60 min):** Index `invoiceNumber` pe, aur legacy docs ke liye fallback. Isse merge-blocking bug jaati hai.
2. **`workspace_members` create rule tight karna (~1h):** Doc ID aur workspace ownership check. *(Note: `firestore.rules` AGENTS.md me protected hai, explicit approval required).*
3. **Docs refresh (45 min):** `CURRENT_STATE.md`, `DEPLOYMENT.md` `vercel.json` block, `INDEX.md` statuses, `DATABASE.md` camelCase note.
4. **`.env.example` refresh (10 min):** Missing variables add karna.
5. **Script guards (30 min):** `clear-all.js` aur `seed.js` me project ID confirmation prompt; `test-migration-query.js` se hardcoded user id hatana.
6. **`vitest` setup (30 min):** Install + `test` script in `package.json`, taaki existing test pass ho sake.

### Multi-Day Dependencies
- Phases 5, 6, 7, 8
- Server-side invites
- Webhook implementation
- Org switch endpoint

### External Dependencies / Blockers
- **Clerk Dashboard:** JWT template/claims, webhook endpoint + signing secret.
- **Vercel:** Env vars (`CLERK_SECRET_KEY`, `FIREBASE_SERVICE_ACCOUNT`, `APP_URL`), Node 24.x setting, firewall rate limit.
- **Firebase Console/gcloud:** Rules/indexes deploy, billing (export), backup/PITR enable.

---

## 9. Final Verdict & Recommendations

- **Total Remaining Effort:** Lagbhag **18-22 working days** (3-4 hafte).
- **Highest Risk Items:**
  1. Phase 4 data migration (irreversible risk, entity mismatch, profile deletion bug).
  2. Rules cutover timing.
  3. Tenancy design decision (claims vs membership-doc lookup).
- **Recommended Next Action:**
  1. Pehle **tenancy vocabulary aur claims/membership design finalize karo** (`workspaces` vs `organizations`).
  2. Stage A (Phase-0 hardening + invoice numbering fix) merge karo.
  3. Migration script tab tak production/staging pe na chalayein jab tak entity alignment complete na ho.
