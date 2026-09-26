# 22. Error Handling & Logging Strategy

---

## 1. Error Handling Layers

1. **React Error Boundaries:** Top-level class component catching uncaught JSX rendering errors and displaying a user-friendly crash recovery UI.
2. **Async Firestore Handlers:** Wrapped in `try...catch` blocks with explicit toast alerts (`toast.error("Failed to load invoices")`).
3. **Console Log Cleanup:** In production builds, strip debug `console.log` statements using Vite build options.

---

## 2. Telemetry & Monitoring (Production Sentry Setup)
* Sentry React SDK initialized in `src/main.jsx`.
* Automatically captures unhandled exceptions, network failures, and React component stack traces.
