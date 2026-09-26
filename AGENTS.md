# AGENTS.md — Agent & AI Collaboration Directives
## Invoice Dashboard Project

---

## 🎯 1. Mission Statement
This repository is a production-grade SaaS application built with **React 19**, **Vite**, **Tailwind CSS v4**, and **Firebase (Firestore & Auth)**. 

Every AI Agent and Human Contributor MUST adhere strictly to the rules, coding conventions, architectural boundaries, and documentation specs defined in this document and the `/docs` directory.

---

## 🧱 2. Core Architectural Invariants (Non-Negotiables)

1. **Strict Firestore Data Isolation:**
   * Every document stored in Firestore (`invoices`, `customers`, `products`, `business_profiles`) MUST include a `userId` field matching `auth.currentUser.uid`.
   * Queries MUST filter by `where("userId", "==", user.uid)`. No unbounded collection reads allowed.

2. **Tailwind CSS v4 Standard:**
   * Styled using CSS variables and modern utility classes `@tailwindcss/vite` in `src/index.css`.
   * Do NOT install or mix legacy Tailwind v3 config files (`tailwind.config.js`). Use native CSS `@theme` block in `src/index.css` for custom colors/fonts.

3. **React 19 & React Router v7 Rules:**
   * Hooks must follow strict React 19 standards (no invalid state mutations during render).
   * Routing is centralized in `src/App.jsx` using `useRoutes` / React Router v7 conventions.

4. **Component Isolation & Reusability:**
   * Domain-specific components belong in `src/components/{domain}/` (e.g., `src/components/invoice/`, `src/components/customer/`).
   * Generic UI components belong in `src/components/` or `src/components/modals/`.

5. **Document Before Code:**
   * Never introduce a major architectural change, new Firestore collection, or global state refactor without updating the corresponding spec file in `/docs/`.

---

## 🛠️ 3. Development Commands & Tooling Rules

* **Dev Server:** `npm run dev`
* **Production Build Verification:** `npm run build`
* **Linting:** `npm run lint`

### Validation Protocol Before Marking Tasks Completed:
1. Run `npm run build` to verify there are no TypeScript/JSX compilation or syntax errors.
2. Run `npm run lint` to catch unused imports or broken hook rules.
3. Test mobile viewports if modifying layout components.

---

## 📂 4. Project Directory Map
```
d:\invoice-dashboard\
├── PRD.md                         # Product Requirement Document
├── AGENTS.md                      # AI & Developer Directives (This file)
├── docs/                          # Exhaustive Technical & Product Specs
│   ├── INDEX.md                   # Documentation Index & Quick Nav
│   ├── MASTER_CONTEXT.md          # Master context prompt snippet
│   └── 01_* through 32_*          # Specialized specs (Phase 1 to 5)
├── src/
│   ├── App.jsx                    # App Shell & Router configuration
│   ├── index.css                  # Tailwind CSS v4 Theme & Base styles
│   ├── auth/                      # Login & Register views
│   ├── components/                # Modular shared UI & domain components
│   ├── contexts/                  # AuthContext & React Contexts
│   ├── firebase/                  # Firestore API functions & config
│   ├── header/                    # Navbar & Application header
│   └── pages/                     # Page views (Home, Invoice, Customer, Product)
```

---

## 💬 5. AI Prompting & Subagent Rules
* When starting a new development task, always refer to `/docs/MASTER_CONTEXT.md` as context.
* Keep edits surgical and localized. Do not wipe out unrelated comments or logic.
* Ensure markdown links use the `file://` scheme format when referencing codebase paths (e.g., `[App.jsx](file:///d:/invoice-dashboard/src/App.jsx)`).

---

## 🔒 6. Security & Environment Variables Guidelines
* Never expose secret keys in client-side code.
* Use `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, etc., loaded via `.env`.
* Keep `.env` out of git tracking (`.gitignore` must contain `.env`).

---

## 🚦 7. Verification Checklist
Before submitting a PR or marking a task done:
- [ ] Document updated in `/docs/` if schema/route changed.
- [ ] No hardcoded colors; standard design tokens used.
- [ ] Component handles Loading, Empty, and Error states cleanly.
- [ ] `npm run build` passes with zero errors.
