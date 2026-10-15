# Troubleshooting & FAQ
## Invomora — Solutions for Common Setup & Runtime Issues

---

## 1. Authentication & Token Bridge Issues

### Issue 1: "Authentication token expired. Please refresh."
- **Symptom:** Operations requiring session token (e.g. accepting an invite) fail with a token expiration error.
- **Cause:** Clerk session token expired or user was idle.
- **Solution:** 
  1. Reload the browser to refresh the Clerk session token.
  2. If persistent, sign out and sign in again via `/login`.

### Issue 2: Firebase Custom Token Minting Failed (`/api/create-firebase-token`)
- **Symptom:** App stays in loading state or toast displays "Firebase initialization failed".
- **Cause:** Invalid `CLERK_SECRET_KEY` or corrupt `FIREBASE_SERVICE_ACCOUNT` in environment variables.
- **Solution:**
  1. Verify `CLERK_SECRET_KEY` starts with `sk_live_...` (or `sk_test_...`) and contains no trailing spaces.
  2. Verify `FIREBASE_SERVICE_ACCOUNT` is a valid JSON string containing `project_id`, `private_key`, and `client_email`.

---

## 2. Email & Gmail SMTP Alerts

### Issue 3: "Invalid login: 535-5.7.8 Username and Password not accepted"
- **Symptom:** Invite emails or security alerts fail to send.
- **Cause:** Using your standard personal Gmail account password instead of a dedicated Google App Password.
- **Solution:**
  1. Go to **Google Account → Security → 2-Step Verification → App passwords**.
  2. Generate a new 16-character App Password (e.g. `abcd efgh ijkl mnop`).
  3. Set `EMAIL_PASS` in `.env` or Vercel environment variables to this 16-character string without spaces.

---

## 3. Security & Workspace Passcode

### Issue 4: "Incorrect security passcode entered"
- **Symptom:** Cannot accept an invite or unlock the 15-minute standby screen.
- **Cause:** The 6-digit passcode does not match `invitePasscode` on the workspace document.
- **Solution:**
  1. The workspace owner can view or regenerate their 6-digit PIN anytime in **Workspace Settings** (top navigation).
  2. Clicking **"Regenerate Passcode"** will immediately issue a fresh PIN and update all members.

### Issue 5: Standby Screen Locked with Desk Unattended
- **Symptom:** Dashboard screen is blurred and prompts for PIN.
- **Solution:** Enter the workspace's 6-digit passcode. If 3 failed attempts occur, an email alert is sent to the workspace owner and logged in `/activity-log`.

---

## 4. Styling & Build Tooling

### Issue 6: VS Code highlights `@theme` or `@custom-variant` in red
- **Symptom:** CSS editor shows "Unknown at rule @theme" or "Unknown at rule @custom-variant".
- **Cause:** Standard VS Code CSS parser doesn't natively recognize Tailwind CSS v4 syntax yet.
- **Solution:** Add the following to `.vscode/settings.json`:
  ```json
  {
    "css.lint.unknownAtRules": "ignore"
  }
  ```

---

## 5. Testing & Emulator

### Issue 7: `npm run test:rules` fails with "Java not found"
- **Symptom:** Firebase emulator suite fails to start.
- **Cause:** Firebase Firestore Emulator requires Java JRE/JDK 11+ (recommended Java 21).
- **Solution:**
  1. Install Java 21 (OpenJDK / Eclipse Temurin).
  2. Verify `java -version` returns a valid Java runtime.
  3. Run `npm run test:unit` if you only want to test client logic without the Firestore emulator.
