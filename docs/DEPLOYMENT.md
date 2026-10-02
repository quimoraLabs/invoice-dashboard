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
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

* **Framework Preset:** Vite
* **Build Command:** `npm run build`
* **Output Directory:** `dist`
* **Install Command:** `npm install`

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
> All variables begin with `VITE_`. Any variable omitted or lacking this prefix will not be exposed to the browser client runtime. Never put secret service account keys or private Clerk keys in client variables.

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
