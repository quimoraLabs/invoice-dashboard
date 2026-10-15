# Contributor & Developer Guide
## Invomora — Engineering Standards & Contribution Rules

---

## 1. Golden Invariants & Core Rules
All contributors, developers, and AI agents must strictly follow these invariants:

1. **Tenancy Vocabulary:** Always use `workspace` (`workspaceId`, `workspaces`, `workspace_members`, `workspace_invites`). Never introduce `orgId` or `organization`.
2. **Protected Files (DO NOT TOUCH without user approval):**
   - `src/contexts/authContext/*`
   - `api/create-firebase-token.js`
   - `vite.config.js` (auth middleware section)
   - `firestore.rules`
   - `.env*` and service account files
3. **Tailwind CSS v4:** Use `@theme` tokens in `src/index.css`. Never create `tailwind.config.js`. Use design tokens (`bg-primary`, `text-foreground`, `border-border`) instead of hardcoded hex values.
4. **GST Business Rules:**
   - Sequential gapless invoice numbering via transactional counters.
   - 90-day maximum backdating policy; future dates are blocked.
   - Amount in words in Indian currency system (Lakhs & Crores).

---

## 2. Git Branching & Workflow

### 2.1 Branching Strategy
- `main`: Protected production branch.
- Feature / Phase branches: `phase-<number>-<feature-name>` (e.g., `phase-0-hardening`, `feature-payment-gateway`).
- Fix branches: `fix/<issue-name>`.

### 2.2 Commit Message Standard
Follow Conventional Commits:
- `feat: add 15-minute standby inactivity lock with passcode prompt`
- `fix: prevent duplicate invite emails on retry`
- `docs: update 8 standard documentation files`
- `test: add emulator test for double security invite acceptance`

---

## 3. Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/quimoraLabs/invoice-dashboard.git
cd invoice-dashboard

# 2. Install dependencies
npm install

# 3. Copy environment configuration
cp .env.example .env.local

# 4. Start local development server
npm run dev
```

---

## 4. Pre-Commit Verification Checklist
Before pushing any code or opening a Pull Request, you MUST run and pass all four checks:

```bash
# 1. Run Unit Tests (Vitest)
npm run test:unit

# 2. Run Firestore Security Rules Tests (Emulator)
npm run test:rules

# 3. Run Linter
npm run lint

# 4. Run Production Build
npm run build
```

---

## 5. Mobile & Responsive Standards
- Always test mobile viewports (`375px`, `414px`) and desktop viewports (`1280px+`).
- Use the mobile navigation drawer for small screens.
- Ensure all forms, dialogs, and tables scroll smoothly horizontally without overflowing the page viewport.
