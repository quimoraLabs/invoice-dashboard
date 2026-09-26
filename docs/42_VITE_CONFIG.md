# 42. Vite Build & Optimization Configuration Specification

---

## 1. Production `vite.config.js` Code

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      filename: 'stats.html',
      open: false,
      gzipSize: true
    })
  ],
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'vendor-charts': ['recharts'],
          'vendor-pdf': ['@react-pdf/renderer']
        }
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true
  }
});
```

---

## 2. Plugin & Chunk Optimization Rationale

* **`@vitejs/plugin-react-swc`:** Fast Rust-based SWC compiler for React transformation.
* **`@tailwindcss/vite`:** Vite native plugin for Tailwind CSS v4.
* **`manualChunks` Optimization:** Separates heavy third-party vendor libraries (`firebase`, `recharts`, `@react-pdf/renderer`) into isolated lazy-loaded JS bundles to reduce initial DOM load times.
