# 19. PDF Generation Architecture Document

---

## 1. Client-Side vs Server-Side Strategy

| Metric | Client-Side (`@react-pdf/renderer`) | Server-Side (Puppeteer / Node worker) |
| :--- | :--- | :--- |
| **Cost** | 💲0 (Runs in user browser) | 💲 High (Server compute / serverless memory) |
| **Latency** | ⚡ Instant (< 400ms) | 🐢 Slow (Network roundtrip + browser launch) |
| **Offline Capability**| ✅ Works completely offline | ❌ Requires server connectivity |
| **Chosen Strategy** | **Primary (Production Default)** | **Secondary (Fallback for Email Sending)** |

---

## 2. Rendering Optimization & Custom Fonts
* **Font Registration:** Pre-loads custom web fonts (Inter Regular & Inter Bold) via `Font.register` in `@react-pdf/renderer`.
* **Image Caching:** Company logos & signatures are fetched, cached in blob memory, and injected into the PDF document stream to prevent broken image renders.
