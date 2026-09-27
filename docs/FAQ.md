# Frequently Asked Questions (FAQ)

---

## ❓ Architecture & Technical FAQs

### Q1: Why generate PDF invoices client-side with `@react-pdf/renderer` instead of server-side Node.js/Puppeteer?
**Answer:** Client-side generation costs **$0** in backend infrastructure, has **zero cold start latency**, works offline, and scales infinitely without requiring dedicated PDF worker instances.

### Q2: Why is Tailwind CSS v4 configured without a `tailwind.config.js` file?
**Answer:** Tailwind CSS v4 moves theme customization directly into CSS via `@theme` directives and `@import "tailwindcss";` in `src/index.css`. This yields faster Vite build times and cleaner variable configuration.

### Q3: How is data privacy ensured between multiple users on Firestore?
**Answer:** Data privacy is enforced across two independent defense layers:
1. **Firestore Security Rules:** Firestore rules mandate `request.auth.uid == resource.data.userId` for every read, write, update, and delete operation, completely blocking cross-user document access even via raw API calls.
2. **Application Layer Guards:** Mandatory query filters (`where("userId", "==", targetUid)`) and single-record ownership guards verify `docData.userId === targetUid` before executing any client actions.

### Q4: How do I run production build verification locally?
**Answer:** Run `cmd /c npm run build` (or `npm run build`) in the terminal.
