# 28. Contributing Guidelines

---

## 1. Branch Naming Strategy
* `feat/feature-name` — New feature additions (e.g. `feat/business-profile`).
* `fix/bug-name` — Bug fixes (e.g. `fix/mobile-action-menu`).
* `docs/doc-name` — Documentation updates (e.g. `docs/firestore-schema`).
* `refactor/scope` — Code restructuring without functional changes.

---

## 2. Commit Message Standards (Conventional Commits)
Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

* `feat(invoice): add tax calculation helper`
* `fix(mobile): resolve action menu popover overflow on small screens`
* `docs(readme): rewrite README with installation instructions`
* `style(theme): update Tailwind CSS v4 primary indigo theme variables`

---

## 3. Pull Request Checklist
Before requesting review:
1. Ensure `npm run lint` passes without errors.
2. Verify production build passes via `npm run build`.
3. Check mobile responsiveness across standard viewport sizes.
