# 07. Environment Variables Specification

---

## 1. Overview
All client-side environment variables in Vite must be prefixed with `VITE_` to be exposed to the browser application bundle.

---

## 2. Environment Variables Table

| Variable Name | Required | Description | Example / Environment |
| :--- | :---: | :--- | :--- |
| `VITE_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk Publishable Key for authentication | `pk_test_...` |
| `VITE_FIREBASE_API_KEY` | ✅ | Firebase project Web API Key | `AIzaSyD-exampleKey...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase Auth domain URL | `invoice-dashboard.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | Firebase Project Identifier | `invoice-dashboard-1234` |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ | Firebase Storage Bucket URI | `invoice-dashboard-1234.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ | Firebase Cloud Messaging Sender ID | `123456789012` |
| `VITE_FIREBASE_APP_ID` | ✅ | Firebase Web App Identifier | `1:123456789012:web:abcdef...` |
| `VITE_RAZORPAY_KEY_ID` | 🔮 | Razorpay Public Key (Phase 3) | `rzp_test_xxxxxx` |

---

## 3. Template `.env.example`
Copy the following template to create `.env` locally:

```env
# Clerk Authentication Configuration
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key_here

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional Integration Keys
# VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxx
```

---

## 4. Security Practices
* Never check `.env` into git repositories (`.env` must be in `.gitignore`).
* Do NOT store private admin SDK service account keys in `VITE_` variables. Client build bundles can be unpacked and inspected by any web browser user.
