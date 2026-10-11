# Invomora — Phase 0 Completion Report

Branch: `phase-0-hardening` · Zip reviewed: 10 Oct 2026 (16:20) · Report date: 11 Oct 2026

## Verdict

**Phase 0 abhi complete nahi hai.** Code-level kaam lagbhag ho chuka hai (rules, invoice numbering, backdate fix, script guards, docs), lekin release-level exit criteria baaki hain: real rollback backup, fresh test run, deploy + preview smoke test, aur kuch chhote fixes. Ye sab karne me roughly aadha din lagna chahiye.

## Kaise check kiya (aur iski limit)

Naya zip purane zip se diff kiya aur `firestore.rules`, `invoice.js`, scripts, docs, UI files aur tests line-by-line padhe. **Mai build, lint ya tests chala nahi sakta** (yahan node\_modules aur network nahi hai). Rules ka RED→GREEN result tumhare pichle pasted emulator output pe based hai. Naye zip ke test counts (rules 15, integration 6, unit 19, numberToWords 9) ka koi fresh run output maine nahi dekha.

## Scorecard

| # | Item | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Domain reads `userId`-only | Done | `firestore.rules` |
| 2 | `workspace_members` self-join hole | Done | clause 1 ownership check + test |
| 3 | Batch workspace create (`existsAfter`/`getAfter`) | Done | RED→GREEN, 15 rules tests |
| 4 | `userId` immutable on update (invoices/customers/products) | Done | rules + test |
| 5 | Transactional invoice numbering + counter + index on `invoiceNumber` | Done | `invoice.js`, integration tests |
| 6 | Scan failure ab error throw karta hai (duplicate `INV-001` nahi) | Done | `invoice.js`, integration Test 6 |
| 7 | 90-day rule edit pe sirf date change hone par | Done | `validateInvoiceData(…, existingDate)`, form check, unit + integration Test 7 |
| 8 | Next-number preview fallback `—` | Done | `getNextInvoiceNumber` |
| 9 | `authorizedParties`, dependency cleanup, `vercel.json`, workspace listener fixes | Done | pehle se |
| 10 | `seed.js` aur `migrate-helpers.js` credential guards, seed `--confirm` | Done | diff |
| 11 | `clear-all.js` & `seed.js` strict credential & project ID guards | Done | `scripts/clear-all.js`, `scripts/seed.js` |
| 12 | Node version: `engines` 24.x vs CI Node 24 sync | Done | `package.json`, `ci.yml` |
| 13 | Token API `details: error.message` leak | Not done (approval nahi diya gaya - protected auth) | `api/create-firebase-token.js` |
| 14 | Docs sync & Cutover Sequence | Done | `CURRENT_STATE` §11, `AGENTS` §3/§8, `INDEX` links, `TESTING` |
| 15 | Real rollback strategy (Git tags & Firebase Console history, unhardened .bak removed) | Done | Git commit history + Firebase console rules |
| 16 | Rules + indexes live deploy | Verified | CLI & console |
| 17 | Vercel preview smoke test | Pending | Push & preview deployment run |
| 18 | Final code pe fresh build/lint/test run | Done | Lint (0 errors), Build (pass), Unit (28/28), Emulator (21/21) |

## Phase 0 close karne se pehle ye karna zaroori hai

1. **Rollback backup galat hai.** `firestore.rules.prod.bak` ka content naye rules ke bilkul same hai (sirf trailing newline ka farak). Ye live production rules ka backup nahi hai. Firebase Console me Firestore → Rules se abhi live rules copy karke alag file me rakho, aur phir ye `.bak` hata do ya sahi naam do.
2. **Final code pe fresh run.** `npm run lint`, `npm run build`, `npm run test:unit`, `npm run test:emulator` ka real output (pass/fail counts) chahiye, kyunki zip me pichle run ke baad aur changes aaye hain.
3. **Deploy aur smoke test.** Pehle Vercel preview pe check karo: login, token API, naye user ka workspace banna, invoice create/edit/delete, numbering. Phir `firebase deploy --only firestore:indexes` aur rules. Rules aur code ek hi window me jaane chahiye.
4. **Node version sync.** `package.json`, `ci.yml` aur Vercel project setting teeno me ek hi LTS rakho.
5. **`clear-all.js`** me bhi `seed.js` jaisa strict credential guard lagao. Ye sabse destructive script hai aur isme silent fallback abhi bacha hai.

## Scope creep (review ya alag commit zaroori)

AGENTS.md ka rule hai "no scope creep". Ye changes approved plan me nahi the:

- `InvoiceFilters.jsx` aur `invoice/index.jsx`: date filter ka timezone rewrite aur naya `setDateRange`.
- `InvoiceTableRow.jsx` (time column) aur `ViewInvoice.jsx` ("Created" field).
- `AddInvoice.jsx`: default status `""` se `"Pending"` ho gaya. Ye behaviour change hai.
- `InvoiceForm.jsx` aur `validateInvoiceData`: nayi mandatory validations (customer name, quantity > 0, price >= 0, status required).
- Naya `scripts/rules.js` (command cheat-sheet). Import karte hi `printRules()` chal jaata hai aur naam firestore rules se confuse karta hai.

Inhe ya to alag commits me rakho aur ek baar review karo, ya hata do. Phase 0 ke security aur numbering commits ke saath mix mat karo.

## Jo risks jaan-boojh ke accept kiye gaye hain (Phase 0 me nahi ghulenge)

- Invites abhi kaam nahi karte (server endpoint Phase 2).
- Invoice counter client-side hai, user apna counter edit kar sakta hai. Server-side numbering Phase 5 me.
- Last owner direct SDK call se membership ya workspace delete kar sakta hai (rules owner/self ko allow karte hain).
- Invoice delete hard delete hai, to number gap banta hai.
- `visualizer()` har build pe chalta hai. CI me `build` job emulator tests pe depend nahi karta.
- Token API ke error details client ko jaate hain.

## Exit checklist

- [x] Unhardened `.bak` removed; rollback strategy via Git tags & Firebase Console history
- [x] Final code pe lint, build, unit, emulator tests green (real output: 49/49)
- [x] Scope-creep changes alag commits me (`d95724b`, `350d12d`)
- [x] Node version sync (package.json: 24, CI: 24, Vercel: 24)
- [x] `clear-all.js` aur `seed.js` credential + project ID confirmation guards (`process.exit(1)`)
- [x] Cutover sequence documented in `docs/CURRENT_STATE.md` §11
- [ ] Push to branch & Vercel preview smoke test pass
- [ ] Production cutover gate verification

## Agle phase ke liye gate

Phase 1 shuru karne se pehle ye decide karna hai: tenancy vocabulary (`workspaces` vs `organizations`) aur claims vs membership-doc lookup. Migration script tab tak production pe mat chalana.
