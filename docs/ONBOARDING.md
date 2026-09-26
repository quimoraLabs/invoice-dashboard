# Developer Onboarding Guide

Welcome to the **Invoice Dashboard** engineering team! Follow this step-by-step checklist to get your local environment running in under 15 minutes.

---

## 📋 Day 1 Onboarding Checklist

### 1. Prerequisites Check
Ensure your machine has the following tools installed:
- Node.js (v18.0.0+) -> Check with `node -v`
- Git -> Check with `git --version`

### 2. Repository Setup
```bash
git clone https://github.com/your-username/invoice-dashboard.git
cd invoice-dashboard
npm install
```

### 3. Environment Configuration
Copy the template to create `.env`:
```bash
cp .env.example .env
```
Fill in valid Firebase credentials in `.env` (or request dev credentials from team lead).

### 4. Required Reading List
Before submitting code, read these 3 key meta documents:
1. 📄 [`PRD.md`](file:///d:/invoice-dashboard/PRD.md) — Product vision & scope
2. 📄 [`AGENTS.md`](file:///d:/invoice-dashboard/AGENTS.md) — Coding conventions & guidelines
3. 📄 [`docs/05_FIRESTORE_SCHEMA.md`](file:///d:/invoice-dashboard/docs/05_FIRESTORE_SCHEMA.md) — Database schema

### 5. Start Local Dev Server
```bash
npm run dev
```
Navigate to `http://localhost:5173` to test local sign-in and invoice creation!
