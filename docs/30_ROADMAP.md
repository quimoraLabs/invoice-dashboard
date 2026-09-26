# 30. Product Roadmap Document

---

## 1. Release Timeline Overview

```
Phase 1: Foundation Docs & Structural Integrity (Current)
└── Phase 2: Design Elevate, Business Profile & Dark Mode (Q4 2026)
    └── Phase 3: Payment Link Integration & RBAC (Q1 2027)
        └── Phase 4: Multi-currency, Recurring Invoices & PWA (Q2 2027)
```

---

## 2. Phase Breakdown Details

### Phase 1 — Foundation & Docs (Completed)
- [x] Standardized 32 documentation specs in `/docs`.
- [x] Root `PRD.md` and `AGENTS.md` guidelines.
- [x] Baseline React 19 + Firebase integration.

### Phase 2 — Production Polish (In Progress)
- [ ] Complete Business Profile persistence in Firestore (`business_profiles` collection).
- [ ] Logo & Digital Signature upload functionality.
- [ ] Dark Mode toggle persistence with Tailwind CSS v4 variables.
- [ ] Error Boundary & Skeleton Loading states.

### Phase 3 — Monetization & Automation (Upcoming)
- [ ] Razorpay / Stripe payment link generation.
- [ ] Webhook receiver for automatic invoice reconciliation (`Pending` -> `Paid`).
- [ ] Email dispatch via Resend / SendGrid with PDF attachment.

### Phase 4 — Enterprise & Scale
- [ ] Multi-currency conversion rates API.
- [ ] Recurring invoice automation schedule.
- [ ] PWA offline support with IndexedDB sync.
