# Documentation Master Index
## Invoice Dashboard — Production Documentation Hub

Welcome to the central documentation index for the **Invoice Dashboard** project. All specs, architectural design decisions, UI/UX guides, operational workflows, domain models, testing configs, and legal policies are categorized below across **49 comprehensive specification documents**.

---

## 📌 Root Meta & Onboarding Files
* 📄 [`PRD.md`](file:///d:/invoice-dashboard/PRD.md) — Product Requirement Document (Executive 1-Pager Summary)
* 📄 [`AGENTS.md`](file:///d:/invoice-dashboard/AGENTS.md) — AI Agent & Developer Directives, Rules, and Invariants
* 📄 [`.env.example`](file:///d:/invoice-dashboard/.env.example) — Environment configuration template
* 📄 [`docs/MASTER_CONTEXT.md`](file:///d:/invoice-dashboard/docs/MASTER_CONTEXT.md) — Master Context snippet for AI session prompts
* 📄 [`docs/ONBOARDING.md`](file:///d:/invoice-dashboard/docs/ONBOARDING.md) — 15-Minute Developer Onboarding Guide
* 📄 [`docs/GLOSSARY.md`](file:///d:/invoice-dashboard/docs/GLOSSARY.md) — Project Terminology & Domain Glossary
* 📄 [`docs/FAQ.md`](file:///d:/invoice-dashboard/docs/FAQ.md) — Frequently Asked Questions

---

## 🔴 PHASE 1 — Foundation Specs
1. 📄 [`01_PROJECT_VISION.md`](file:///d:/invoice-dashboard/docs/01_PROJECT_VISION.md) — Problem statement, goals, target personas, success metrics.
2. 📄 [`02_FEATURE_SCOPE.md`](file:///d:/invoice-dashboard/docs/02_FEATURE_SCOPE.md) — Core features, v1/v2/v3 feature matrix, out-of-scope matrix.
3. 📄 [`03_TECH_STACK_ARCHITECTURE.md`](file:///d:/invoice-dashboard/docs/03_TECH_STACK_ARCHITECTURE.md) — Technology stack, system design, data flow diagrams.
4. 📄 [`04_FOLDER_STRUCTURE_CONVENTIONS.md`](file:///d:/invoice-dashboard/docs/04_FOLDER_STRUCTURE_CONVENTIONS.md) — Directory layout, module boundaries, naming rules.
5. 📄 [`05_FIRESTORE_SCHEMA.md`](file:///d:/invoice-dashboard/docs/05_FIRESTORE_SCHEMA.md) — Collections, fields, indexes, query optimization.
6. 📄 [`06_ROUTE_MAP.md`](file:///d:/invoice-dashboard/docs/06_ROUTE_MAP.md) — Application routes, protected paths, layout wrappers, params.
7. 📄 [`07_ENVIRONMENT_VARIABLES.md`](file:///d:/invoice-dashboard/docs/07_ENVIRONMENT_VARIABLES.md) — Required environment variables, security guidelines.

---

## 🟡 PHASE 2 — Design & UX Specs
8. 📄 [`08_DESIGN_SYSTEM.md`](file:///d:/invoice-dashboard/docs/08_DESIGN_SYSTEM.md) — Color palette, Tailwind CSS v4 `@theme` code, typography scale.
9. 📄 [`09_COMPONENT_LIBRARY.md`](file:///d:/invoice-dashboard/docs/09_COMPONENT_LIBRARY.md) — Shared component props tables (15+ components).
10. 📄 [`10_UI_UX_SCREEN_FLOWS.md`](file:///d:/invoice-dashboard/docs/10_UI_UX_SCREEN_FLOWS.md) — Screen layouts, user journeys, navigation flows.
11. 📄 [`11_DARK_MODE_SPEC.md`](file:///d:/invoice-dashboard/docs/11_DARK_MODE_SPEC.md) — Dark mode design tokens, toggle behavior, persistence.
12. 📄 [`12_STATES_EMPTY_LOADING_ERROR.md`](file:///d:/invoice-dashboard/docs/12_STATES_EMPTY_LOADING_ERROR.md) — Skeleton loaders, empty state patterns, error fallbacks.
13. 📄 [`13_MICROINTERACTIONS_ANIMATIONS.md`](file:///d:/invoice-dashboard/docs/13_MICROINTERACTIONS_ANIMATIONS.md) — Transition timings, hover effects, interactive animations.
14. 📄 [`14_PDF_INVOICE_DESIGN_SPEC.md`](file:///d:/invoice-dashboard/docs/14_PDF_INVOICE_DESIGN_SPEC.md) — PDF layout, printable typography, dynamic field formatting.

---

## 🟢 PHASE 3 — Feature & Storage Specs
15. 📄 [`15_BUSINESS_SETTINGS_PROFILE.md`](file:///d:/invoice-dashboard/docs/15_BUSINESS_SETTINGS_PROFILE.md) — Business profile specs (Logo, GST/Tax, Signature, Bank details).
16. 📄 [`16_RBAC_PERMISSIONS.md`](file:///d:/invoice-dashboard/docs/16_RBAC_PERMISSIONS.md) — Role-based permissions matrix (Owner, Manager, Viewer).
17. 📄 [`17_NOTIFICATIONS_SYSTEM.md`](file:///d:/invoice-dashboard/docs/17_NOTIFICATIONS_SYSTEM.md) — Toast alerts, email dispatch specs, activity logs.
18. 📄 [`18_PAYMENT_GATEWAY.md`](file:///d:/invoice-dashboard/docs/18_PAYMENT_GATEWAY.md) — Razorpay & Stripe integration flow, webhooks, payment status sync.
19. 📄 [`19_PDF_GENERATION_ARCH.md`](file:///d:/invoice-dashboard/docs/19_PDF_GENERATION_ARCH.md) — Client vs server-side PDF generation architecture.
20. 📄 [`33_FIREBASE_STORAGE.md`](file:///d:/invoice-dashboard/docs/33_FIREBASE_STORAGE.md) — Storage bucket paths, security rules, image compression limits.

---

## 🔵 PHASE 4 — Engineering, API & Ops Specs
21. 📄 [`20_TESTING_STRATEGY.md`](file:///d:/invoice-dashboard/docs/20_TESTING_STRATEGY.md) — Unit testing, component testing, E2E testing setup.
22. 📄 [`21_DEPLOYMENT_CICD.md`](file:///d:/invoice-dashboard/docs/21_DEPLOYMENT_CICD.md) — Vercel config & GitHub Actions `.github/workflows/ci.yml`.
23. 📄 [`22_ERROR_HANDLING_LOGGING.md`](file:///d:/invoice-dashboard/docs/22_ERROR_HANDLING_LOGGING.md) — Error Boundaries, Sentry monitoring, console log cleanup.
24. 📄 [`23_SECURITY_FIRESTORE_RULES.md`](file:///d:/invoice-dashboard/docs/23_SECURITY_FIRESTORE_RULES.md) — Production Firestore security rules & auth constraints.
25. 📄 [`24_PERFORMANCE_OPTIMIZATION.md`](file:///d:/invoice-dashboard/docs/24_PERFORMANCE_OPTIMIZATION.md) — Bundle size budgets, dynamic imports, query caching.
26. 📄 [`25_ACCESSIBILITY_CHECKLIST.md`](file:///d:/invoice-dashboard/docs/25_ACCESSIBILITY_CHECKLIST.md) — ARIA guidelines, keyboard navigation, contrast compliance.
27. 📄 [`26_SEO_META.md`](file:///d:/invoice-dashboard/docs/26_SEO_META.md) — Meta tags, OpenGraph previews, HTML semantic structure.
28. 📄 [`34_FIRESTORE_COST_PAGINATION.md`](file:///d:/invoice-dashboard/docs/34_FIRESTORE_COST_PAGINATION.md) — Cursor pagination, query cost optimization, listener lifecycles.
29. 📄 [`35_DATA_MIGRATION.md`](file:///d:/invoice-dashboard/docs/35_DATA_MIGRATION.md) — Schema versioning strategy & lazy normalization logic.
30. 📄 [`36_SERVICE_LAYER_API.md`](file:///d:/invoice-dashboard/docs/36_SERVICE_LAYER_API.md) — Service layer function signatures (`src/firebase/*.js`).
31. 📄 [`37_FORM_VALIDATION_STRATEGY.md`](file:///d:/invoice-dashboard/docs/37_FORM_VALIDATION_STRATEGY.md) — Form validation rules & regex patterns.
32. 📄 [`38_ANALYTICS_TELEMETRY.md`](file:///d:/invoice-dashboard/docs/38_ANALYTICS_TELEMETRY.md) — Telemetry event taxonomy & GA4/PostHog triggers.
33. 📄 [`39_I18N_MULTI_CURRENCY.md`](file:///d:/invoice-dashboard/docs/39_I18N_MULTI_CURRENCY.md) — Multi-currency formatting (`Intl.NumberFormat`) & locale rules.

---

## 🟣 PHASE 5 — Governance, Configs & Marketing Specs
34. 📄 [`27_README_REWRITE.md`](file:///d:/invoice-dashboard/docs/27_README_REWRITE.md) — Production README template & instructions.
35. 📄 [`28_CONTRIBUTING.md`](file:///d:/invoice-dashboard/docs/28_CONTRIBUTING.md) — Git workflow, commit conventions, PR templates.
36. 📄 [`29_CHANGELOG.md`](file:///d:/invoice-dashboard/docs/29_CHANGELOG.md) — Release notes and version history.
37. 📄 [`30_ROADMAP.md`](file:///d:/invoice-dashboard/docs/30_ROADMAP.md) — Product roadmap (Short-term, Medium-term, Long-term).
38. 📄 [`31_TECH_DEBT_KNOWN_ISSUES.md`](file:///d:/invoice-dashboard/docs/31_TECH_DEBT_KNOWN_ISSUES.md) — Tech debt inventory and unresolved issues log.
39. 📄 [`32_DECISION_LOG_ADR.md`](file:///d:/invoice-dashboard/docs/32_DECISION_LOG_ADR.md) — Architecture Decision Records (ADRs).
40. 📄 [`40_TESTING_SETUP.md`](file:///d:/invoice-dashboard/docs/40_TESTING_SETUP.md) — Vitest, RTL, and Playwright configuration specs.
41. 📄 [`41_ESLINT_PRETTIER.md`](file:///d:/invoice-dashboard/docs/41_ESLINT_PRETTIER.md) — ESLint 9 flat config & Prettier code style specs.
42. 📄 [`42_VITE_CONFIG.md`](file:///d:/invoice-dashboard/docs/42_VITE_CONFIG.md) — Vite build, Rollup manualChunks, and plugin settings.
43. 📄 [`43_ERROR_CODES.md`](file:///d:/invoice-dashboard/docs/43_ERROR_CODES.md) — Application error taxonomy & user messages.
44. 📄 [`44_SCREENSHOTS_DEMO.md`](file:///d:/invoice-dashboard/docs/44_SCREENSHOTS_DEMO.md) — Screenshot asset specs & alt text catalog.
45. 📄 [`45_COMPETITOR_ANALYSIS.md`](file:///d:/invoice-dashboard/docs/45_COMPETITOR_ANALYSIS.md) — Product positioning vs Zoho, FreshBooks, and Wave.
46. 📄 [`46_LEGAL_PRIVACY_TERMS.md`](file:///d:/invoice-dashboard/docs/46_LEGAL_PRIVACY_TERMS.md) — Privacy Policy & Terms of Service clauses.
47. 📄 [`47_DEMO_VIDEO_SCRIPT.md`](file:///d:/invoice-dashboard/docs/47_DEMO_VIDEO_SCRIPT.md) — 60-second portfolio demo script.
48. 📄 [`48_ACCESSIBILITY_AUDIT.md`](file:///d:/invoice-dashboard/docs/48_ACCESSIBILITY_AUDIT.md) — axe-core audit report & remediation log.
49. 📄 [`49_BROWSER_SUPPORT.md`](file:///d:/invoice-dashboard/docs/49_BROWSER_SUPPORT.md) — Browser support matrix & polyfill strategy.
