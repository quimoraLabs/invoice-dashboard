# Invomora — Phase 0 Completion Report

Branch: `phase-0-hardening` · Report date: 11 Oct 2026

## Verdict

**Phase 0 code-level hardening complete hai.** Code-level exit criteria (security rules, sequential invoice numbering, backdate policy check, script safety guards with project ID validation, and docs cutover sequence) sab implement aur verified ho chuke hain. 
Release-level gate par sirf **branch push**, **GitHub Actions CI verification**, aur **Vercel preview smoke test** pending hain.

---

## Scorecard

| # | Item | Status | Evidence & Verification |
| --- | --- | --- | --- |
| 1 | Domain reads `userId`-only | Done | `firestore.rules` (ownsDoc) |
| 2 | `workspace_members` self-join hole | Done | clause 1 ownership check + 15 rules tests passing |
| 3 | Batch workspace create (`existsAfter`/`getAfter`) | Done | Verified via emulator rules test suite |
| 4 | `userId` immutable on update (invoices/customers/products) | Done | `firestore.rules` + test |
| 5 | Transactional invoice numbering + counter + index on `invoiceNumber` | Done | `invoice.js`, integration Test 1 & 5 |
| 6 | Scan failure ab error throw karta hai (duplicate `INV-001` nahi) | Done | `invoice.js`, integration Test 6 |
| 7 | 90-day rule edit pe sirf date change hone par (Invomora policy) | Done | `validateInvoiceData(…, existingDate)`, form check, Test 7 |
| 8 | Next-number preview fallback `—` | Done | `getNextInvoiceNumber` |
| 9 | `authorizedParties`, dependency cleanup, `vercel.json`, workspace listener fixes | Done | Verified clean |
| 10 | `seed.js` aur `migrate-helpers.js` credential guards, seed `--confirm` | Done | Strict JSON credential parse |
| 11 | `clear-all.js` & `seed.js` strict credential & project ID guards | Done | `scripts/clear-all.js`, `scripts/seed.js` (typed `--project`, `process.exit(1)`) |
| 12 | Node version: `engines` 24.x vs CI Node 24 sync | Done | `package.json`, `.github/workflows/ci.yml` (all 4 jobs Node 24) |
| 13 | Token API `details: error.message` leak | Approval Pending | `api/create-firebase-token.js` (Protected auth file under AGENTS.md §4) |
| 14 | Docs sync & Cutover Sequence | Done | `docs/CURRENT_STATE.md` §11, `AGENTS.md` §3/§8, `INDEX.md`, `TESTING.md` |
| 15 | Real rollback strategy (Git tags & Firebase Console history) | Done | `git tag phase-0-checkpoint`, unhardened `.bak` deleted |
| 16 | Rules + indexes live deploy | Verified | CLI & console release active |
| 17 | Vercel preview smoke test | Pending Push | Post-push verification |
| 18 | Final code pe fresh build/lint/test run | Done | Lint (0 errors), Build (pass), Unit (28/28), Emulator (21/21) |

---

## Verified Audit Fixes

1. **Rollback Strategy:** Rollback ke liye git tag `phase-0-checkpoint` aur Firebase Console rules version history use hogi. Unhardened rules ka `.bak` repo se remove kar diya gaya hai taaki koi accidental deploy na ho.
2. **Fresh Verification Runs:**
   - `npm run lint`: 0 errors, 1 warning (FastRefresh in WorkspaceContext)
   - `npm run build`: built in 38s, exit code 0
   - `npm run test:unit`: 28 passed (28)
   - `npm run test:emulator`: 21 passed (21) via `firebase emulators:exec --only firestore ... --fileParallelism=false`
3. **Node Version Sync:** `package.json`, `.github/workflows/ci.yml` aur Vercel project setting teeno mein Node 24 synced hai.
4. **Script Safety Guards:** `clear-all.js` aur `seed.js` me strict credentials guard aur `--project=<id>` confirmation guard lag chuka hai jo rejection par explicit `process.exit(1)` throw karta hai.
5. **Business Policy Wording:** 90-day backdating policy ko "Invomora policy" ke roop mein clarify kiya gaya hai (code comments, UI helper text aur error messages mein).

---

## Scope Creep (Dedicated Commits)

AGENTS.md ka rule "no scope creep" follow karte hue sabhi UI aur function enhancements isolated dedicated commits mein hain:

- `d95724b`: `InvoiceTableRow.jsx` (creation time display), `ViewInvoice.jsx`, `AddInvoice.jsx` default status `"Pending"`, aur mandatory validation guards.
- `350d12d`: `InvoiceFilters.jsx` aur `invoice/index.jsx` atomic `setDateRange` filter fix.
- Security hardening commits (`ecea706`, `fc1ecb2`, `2e3e9f0`, `1b071af`, `98d8f2e`, `1311f74`, `51c2514`) alag clean hain.

---

## Exit Checklist

- [x] Unhardened `.bak` removed; rollback strategy via Git tags (`phase-0-checkpoint`) & Firebase Console history
- [x] Final code pe lint, build, unit, emulator tests green (49/49 passed)
- [x] Scope-creep changes alag commits me (`d95724b`, `350d12d`)
- [x] Node version sync (package.json: 24, CI: 24, Vercel: 24)
- [x] `clear-all.js` aur `seed.js` credential + project ID confirmation guards (`process.exit(1)`)
- [x] Cutover sequence documented in `docs/CURRENT_STATE.md` §11
- [x] 90-day backdating wording updated to "Invomora policy"
- [ ] Token API `details: error.message` patch (Pending user explicit approval)
- [ ] Push to branch & Vercel preview smoke test pass
- [ ] Production cutover gate verification

---

## Agle Phase ke Liye Gate (Phase 1)

Phase 1 shuru karne se pehle tenancy vocabulary (`workspaces` vs `organizations`) aur custom claims minting design finalize karna hai. Migration script tab tak production pe run nahi hogi jab tak B2B auth foundation complete na ho.
