# 26. SEO & Meta Tags Specification

---

## 1. Meta Tag Standards (`index.html`)

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invoice Dashboard — Fast & Professional Invoicing</title>
    <meta name="description" content="Create, track, and manage client invoices, payments, and PDF billing statements in seconds." />
    
    <!-- Open Graph / Social Sharing Meta -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Invoice Dashboard — Modern Invoicing SaaS" />
    <meta property="og:description" content="Manage client invoices, products, analytics, and printable PDF statements effortlessly." />
    <meta property="og:image" content="/og-image.png" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```
