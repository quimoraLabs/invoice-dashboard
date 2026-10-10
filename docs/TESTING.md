# Testing Strategy & Configuration

> **Disclaimer:** Component tests (RTL) and E2E tests (Playwright) represent target testing architecture for future phases. The application currently implements **Vitest** unit tests and **Firebase Firestore Emulator** security rules & integration test suites.

---

## 1. Implemented Test Suites (Phase 0)

| Test Level | Tool | Files | Run Command |
| :--- | :--- | :--- | :--- |
| **Unit Tests** | Vitest | `test/invoice.unit.test.js`, `test/numberToWords.test.js` | `npm run test:unit` |
| **Rules Tests** | Vitest + Rules Unit Testing | `test/firestore.rules.test.js` | `npm run test:rules` |
| **Integration Tests** | Vitest + Firestore Emulator | `test/invoice.integration.test.js` | `npm run test:integration` |
| **Full Emulator Suite** | Firebase CLI + Vitest | Rules + Integration suites | `npm run test:emulator` |

---

## 2. Target Testing Architecture (Future Phases)


### A. Vitest Setup (`vitest.config.js`)
```javascript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/setupTests.js", "docs/"],
    },
  },
});
```

### B. Environment Polyfills (`src/setupTests.js`)
```javascript
import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock matchMedia for Tailwind dark mode / responsive queries
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver for Recharts responsive containers
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

### C. Playwright Configuration (`playwright.config.js`)
```javascript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 5"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 3. Mocking Strategy

### Mocking Clerk Authentication
In component tests, wrap targets with a mock `AuthContext.Provider` rather than rendering `<ClerkProvider>`:

```javascript
export const mockAuthUser = {
  uid: "usr_mock_123",
  id: "usr_mock_123",
  displayName: "Test Merchant",
  email: "test@invoice.com",
};

export const renderWithAuth = (ui, authOverrides = {}) => {
  const value = {
    currentUser: mockAuthUser,
    userLoggedIn: true,
    loading: false,
    signOut: vi.fn(),
    ...authOverrides,
  };
  return render(
    <AuthContext.Provider value={value}>
      <BrowserRouter>{ui}</BrowserRouter>
    </AuthContext.Provider>
  );
};
```

### Mocking Firestore SDK
Service layer tests mock `firebase/firestore` functions directly using `vi.mock("firebase/firestore")`:
```javascript
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  addDoc: vi.fn().mockResolvedValue({ id: "mock_doc_id" }),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => "2026-10-02T00:00:00Z"),
  getFirestore: vi.fn(),
}));
```

---

## 4. Test Specifications & Scenarios

### Unit & Component Specs:
* **Calculation Verification:** Tests verify `subtotal`, `taxAmount = (subtotal * taxRate) / 100`, and `totalAmount = subtotal + taxAmount` handle zero, negative, and floating-point decimal inputs correctly.
* **Dropdown Selection:** Tests verify `@headlessui/react` `CustomDropdown` toggles options on enter/click and calls `onChange` with the selected option value.
* **Guards & Redirects:** Tests verify `ProtectedRoute` navigates unauthenticated visitors to `/login` and renders loading spinners while session state resolves.

### Playwright E2E Specs:
1. **Invoice Creation Flow:** User logs in, visits `/invoice/create`, adds two line items, adjusts tax rate, clicks submit, and verifies new row in `/invoice`.
2. **Status Transition:** User opens invoice row action menu, selects "Mark as Paid", chooses payment method "UPI", and confirms status badge updates to `Paid`.
3. **PDF Export:** User clicks view invoice, triggers PDF download, and asserts that the PDF blob is created without console errors.
