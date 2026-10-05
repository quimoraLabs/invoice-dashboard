import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import "./index.css";
import App from "./App.jsx";

const savedTheme = window.localStorage.getItem("invoice-dashboard-theme");
if (savedTheme === "dark") {
  document.documentElement.classList.add("dark");
}

const PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  "pk_test_b3JpZW50ZWQtdGFkcG9sZS0xNjUwLmNsZXJrLmFjY291bnRzLmRldiQ";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/login">
      <App />
    </ClerkProvider>
  </StrictMode>
);

