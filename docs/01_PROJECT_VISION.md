# 01. Project Vision & Overview (PRD-Lite)

---

## 1. Problem Statement
Small business owners, freelancers, and agency operators spend hours every week managing billing manually using spreadsheets or outdated desktop software. Existing invoicing tools suffer from:
* Overly complex pricing tiers and unnecessary bloat.
* Poor mobile responsiveness (broken action menus, distorted tables).
* Inflexible PDF template customization.
* Lack of integrated, real-time revenue analytics.

---

## 2. Solution Overview
The **Invoice Dashboard** is a fast, web-based SaaS platform that empowers users to create, manage, track, and export invoices seamlessly. 

Key advantages:
* **Instant Onboarding:** Sign in with Google or Email and start invoicing in seconds.
* **Smart Cataloging:** Pre-populate item details and customer records to build invoices effortlessly.
* **Client-Side PDF Engine:** High-performance, pixel-perfect PDF rendering without waiting for backend server generation.
* **Visual Financial Insights:** Dynamic charts powered by Recharts showing monthly revenue, status breakdowns, and payment collection health.

---

## 3. Target Audience
1. **Independent Freelancers:** Designers, developers, content creators, and consultants.
2. **Small Businesses & Agencies:** Local service providers, IT agencies, marketing firms.
3. **E-commerce & Retail Vendors:** Businesses needing custom billing receipts and client statements.

---

## 4. Key Value Propositions
* **Mobile First Experience:** Seamless usability across smartphones, tablets, and desktop computers.
* **Data Security & Ownership:** Cloud sync powered by Firebase with strict multi-tenant Firestore security rules.
* **Branded Deliverables:** Custom business profile integration (Company logo, GST/Tax numbers, digital signatures, bank information).

---

## 5. Success Criteria & Metrics
| Metric | Goal | Method of Measurement |
| :--- | :--- | :--- |
| **Invoice Creation Speed** | < 60 seconds | User session timing |
| **PDF Generation Speed** | < 500ms | Client performance metrics |
| **Mobile UX Rating** | 100% layout responsiveness | Cross-device testing suite |
| **Data Integrity** | Zero cross-tenant leaks | Automated Firestore security rule validation |
