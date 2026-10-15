# Deployment Guide
## Invomora — Production Deployment on Vercel & Firebase

---

## 1. Prerequisites & Services
Before deploying Invomora to production, verify you have active accounts for:
- **Vercel** (Hosting & Serverless Functions)
- **Clerk** (Authentication & User Management)
- **Firebase Console** (Cloud Firestore & Firebase Admin)
- **Cloudinary** (Image & Asset Uploads)
- **Google Account** (Gmail App Password for SMTP Email Alerts)

---

## 2. Environment Variables Checklist

Set these variables in your Vercel Project Settings (**Settings → Environment Variables**):

| Variable | Scope | Purpose |
| :--- | :--- | :--- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Client & Server | Clerk frontend publishable key (`pk_live_...` or `pk_test_...`) |
| `CLERK_SECRET_KEY` | Server-Only | Clerk backend secret key (`sk_live_...` or `sk_test_...`) |
| `VITE_FIREBASE_API_KEY` | Client | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Client | `<project-id>.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Client | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET`| Client | `<project-id>.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Client | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Client | Firebase App ID |
| `FIREBASE_SERVICE_ACCOUNT` | Server-Only | Complete Firebase Admin service account JSON string |
| `VITE_CLOUDINARY_URL` | Client | `https://api.cloudinary.com/v1_1/<cloud_name>/image/upload` |
| `VITE_CLOUDINARY_PRESET` | Client | Unsigned upload preset name configured in Cloudinary |
| `EMAIL_USER` | Server-Only | Gmail address used to dispatch notifications (`example@gmail.com`) |
| `EMAIL_PASS` | Server-Only | 16-character Google App Password (not your personal account password) |
| `APP_URL` | Server-Only | Production domain (e.g. `https://invomora.vercel.app`) |

---

## 3. Step-by-Step Deployment Procedure

### Step 1: Firebase Project Configuration
1. In Firebase Console, create a new Cloud Firestore database in **production mode**.
2. Deploy the security rules and composite indexes using the Firebase CLI:
   ```bash
   firebase login
   firebase deploy --only firestore:rules,firestore:indexes
   ```
3. Generate a service account:
   - Go to **Project Settings → Service Accounts**.
   - Click **Generate New Private Key**.
   - Copy the entire JSON content into the `FIREBASE_SERVICE_ACCOUNT` environment variable.

### Step 2: Clerk Authentication Configuration
1. In Clerk Dashboard, configure your Sign-in and Sign-up paths (`/login`, `/register`).
2. Add a JWT Template for Firebase:
   - Navigate to **JWT Templates → New Template → Firebase**.
   - Ensure the template name is `firebase`.
3. Add your production domain to Clerk's authorized origins.

### Step 3: Cloudinary Setup
1. In Cloudinary Console, navigate to **Settings → Upload → Upload Presets**.
2. Create an **Unsigned** upload preset (e.g. `invomora_uploads`).
3. Set `VITE_CLOUDINARY_PRESET` to this preset name.

### Step 4: Gmail SMTP App Password
1. In your Google Account, enable **2-Step Verification**.
2. Navigate to **Security → 2-Step Verification → App passwords**.
3. Create an app password named "Invomora Mailer".
4. Copy the 16-character code into `EMAIL_PASS`.

### Step 5: Vercel Git Integration & Build
1. Push your repository to GitHub / GitLab.
2. In Vercel, click **Add New Project** and import the repository.
3. Verify the build command:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. Add all environment variables listed in Section 2.
5. Click **Deploy**.

---

## 4. Rollback & Disaster Recovery
- **Instant Deployment Rollback:** In Vercel Dashboard, navigate to **Deployments**, locate the last stable deployment, and click **Promote to Production**.
- **Rules Rollback:** In Firebase Console under **Firestore → Rules → Rules History**, select and restore any previous version instantly.
