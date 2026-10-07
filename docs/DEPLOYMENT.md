# Deployment & CI/CD Pipeline

This application is configured for continuous integration via GitHub Actions and static single-page application (SPA) deployment on Vercel.

---

## 1. Build Process

* **Build Command:** `npm run build` (invokes `vite build`)
* **Output Directory:** `dist/`
* **Development Server:** `npm run dev` (Vite dev server on port 5173)
* **Linting:** `npm run lint` (ESLint 10 with React 19 hook rules)

### Build Pipeline Stages:
1. `vite build` bundles JavaScript modules using `@vitejs/plugin-react-swc`.
2. `@tailwindcss/vite` processes `src/index.css` into atomic production styles.
3. Assets in `/public` (`roboto.ttf`, favicons) are mirrored directly into `dist/`.
4. Outputs optimized vendor chunks with hashed filenames.

---

## 2. Vercel Configuration (`vercel.json`)

To enable client-side routing with React Router v7 and prevent 404 errors on browser page reloads:

```json
{
  "env": {
    "NODE_OPTIONS": "--experimental-require-module"
  },
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/" }
  ]
}
```

* **Framework Preset:** Vite
* **Build Command:** `npm run build`
* **Output Directory:** `dist`
* **Install Command:** `npm install`


### 2.1 Serverless Function (`api/create-firebase-token.js`)

Exchanges a Clerk session JWT for a Firebase custom token.

- **Endpoint:** `POST /api/create-firebase-token`
- **Input:** `{ clerkToken: string }` (Clerk JWT)
- **Output:** `{ firebaseToken: string }` (Firebase custom token)
- **Purpose:** Bridges Clerk authentication with Firebase Auth so Firestore security rules can evaluate `request.auth.uid`.

**Required server-side environment variables:**
- `CLERK_SECRET_KEY` — Clerk Secret Key (`sk_test_...` or `sk_live_...`)
- `FIREBASE_SERVICE_ACCOUNT` — Firebase Admin SDK service account JSON (single line or base64)

> [!CAUTION]
> Both variables are server-side only. Never prefix with `VITE_`. Never commit to Git.
---

## 3. Environment Variables Configuration

Configure the following variables in the **Vercel Project Settings → Environment Variables** and your local `.env`:

| Variable Name | Environment | Description |
| :--- | :---: | :--- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Production / Dev | Clerk Publishable Key for user authentication |
| `VITE_FIREBASE_API_KEY` | Production / Dev | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Production / Dev | Firebase Authentication Domain |
| `VITE_FIREBASE_PROJECT_ID` | Production / Dev | Cloud Firestore Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Production / Dev | Cloud Storage Bucket URI |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Production / Dev | Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Production / Dev | Firebase Web Application ID |

> [!IMPORTANT]
> All client variables begin with `VITE_`. Any variable omitted or lacking this prefix will not be exposed to the browser client runtime. Never put secret service account keys or private Clerk keys in client variables.

### 3.1 Server-Side Migration Environment Variables

For running backend migration scripts (`scripts/migrate-to-b2b.js`), Cloud Functions, or CI administrative jobs, the following server-side environment variables are required:

| Variable Name | Environment | Description |
| :--- | :---: | :--- |
| `CLERK_SECRET_KEY` | Server / CLI (`scripts/`) | Clerk Secret Key (`sk_live_...` or `sk_test_...`) for server-side private_metadata updates and user iteration |
| `GOOGLE_APPLICATION_CREDENTIALS` | Server / CLI (`scripts/`) | Absolute path to the Firebase Admin Service Account JSON key file for privileged Firestore operations |

> [!CAUTION]
> Server-side variables and service account credentials MUST NEVER be prefixed with `VITE_` and MUST NEVER be committed to Git or exposed in client bundles. Ensure `*.json` service accounts and `.env` are listed in `.gitignore`.

---

## 4. GitHub Actions CI/CD Workflow

Create `.github/workflows/deploy.yml` to automate quality checks and continuous deployment on every push to `main`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-build:
    name: Lint & Build Validation
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Setup Node.js Runtime
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - name: Install Dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Build Application Bundle
        run: npm run build
        env:
          VITE_CLERK_PUBLISHABLE_KEY: ${{ secrets.VITE_CLERK_PUBLISHABLE_KEY }}
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}

  deploy:
    name: Production Deployment
    needs: lint-and-build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Vercel Production Deploy
        run: echo "Vercel automatically triggers production build on branch push."
```

---

## 5. Deployment Verification Checklist

- [ ] All required `VITE_` variables set in Vercel project environment settings.
- [ ] Clerk production instance domain authorized in Clerk Dashboard.
- [ ] Vercel domain added to Firebase Console under **Authentication → Settings → Authorized domains**.
- [ ] `firestore.rules` deployed to target Firebase project.
- [ ] Deep links (e.g. `/invoice/view/inv_123`) resolve to `index.html` via `vercel.json` rewrites.

---

## 6. Local Media Storage (Floci)

For local offline development and automated testing, the project supports **Floci** (a lightweight, local S3-compatible service emulator) instead of connecting to Cloudinary.

### 6.1 Starting the Floci Emulator
Run the Docker Compose service from the project root:
```bash
docker compose -f docker-compose.floci.yml up -d
```
The emulator listens on port `4566` (`http://localhost:4566`). Persistent data is stored in the local `floci-data/` directory (git-ignored).

### 6.2 Testing & Managing via AWS CLI
Configure the AWS CLI with dummy credentials and endpoint override:
```bash
# List local buckets
aws --endpoint-url=http://localhost:4566 s3 ls

# Create bucket manually (if needed)
aws --endpoint-url=http://localhost:4566 s3 mb s3://invoicing-media-local

# Inspect uploaded media items
aws --endpoint-url=http://localhost:4566 s3 ls s3://invoicing-media-local/
```

### 6.3 Enabling Floci in the App
Add to your `.env.local`:
```bash
VITE_USE_FLOCI=true
VITE_FLOCI_ENDPOINT=http://localhost:4566
VITE_FLOCI_ACCESS_KEY=test
VITE_FLOCI_SECRET_KEY=test
VITE_FLOCI_BUCKET=invoicing-media-local
```
When `VITE_USE_FLOCI=false` or unset (default in production / Vercel), media uploads automatically use Cloudinary.

### 6.4 Stopping the Floci Emulator
```bash
docker compose -f docker-compose.floci.yml down
```

