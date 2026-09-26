# 25. Accessibility (a11y) Checklist

---

## 1. Compliance Standards (WCAG 2.1 Level AA)

- [ ] **Color Contrast:** Text-to-background contrast ratio meets at least 4.5:1 (evaluated in both Light and Dark mode).
- [ ] **Keyboard Navigation:** All interactive elements (`<button>`, `<a href>`, `<input>`, `<select>`) possess focus indicators (`focus-visible:ring-2 focus-visible:ring-indigo-500`).
- [ ] **Form Labels:** Every form input has an associated `<label htmlFor="...">` or `aria-label`.
- [ ] **Icon Buttons:** Action buttons containing only icons (e.g. `react-icons`) include `aria-label="Delete Invoice"` or screen reader text (`<span className="sr-only">Edit</span>`).
- [ ] **Modal Dialogs:** Modals trap focus, close on `Esc` key press, and provide `aria-modal="true"`.
