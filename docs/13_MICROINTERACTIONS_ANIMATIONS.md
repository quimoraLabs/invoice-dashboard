# 13. Microinteractions & Animation Guide

---

## 1. Animation Principles
* **Subtle & Purposeful:** Animations must enhance feedback without delaying user actions.
* **Duration Standard:** `150ms` for micro-hover states; `250ms` for modals/dropdown transitions.
* **Easing Function:** `cubic-bezier(0.4, 0, 0.2, 1)` (`ease-in-out`).

---

## 2. Standard Interactive Rules

* **Buttons:** `transition-all duration-150 active:scale-95 hover:shadow-md hover:-translate-y-0.5`
* **Table Rows:** `transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-800/50`
* **Modal Overlay Fade:** `transition-opacity duration-200 ease-out`
* **Toast Notification Slide:** Slide down from top-right (`react-hot-toast`).
