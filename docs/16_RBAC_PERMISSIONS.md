# 16. Role-Based Access Control (RBAC) Specification

---

## 1. Role Matrix (Phase 3 Roadmap)

| Capability / Action | Owner | Manager | Viewer |
| :--- | :---: | :---: | :---: |
| View Invoices & Analytics | ✅ | ✅ | ✅ |
| Create / Edit Invoices | ✅ | ✅ | ❌ |
| Delete Invoices | ✅ | ❌ | ❌ |
| Manage Business Branding / Settings | ✅ | ❌ | ❌ |
| Manage Team Members & Roles | ✅ | ❌ | ❌ |
| Export Data & Download PDF | ✅ | ✅ | ✅ |

---

## 2. Enforcement Mechanisms
1. **UI Layer Gating:** Action buttons (Delete, Edit, Settings) conditionally render based on `userRole` in `AuthContext`.
2. **Firestore Security Rules:** Validates `request.auth.token.role` before write/delete permissions are granted.
